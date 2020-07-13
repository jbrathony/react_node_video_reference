var config = require("../config/config")
var common = require("../config/common")
var db = require('../config/database')
var path = require("path")
var randomString = require('random-string')
const moment = require('moment');

var bad_result = {}

exports.getUser = function (req, res) {
    var username = req.body.username;

    // check room name 
    var sql = "SELECT a.id, a.username, a.registerDate, IF(ISNULL(b.value), 'male', b.value) as gender, IF(ISNULL(c.thumb), '', c.thumb) as thumb ";
    sql += "FROM ixt0j_users a ";
    sql += "LEFT JOIN ixt0j_community_fields_values b ON a.id = b.user_id AND b.field_id = 2 ";
    sql += "LEFT JOIN ixt0j_community_users c ON a.id = c.userid ";
    sql += "WHERE a.username = ? LIMIT 1";
    db.query(sql, username, function(err, last_user) {
      if (err){
        console.log("error1 : ",err)
        var message = "Sorry! Error occurred in get user.";
        common.sendFullResponse(res, 300, bad_result, message);
      }
      var user = last_user[0];
      if(last_user.length != 0){
        if( last_user[0].gender == "COM_COMMUNITY_MALE" ) {
          user.gender = 'male';
        }else if( last_user[0].gender == "COM_COMMUNITY_FEMALE" ){
          user.gender = 'female';
        }
        common.sendFullResponse(res, 200, user, "");
      }else{
        common.sendFullResponse(res, 300, user, "The user is not existing");
      }
      
    })
}

exports.myProfile = function (req, res) {
  var username = req.body.username;

  // check room name 
  var sql = "SELECT a.id, a.username, a.registerDate, IF(ISNULL(b.value), 'male', b.value) as gender, IF(ISNULL(c.thumb), '', c.thumb) as thumb ";
    sql += "FROM ixt0j_users a ";
    sql += "LEFT JOIN ixt0j_community_fields_values b ON a.id = b.user_id AND b.field_id = 2 ";
    sql += "LEFT JOIN ixt0j_community_users c ON a.id = c.userid ";
    sql += "WHERE a.username = ? LIMIT 1";
  db.query(sql, username, function(err, last_user) {
    if (err){
      console.log("error1 : ",err)
      var message = "Sorry! Error occurred in get user.";
      common.sendFullResponse(res, 300, bad_result, message);
    }
    var user = last_user[0];
    if(last_user.length != 0){
      if( last_user[0].gender == "COM_COMMUNITY_MALE" ){
        user.gender = 'male';
      }else if( last_user[0].gender == "COM_COMMUNITY_FEMALE" ){
        user.gender = 'female';
      }
      var sql_room = "SELECT * FROM _rooms WHERE user_id = ? AND available = 1 ORDER BY created_at DESC";
      db.query(sql_room, user.id, function(err1, rooms) {
        if (err1){
          console.log("error1 : ",err1)
          var message = "Sorry! Error occurred in get room.";
          common.sendFullResponse(res, 300, bad_result, message);
        }
        common.sendFullResponse(res, 200, {user, rooms}, "");
      })
      
    }else{
      common.sendFullResponse(res, 300, user, "The user is not existing");
    }
    
  });
}