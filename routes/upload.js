var AWS = require('aws-sdk');
var consts = require('../libs/consts.js');

exports.handleUpload = function(req, res) {
    // sample of S3 redirect:
    // GET /?bucket=maitreyr-imageproc&key=uploads%2Fe5558910-aa5f-11e3-8756-e1b87c4b723a&etag=%2269002b5c4d00a2c3b60bb8355b919e32%22 200 22ms - 396b
    if(req.session.userid == undefined) {
        throw new LoginError("Not logged in");
    }

    // set the region
    AWS.config.update({region: consts.region});
    // TODO: move uploaded file 
    //

    var s3 = new AWS.S3();
    var s3prefix = s3.endpoint.href;
    // Sample: https://s3-us-west-2.amazonaws.com/maitreyr-imageproc/uploads/e5558910-aa5f-11e3-8756-e1b87c4b723a
    var orgImg = s3prefix + req.query.bucket + "/" + req.query.key;
    var dstFolder = s3prefix + req.query.bucket + "/" + req.session.userid + "/";

    // send message to InputTopic
    var message = {
        userid: req.session.userid,
        orgImg: orgImg,
        dstFolder: dstFolder
    };

    console.log(JSON.stringify(message, null, " "));

    res.redirect("/users");
};
