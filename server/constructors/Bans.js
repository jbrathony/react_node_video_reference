const db = require('../config/database');
const moment = require('moment');

class Bans {
  constructor() {
    this.bans = [];
    var that = this;
    var sql = 'SELECT a.* FROM _bans a';
    db.query( sql, function(err, data) {
      if (err) {
        return reject(err);
      }
      if(data.length > 0){
        data.forEach(function(row){
          var tempRow = {};
          tempRow.id = row.id;
          tempRow.ban_type = row.ban_type;
          tempRow.nickname = row.nickname;
          tempRow.room_name = row.room_name;
          tempRow.ip = row.ip;
          that.bans.push(tempRow);
        });
      }
    })

  }

  getBans() {
    return this.bans;
  }

  availableUser(username, ip, roomName) {
    // console.log("current user : " , username + " : " +  ip)
    var bans = this.bans;
    var is_checked = false;
    bans.forEach((ban) => {
      // console.log("ban :", ban)
      if(ban.room_name == "all"){
        if(!is_checked) {
          if(username == ban.nickname)  {
            is_checked = true;
          }else if(ban.ban_type == "ip" && ban.ip == ip) {
            is_checked = true;
          }else if(ban.ban_type == "range") {
            var ranges = ban.ip.split("~");
            var min_ip = Math.min(this.IPtoNum(ranges[0]), this.IPtoNum(ranges[1]));
            var max_ip = Math.max(this.IPtoNum(ranges[0]), this.IPtoNum(ranges[1]));
            // console.log("min ip", min_ip)
            // console.log("min ip", max_ip)
            // console.log("user ip", ip)
            // console.log("user name", username)
            if(min_ip < this.IPtoNum(ip) && this.IPtoNum(ip) < max_ip) {
              is_checked = true;
            }
          }
        }
      }else {
        if(!is_checked) {
          if(ban.room_name == roomName)  {
            if(ban.ban_type == "ip" && ban.ip == ip) {
              is_checked = true;
            }else if(ban.ban_type == "range") {
              var ranges = ban.ip.split("~");
              var min_ip = Math.min(this.IPtoNum(ranges[0]), this.IPtoNum(ranges[1]));
              var max_ip = Math.max(this.IPtoNum(ranges[0]), this.IPtoNum(ranges[1]));
              if(min_ip < this.IPtoNum(ip) && this.IPtoNum(ip) < max_ip) {
                is_checked = true;
              }
            }
          }
        }
      }

    });
    return is_checked;
  }

  addBan(user, manager, room_name, ban_type, ips) {
    var that = this;
    return new Promise((resolve, reject) => {
      if (that.bans.find(ban => ban.ip === user.ip || ban.nickname === user.name)) {
        return reject("The user already banned");
      }
      // console.log(user)
      // console.log(room_name)
      // console.log(manager)
      // console.log(ban_type)
      // console.log(ips)
      // save ban
      db.query('INSERT INTO _bans(ban_type, nickname, ip, user_id, username, room_name) VALUES (?) ', [[ban_type, user.name, ips, manager.user_id, manager.name, room_name]], function(err, data) {
        if (err){
          return reject(err);
        }
        if (data) {
          var tempRow = {};
          tempRow.id = data.insertId;
          tempRow.nickname = user.name;
          tempRow.ban_type = ban_type;
          tempRow.ip = user.ip;
          tempRow.room_name = room_name;
          that.bans.push(tempRow);
          return resolve(tempRow);
        }
      })
    }); // return promise
    
  }

  addAdminBan(ban) {
    this.bans.push(ban);
  }
  
  removeBan(ban_id) {
    this.bans = this.bans.filter((ban) => ban.id != ban_id);
  }

  IPtoNum(ip){
    // console.log("ban ip : ",ip)
    return Number(
      ip.split(".")
        .map(d => ("000"+d).substr(-3) )
        .join("")
    );
  }

}

module.exports = { Bans };
