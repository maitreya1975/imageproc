require 'rubygems'
require 'aws-sdk'
require 'json'

def s3download(key, fileName)
    # slurp object with key into fileName
    bucket = AWS::S3.new.buckets['maitreyr-imageproc']
    obj = bucket.objects[key]
    File.open(fileName, "wb") do |file|
        obj.read do |chunk|
            file.write(chunk)
        end
    end
end

def s3upload(fileName, key)
    bucket = AWS::S3.new.buckets['maitreyr-imageproc']
    dest = bucket.objects[key]
    dest.write(Pathname.new(fileName))
end

def transform(userid, orgFilename)
    case @workerType
    when "sepia"
        sepiaTransform(orgFilename)
    when "montage"
        montageTransform(userid)
    end
end

def sepiaTransform orgFilename
    sepiaThreshold = '80%'

    # call imagemagic to sepiatone it
    sepiaFilename = orgFilename + '_sepia'

    cmd = "convert -sepia-tone #{sepiaThreshold} #{orgFilename} #{sepiaFilename}"
    puts "Running command: #{cmd}"
    result = `#{cmd}`

    return sepiaFilename
end

def montageTransform(userid)
    # fetch up to past 5 images and montage them
    # query list of images from dynamodb for this userid
    dynamoDB = AWS::DynamoDB.new
    table = dynamoDB.tables['ImageProc']
    table.hash_key = [:userid, :string]
    table.range_key = [:filename, :string]

    imageList = Array.new

    puts "Fetching from DynamoDB records for userid: #{userid}"
    table.items.query(:hash_value => userid) do |item|
        puts "Fetched Item=#{item}"
        imageid = item.attributes['filename']
        puts "Adding imageId=#{imageid}"
        imageList.push(imageid)
    end

    montageList = imageList[0..5]

    puts "Montaging #{montageList}"
    # download org files

    orgFiles = Array.new

    montageList.each do |id|
        key = userid + "/org/" + id
        fileName = @tmpdir + '/' + id
        s3download(key, fileName)
        orgFiles.push(fileName)
    end

    fileList = orgFiles.join(" ")
    outFile = @tmpdir + '/' + 'montage.jpg'

    result = `./polaroid.sh #{outFile} #{fileList}`

    return outFile
end

@workerType = ARGV[0]
if(!@workerType || !(@workerType=="sepia" || @workerType=="montage")) 
    puts "Usage: ruby #{__FILE__} (sepia|montage)"
    exit 1
end
puts "WorkerType: #{@workerType}"

AWS.config(:region => 'us-west-2')
queueNames = {'sepia' => 'SepiaQ', 'montage' => 'MontageQ'}

puts "QueueName: #{queueNames[@workerType]}"

queue = AWS::SQS.new.queues.named(queueNames[@workerType])
@tmpdir = "/tmp/imageproc/#{@workerType}"

queue.poll do | msg | 
    puts "Complete message: #{msg.body}"
    bodyHash = JSON.parse(msg.body)
    puts "Message Payload: #{bodyHash['Message']}"
    msgHash = JSON.parse(bodyHash['Message'])
    userid = msgHash['userid']
    imgId = msgHash['imgId']
    orgFilename = @tmpdir + '/' + imgId

    puts "userid=#{userid}, imgId=#{imgId}"

    s3download(userid + "/org/" + imgId, orgFilename)

    transformedFilename = transform(userid, orgFilename)

    # upload converted image to S3 as key '<userid>/<workerType>/<imgId>' 
    key = userid + "/#{@workerType}/" + imgId
    puts "Uploading converted image to key: #{key}"
    s3upload(transformedFilename, key)

    # write to dynamodb the rendering
    dynamoDB = AWS::DynamoDB.new
    table = dynamoDB.tables['ImageProc']
    table.hash_key = [:userid, :string]
    table.range_key = [:filename, :string]

    puts "Updating DynamoDB item to add transform"
    item = table.items[userid, imgId]
    newItem = item.attributes.add({:transforms => [@workerType]}); # add '<@workerType>' to the set of transforms

    puts "Updated item = #{newItem}"

    puts "Finished with this message, polling for more"
end
