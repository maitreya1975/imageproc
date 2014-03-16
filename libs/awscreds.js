var AWS = require('aws-sdk');

exports.getCreds = function(callback) {
	// return with AWS SDK crdentials if already available (e.g. via Env variables, etc.)
	if(AWS.config.credentials != undefined) {
		callback(AWS.config.credentials);
		return;
	}

	// console.log("Getting metadata");
	var metadatacreds = new AWS.EC2MetadataCredentials({host: '169.254.169.254'});
	metadatacreds.get(waitForGet); 

	function waitForGet(err) {
		if(err) throw err;
		// console.log("Reached waitForGet creds = ", JSON.stringify(metadatacreds));
		callback(metadatacreds);
	}
}
