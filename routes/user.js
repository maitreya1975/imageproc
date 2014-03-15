/* GET users listing. */
var form = require('../libs/formFields');

exports.list = function(req, res) {
    var userid = req.session.userid;
    
    var imageList = [
        {
            orgImg:"http://www.nps.gov/yose/photosmultimedia/upload/sentineldome-key.jpg",
            sepiaImg:"http://tourists360.com/wp-content/uploads/2013/12/Yosemite-National-Park-8.jpg",
            montageImg:"http://sierrafoothillgarden.files.wordpress.com/2011/03/yosemite-karen-greg-40.jpg"
        }
    ];
    var formFields = form.getformfields(req) 
    console.log('Form Fields=%s', JSON.stringify(formFields, null, " "));

    res.render('users', {
        userid: userid, 
        imageList: imageList,
        formFields: formFields
    });
};

exports.login = function(req, res) {
    req.session.userid = req.body.userid;
    res.redirect("/users");
};
