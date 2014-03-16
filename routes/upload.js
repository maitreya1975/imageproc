var AWS = require('aws-sdk');
var consts = require('../libs/consts.js');

function handleErr(err) {
    if(err) {
        console.log(err, err.stack);
        throw err;
    }
}

exports.handleUpload = function(req, res) {
    // sample of S3 redirect:
    // GET /?bucket=maitreyr-imageproc&key=uploads%2Fe5558910-aa5f-11e3-8756-e1b87c4b723a&etag=%2269002b5c4d00a2c3b60bb8355b919e32%22 200 22ms - 396b
    if(req.session.userid == undefined) {
        throw new LoginError("Not logged in");
    }
    // set the region
    AWS.config.update({region: consts.region});
    var params;
    var awsreq;
    var imgId = req.query.key.replace(consts.s3upload.folder + "/", "");
    var s3 = new AWS.S3();

    copyS3Object();

    function copyS3Object(err, data) {
        handleErr(err);
        var orgImgKey = req.session.userid + "/" + consts.orgFolder + "/" + imgId; // userid / <orgFolder> / just the filename in the upload folder

        // Copy uploaded file from consts.s3uploads.folder/<filename> to <userid>/<orgFolder>/<filename>
        params = {
            CopySource: req.query.bucket + "/" + req.query.key,
            Bucket: req.query.bucket,
            Key: orgImgKey,
            ACL: consts.s3upload.acl,
            MetadataDirective: 'COPY'
        };

        console.log("Copying s3 object: params = ", JSON.stringify(params));
        s3.copyObject(params, deleteS3Object);
    }

    function deleteS3Object(err, data) {
        handleErr(err);

        // Delete uploaded file
        params = {
            Bucket: req.query.bucket,
            Key: req.query.key
        };

        console.log("Deleting s3 object: params = ", JSON.stringify(params));
        s3.deleteObject(params, writeDynamoDB);
    }

    function writeDynamoDB(err, data) {
        handleErr(err);

        // Store orgImg associated with userid
        var dynamoDB = new AWS.DynamoDB();

        params = {
            Item: {
                      userid: {
                                  S: req.session.userid
                              },
                      filename: {
                                    S: imgId
                                },
                      bucket: {
                                  S: req.query.bucket
                              }
                  },
            TableName: consts.dynamoDB.tableName,
            ReturnValues: "NONE"
        };

        console.log("Writing to DynamoDB: params = ", JSON.stringify(params));

        dynamoDB.putItem(params, publishMessage);
    }

    function publishMessage(err, data) {
        handleErr(err);
        // construct message JSON
        var message = {
            userid: req.session.userid,
            imgId: imgId
        };
        var messagestr = JSON.stringify(message);

        var sns = new AWS.SNS();

        params = {
            Message: messagestr,
            TopicArn: consts.sns.topicArn
        };

        console.log("Writing to Topic: params = ", JSON.stringify(params));
        sns.publish(params, finishAndReturn);
    }

    function finishAndReturn(err, data) {
        handleErr(err);
        var messageId = data.MessageId;
        console.log("SNS MessageId:", messageId);

        console.log("Redirecting to /users");
        res.redirect("/users");
    }
};
