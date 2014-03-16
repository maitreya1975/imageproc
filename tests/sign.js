var AWS = require('aws-sdk');
var s3params = {"Bucket":"maitreyr-imageproc","Key":"xxx/org/c88c20c0-ad37-11e3-9abf-8fdd8e60f6c0"}
        var s3 = new AWS.S3();
		console.log("getSignedUrl params=", JSON.stringify(s3params));
                var url = s3.getSignedUrl('getObject', s3params);
		console.log("SignedUrl= ", url);
