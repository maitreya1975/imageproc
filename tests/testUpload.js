var req = {
    session: {
        userid: 'abc'
    },
    query: {
        bucket: 'maitreyr-imageproc',
        key: 'uploads/6dff9e70-ac65-11e3-a6fa-0105f3c1ded6',
    }
};

var res;

var upload = require('../routes/upload.js');

upload.handleUpload(req, res);
