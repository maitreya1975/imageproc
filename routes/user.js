/* GET users listing. */
var form = require('../libs/formFields');
var AWS = require('aws-sdk');
var consts = require('../libs/consts.js');

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

    params = {
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
            if(item.transforms == undefined) return; // don't process the transforms set if it is missing

            var renditions = item.transforms.SS;

            renditions.forEach(function(format) {
                imgEntry[format + "Img"]= userid + '/' + format + '/' + imgId;
            });
            imageList.push(imgEntry);
        });

        console.log("ImageList: ", JSON.stringify(imageList));

        var s3SignedURLs = getS3SignedURLs(imageList);

        var formFields = form.getformfields(req) 
            console.log('Form Fields=%s', JSON.stringify(formFields, null, " "));

        res.render('users', {
            userid: userid, 
            imageList: s3SignedURLs,
            formFields: formFields
        });
    }

    function getS3SignedURLs(imageList) {
        var s3SignedURLs = new Array();
        var s3 = new AWS.S3();

        for(var i = 0; i < imageList.length; ++i) {
            var newObj = new Object();
            for(var p in imageList[i]) {
                var key = imageList[i][p];

                var params = {
                    Bucket: consts.s3upload.bucket,
                    Key: key
                };
                var url = s3.getSignedUrl('getObject', params);
                
                newObj[p] = url;

            }
            s3SignedURLs.push(newObj);
        }
        return s3SignedURLs;
    }
}


exports.login = function(req, res) {
    req.session.userid = req.body.userid;
    res.redirect("/users");
};
