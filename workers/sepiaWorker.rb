require 'rubygems'
require 'aws-sdk'
require 'json'

AWS.config(:region => 'us-west-2')
queue = AWS::SQS.new.queues.named('SepiaQ')
bucket = AWS::S3.new.buckets['maitreyr-imageproc']
tmpdir = '/tmp/imageproc/sepia'
sepiaThreshold = '80%'

queue.poll do | msg | 
    puts "Complete message: #{msg.body}"
    bodyHash = JSON.parse(msg.body)
    puts "Message Payload: #{bodyHash['Message']}"
    msgHash = JSON.parse(bodyHash['Message'])
    userid = msgHash['userid']
    imgId = msgHash['imgId']
    orgFilename = tmpdir + '/' + imgId

    puts "userid=#{userid}, imgId=#{imgId}"

    # slurp file into a tmp file in the tmp directory
    img = bucket.objects[userid + "/org/" + imgId]
    File.open(orgFilename, "wb") do |file|
        img.read do |chunk|
            file.write(chunk)
        end
    end

    # call imagemagic to sepiatone it
    sepiaFilename = orgFilename + '_sepia'

    cmd = "convert -sepia-tone 80% #{orgFilename} #{sepiaFilename}"
    puts "Running command: #{cmd}"
    result = `#{cmd}`
    
    # upload converted image to S3 as key '<userid>/sepia/<imgId>' 
    key = userid + "/sepia/" + imgId
    puts "Uploading converted image to key: #{key}"
    sepia = bucket.objects[key]
    sepia.write(Pathname.new(sepiaFilename))

    # write to dynamodb the rendering
    dynamoDB = AWS::DynamoDB.new
    table = dynamoDB.tables['ImageProc']
    table.hash_key = [:userid, :string]
    table.range_key = [:filename, :string]

    puts "Updating DynamoDB item to add transform"
    item = table.items[userid, imgId]
    newItem = item.attributes.add({:transforms => ["sepia"]}); # add 'sepia' to the set of transforms

    puts "Updated item = #{newItem}"

    puts "Finished with this message, polling for more"
end
