var config = require("../config/config")
var common = require("../config/common")
var db = require('../config/database')
var path = require("path")
var randomString = require('random-string')
const moment = require('moment');

var bad_result = {}

function getFileName( prefix, filename){
    var ext = path.extname(filename)
    var newFileName = randomString({
        length: 8,
        numeric: true,
        letters: true,
        special: false
    });
    newFileName += ext
    return prefix + newFileName;
}

exports.upload_image = async function (req, res) {
    // console.log(req.files)
    if(req.files && req.files.file_icon){
        var photoIcon = req.files.file_icon;
        var newIconFileName = getFileName("icon_", req.files.file_icon.name);
        try {
            await photoIcon.mv('./client/public/img/messages/'+newIconFileName)
            var photo_url = config.server_image_path + "/messages/" + newIconFileName;
            common.sendFullResponse(res, 200, {photo_url}, "");
        } catch (err) {
            common.sendFullResponse(res, 300, {}, "file upload error");
        }
    }else{
        common.sendFullResponse(res, 300, {}, "file is empty");
    }
       
}