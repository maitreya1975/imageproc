module.exports = {
    s3upload: {
            bucket: 'maitreyr-imageproc',
            validityPeriod: 30*60*1000, // upload expires in 30 minutes
            folder: 'uploads',
            acl: 'private',
            successRedirect: 'http://localhost:8080/upload',
            maxSize: 1024*1024*10, // 10 MB max upload size
            contentTypePrefix: 'image/jpeg'
        },
    region: 'us-west-2'
}
