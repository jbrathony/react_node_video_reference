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

exports.create_temp_room = function (req, res) {

    var user_id = req.body.user_id;
    var roomName = req.body.roomName;
    var category = req.body.category;
    var description = req.body.description;
    var welcome_message = req.body.welcome_message;
    var max_users = req.body.max_users;
    var password = req.body.password;

    if(roomName == "all") {
        var message = "Sorry! You can create room name 'all'."
        common.sendFullResponse(res, 300, bad_result, message);
    }

    // check room name 
    db.query( 'SELECT COUNT(*) as ct FROM _rooms WHERE room_type = 0 AND name = ? AND user_id = ? AND available = 1', [roomName, user_id], function(err, r_chk_room) {
        if (err) {
            var message = "Sorry! Error occurred in create room."
            common.sendFullResponse(res, 300, bad_result, message);
        }
        if(r_chk_room[0].ct != 0){
            var message = "You already take room."
            common.sendFullResponse(res, 300, bad_result, message);
        }else{
            var sql = "INSERT INTO _rooms(user_id, name, password, category, description, welcome_message, max_users, managers, blocks, banned_users) VALUES ( ? )";
            var params = [user_id, roomName, password, category, description, welcome_message, max_users, '[]', '[]', '[]'];
            db.query( sql, [params], async function(err, result1) {
                if (err){
                    var message = "Sorry! Error occurred in create room."
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                var new_id = result1.insertId;
                if(req.files){
                    // upload photo
                    let multipleUpload = new Promise(async (resolve, reject) => {
                        let upload_len = 2; // upload files 2
                        let upload_res = new Array();

                        for(let i = 0; i < upload_len + 1; i++)
                        {
                            if(upload_res.length === upload_len)
                            {
                                /* resolve promise after upload is complete */
                                resolve(upload_res);
                            }
                            if(i == 0){
                                if(req.files.file_icon){
                                    var photoIcon = req.files.file_icon;
                                    var newIconFileName = getFileName("icon_", req.files.file_icon.name);
                                    try {
                                        var r_upload_icon = await photoIcon.mv('./client/public/img/rooms/'+newIconFileName)
                                        var r_save_icon = await db.query("UPDATE _rooms SET icon = ? WHERE id = ?", [newIconFileName, new_id])
                                        var photo_url = config.server_image_path + "/rooms/" + newIconFileName;
                                        if(r_save_icon){
                                            upload_res.push(photo_url);
                                        }
                                    } catch (err) {
                                        upload_res.push("icon file upload error");
                                    }
                                }else{
                                    upload_res.push("icon file empty");
                                }
                            }
                            if(i == 1){
                                if(req.files.file_cover_photo){
                                    var photoIcon = req.files.file_cover_photo;
                                    var newCoverFileName = getFileName("cover_", req.files.file_cover_photo.name);
                                    try {
                                        var r_upload_cover = await photoIcon.mv('./client/public/img/rooms/'+newCoverFileName)
                                        var r_save_cover = await db.query("UPDATE _rooms SET cover_photo = ? WHERE id = ?", [newCoverFileName, new_id])
                                        var photo_url = config.server_image_path + "/rooms/" + newCoverFileName;
                                        if(r_save_cover){
                                            upload_res.push(photo_url);
                                        }
                                    } catch (err) {
                                        upload_res.push("cover file upload error");
                                    }
                                }else{
                                    upload_res.push("cover file empty");
                                }
                            }
                            
                        } 
                    })
                    .then((result) => result)
                    .catch((error) => error)
                    let upload = await multipleUpload; 
                    var message = "create a room successfully.";
                    common.sendFullResponse(res, 200, {upload}, message);
                }else{
                    var message = "create a room successfully.";
                    common.sendFullResponse(res, 200, {}, message);
                }
            });
        }
        
      })
    
}

exports.update_room = function (req, res) {

    var room_id = req.body.room_id;
    var category = req.body.category;
    var description = req.body.description;
    var welcome_message = req.body.welcome_message;
    var max_users = req.body.max_users;
    var managers = req.body.managers;
    var banned_users = req.body.banned_users;
    var password = req.body.password;

    var sql = "UPDATE _rooms SET ? WHERE id = " + room_id;
    var params = {
        category: category,
        description: description,
        welcome_message: welcome_message,
        max_users: max_users,
        managers: managers,
        banned_users: banned_users,
        password: password,
    };
    db.query( sql, params, async function(err, result1) {
        if (err){
            console.log("update room error", err)
            var message = "Sorry! Error occurred in update room."
            common.sendFullResponse(res, 300, bad_result, message);
        }else{
            var new_id = room_id;
            if(req.files){
                // upload photo
                let multipleUpload = new Promise(async (resolve, reject) => {
                    let upload_len = 2; // upload files 2
                    let upload_res = new Array();
    
                    for(let i = 0; i < upload_len + 1; i++)
                    {
                        if(upload_res.length === upload_len)
                        {
                            /* resolve promise after upload is complete */
                            resolve(upload_res);
                        }
                        if(i == 0){
                            if(req.files.file_icon){
                                var photoIcon = req.files.file_icon;
                                var newIconFileName = getFileName("icon_", req.files.file_icon.name);
                                try {
                                    var r_upload_icon = await photoIcon.mv('./client/public/img/rooms/'+newIconFileName)
                                    var r_save_icon = await db.query("UPDATE _rooms SET icon = ? WHERE id = ?", [newIconFileName, new_id])
                                    var photo_url = config.server_image_path + "/rooms/" + newIconFileName;
                                    if(r_save_icon){
                                        upload_res.push(photo_url);
                                    }
                                } catch (err) {
                                    upload_res.push("icon file upload error");
                                }
                            }else{
                                upload_res.push("icon file empty");
                            }
                        }
                        if(i == 1){
                            if(req.files.file_cover_photo){
                                var photoIcon = req.files.file_cover_photo;
                                var newCoverFileName = getFileName("cover_", req.files.file_cover_photo.name);
                                try {
                                    var r_upload_cover = await photoIcon.mv('./client/public/img/rooms/'+newCoverFileName)
                                    var r_save_cover = await db.query("UPDATE _rooms SET cover_photo = ? WHERE id = ?", [newCoverFileName, new_id])
                                    var photo_url = config.server_image_path + "/rooms/" + newCoverFileName;
                                    if(r_save_cover){
                                        upload_res.push(photo_url);
                                    }
                                } catch (err) {
                                    upload_res.push("cover file upload error");
                                }
                            }else{
                                upload_res.push("cover file empty");
                            }
                        }
                        
                    } 
                })
                .then((result) => result)
                .catch((error) => error)
                let upload = await multipleUpload; 
                var message = "update room successfully.";
                common.sendFullResponse(res, 200, {upload}, message);
            }else{
                var message = "create a room successfully.";
                common.sendFullResponse(res, 200, {}, message);
            }
        }
        
    });
    
}

exports.setting = function (req, res) {
    
    var username = req.body.username;
    var roomId = req.body.roomId;
    // check room name 
    var sql_room = "SELECT a.*, b.username as owner, IF(ISNULL(c.thumb), '', c.thumb) as thumb ";
    sql_room += "FROM _rooms a ";
    sql_room += "LEFT JOIN ixt0j_users b ON a.user_id = b.id ";
    sql_room += "LEFT JOIN ixt0j_community_users c ON a.user_id = c.userid ";
    sql_room += "WHERE a.room_type = 0 AND a.available = 1 AND a.id = ? ";
    db.query(sql_room, roomId, function(err1, rooms) {
        if (err1){
            console.log("error1 : ",err1)
            var message = "Sorry! Error occurred in get room.";
            common.sendFullResponse(res, 300, bad_result, message);
        }else {
            // let managers = [];
            // if(rooms[0].managers) {
            //     managers = JSON.parse(rooms[0].managers)
            // }
            common.sendFullResponse(res, 200, {rooms}, "");
            // if(managers.includes(username) && rooms[0].owner == username) {
            //     common.sendFullResponse(res, 200, {rooms}, "");
            // }else{
            //     var message = "You can't see room detail";
            //     common.sendFullResponse(res, 300, bad_result, message);
            // }
        }
        
    })
  }

  exports.get_rooms = function (req, res) {
    // check room name 
    var sql_room = "SELECT a.*, b.username as owner, IF(ISNULL(c.thumb), '', c.thumb) as thumb ";
    sql_room += "FROM _rooms a ";
    sql_room += "LEFT JOIN ixt0j_users b ON a.user_id = b.id ";
    sql_room += "LEFT JOIN ixt0j_community_users c ON a.user_id = c.userid ";
    db.query(sql_room, function(err1, rooms) {
        if (err1){
            console.log("error1 : ",err1)
            var message = "Sorry! Error occurred in get room.";
            common.sendFullResponse(res, 300, bad_result, message);
        }else {
            common.sendFullResponse(res, 200, {rooms}, "");
        }
        
    })
  }