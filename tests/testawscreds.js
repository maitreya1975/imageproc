var creds = require('../libs/awscreds.js');

creds.getCreds(printCreds);

function printCreds(creds) {
	console.log("creds=", JSON.stringify(creds));
}
