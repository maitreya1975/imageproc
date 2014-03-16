/* GET users listing. */
var form = require('../libs/formFields');
var AWS = require('aws-sdk');
var consts = require('../libs/consts.js');
var creds = require('../libs/awscreds.js');

function handleErr(err) {
    if(err) {
        console.log(err, err.stack);
        throw err;
    }
}

exports.list = function(req, res) {
    if(req.session.userid == undefined) {
        throw new LoginError("Not logged in");
    }
    var userid = req.session.userid;

    // set the region
    AWS.config.update({region: consts.region});
    var dynamoDB = new AWS.DynamoDB();

    var params = {
        TableName: consts.dynamoDB.tableName,
        KeyConditions: {
            userid: {
                ComparisonOperator: 'EQ',
                AttributeValueList: [
                    {
                                S: userid
                    }
                ]
            }
        }
    }

    console.log("Querying DynamoDB: params = ", JSON.stringify(params));
    dynamoDB.query(params, processImages);

    function processImages(err, data) {
        handleErr(err);

        console.log("Data:", JSON.stringify(data));
        var imageList = new Array();

        data.Items.forEach(function(item) {
            var imgId = item.filename.S;

            var imgEntry = {
                orgImg: userid + '/' + 'org' + '/' + imgId
            };
	    if(item.transforms != undefined)  {
	    	var renditions = item.transforms.SS;
		renditions.forEach(function(format) {
			imgEntry[format + "Img"]= userid + '/' + format + '/' + imgId;
			});
	    }
            imageList.push(imgEntry);
        });

        console.log("ImageList: ", JSON.stringify(imageList));

        var s3SignedURLs = getS3SignedURLs(imageList, useSignedURLs);
	function useSignedURLs(s3SignedURLs) {
		console.log("Signed URLS:", JSON.stringify(s3SignedURLs));

		form.getformfields(req, renderForm);

		function renderForm(formFields) { 
			console.log('Form Fields=%s', JSON.stringify(formFields, null, " "));

			res.render('users', {
				userid: userid, 
				imageList: s3SignedURLs,
				formFields: formFields
			});
		}
	 }
    }

    function getS3SignedURLs(imageList, callback) {
	creds.getCreds(useCreds);

	function useCreds(creds) {
		var s3SignedURLs = new Array();
		var s3 = new AWS.S3({credentials: creds});

		for(var i = 0; i < imageList.length; ++i) {
			var newObj = new Object();
			for(var p in imageList[i]) {
				var key = imageList[i][p];

				var s3params = {
					Bucket: consts.s3upload.bucket,
					Key: key
				};
				console.log("getSignedUrl params=", JSON.stringify(s3params));
				var url = s3.getSignedUrl('getObject', s3params);
				console.log("SignedUrl= ", url);

				newObj[p] = url;

			}
			s3SignedURLs.push(newObj);
		}
		callback(s3SignedURLs);
	}

	}
}


exports.login = function(req, res) {
    req.session.userid = req.body.userid;
    res.redirect("/users");
};
