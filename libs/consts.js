module.exports = {
    s3upload: {
        bucket: 'maitreyr-imageproc',
        validityPeriod: 30*60*1000, // upload expires in 30 minutes
        folder: 'uploads',
        acl: 'private',
        successRedirectPath: '/upload',
        maxSize: 1024*1024*10, // 10 MB max upload size
        contentTypePrefix: 'image/jpeg'
    },
    region: 'us-west-2',
    urlProtocol: 'http://', // prefix for all URLs coming back to this site
    orgFolder: 'org',
    dynamoDB: {
        tableName: 'ImageProc'
    },
    sns: {
        topicArn: 'arn:aws:sns:us-west-2:655804063428:inputTopic'
    }
}
