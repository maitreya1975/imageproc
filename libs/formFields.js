var crypto = require('crypto');
var uuid = require('node-uuid');
var consts = require('./consts.js');
var AWS = require('aws-sdk');

exports.getformfields = function(req) {
    var accesskeyid = AWS.config.credentials.accessKeyId;
    var secretkey = AWS.config.credentials.secretAccessKey;
    var securityToken = AWS.config.credentials.sessionToken;
    var successRedirectURL = consts.urlProtocol + req.headers.host + consts.s3upload.successRedirectPath;

    var now = new Date();
    var expires = new Date();
    expires.setTime(now.getTime() + consts.s3upload.validityPeriod);

    var expiresstr = expires.toISOString();
    console.log("Expires Date= %s", expiresstr);

    var filename = uuid.v1();

    var s3key = consts.s3upload.folder  + '/' + filename;

    var policy = {
        expiration: expiresstr,
        conditions: [ 
            {bucket: consts.s3upload.bucket}, 
            {key: s3key},
            {acl: consts.s3upload.acl},
            {success_action_redirect: successRedirectURL},
            {"x-amz-security-token": securityToken},
            ["starts-with", "$Content-Type", consts.s3upload.contentTypePrefix],
            ["content-length-range", 0, consts.s3upload.maxSize]
        ]
    };

    var policystr = JSON.stringify(policy);
    console.log("Policy String = (%s)", policystr);

    var buf = new Buffer(policystr);
    var policy_base64 = buf.toString('base64');
    console.log("Policy String base64= (%s)", policy_base64);

    var hmac = crypto.createHmac('sha1', secretkey);
    hmac.write(policy_base64, 'utf-8');
    var signature_base64 = hmac.digest('base64');

    console.log("Signature base64= (%s)", signature_base64);
    
    var actionURL = "https://" + consts.s3upload.bucket + ".s3.amazonaws.com";
    // https://maitreyr-imageproc.s3.amazonaws.com

    // set results in a JSON object:
    var ret = {
	actionURL: actionURL,
        accesskeyid: accesskeyid,
	securityToken: securityToken,
	acl: consts.s3upload.acl,
	successRedirectURL: successRedirectURL,
        policy: policy_base64,
        signature: signature_base64,
        key: s3key,
	contentTypePrefix: consts.s3upload.contentTypePrefix
    }

    return ret;
}

