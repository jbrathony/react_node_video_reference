const db = require('../config/database');
const moment = require('moment');

class Blocks {
  constructor() {
    this.blocks = [];
    var that = this;
    var sql = 'SELECT a.* FROM _blocks a';
    db.query( sql, function(err, data) {
      if (err) {
        return reject(err);
      }
      if(data.length > 0){
        data.forEach(function(row){
          var tempRow = {};
          tempRow.id = row.id;
          tempRow.nickname = row.nickname;
          tempRow.ip = row.ip;
          that.blocks.push(tempRow);
        });
      }
    })

  }

  getBlocks() {
    return this.blocks;
  }

  addBlock(user, manager) {
    var that = this;
    return new Promise((resolve, reject) => {
      if (that.blocks.find(block => block.ip === user.ip)) {
        return reject("The user already blocked");
      }

      console.log("user",user);
      console.log("manager",manager);
        
      // save block
      db.query('INSERT INTO _blocks(nickname, ip, user_id, username) VALUES (?) ', [[user.name, user.ip, manager.user_id, manager.name]], function(err, data) {
        if (err){
          return reject(err);
        }
        if (data) {
          var tempRow = {};
          tempRow.id = data.insertId;
          tempRow.nickname = user.name;
          tempRow.ip = user.ip;
          that.blocks.push(tempRow);
          return resolve(tempRow);
        }
      })
    }); // return promise
    
  }
  
  removeBlock(user) {
    console.log("block_user", user)
    var block_user = this.blocks.find( u => u.ip == user.ip);
    console.log("block_user", block_user)
    var that = this;
    return new Promise((resolve, reject) => {
        
      // save block
      db.query('DELETE FROM _blocks WHERE id = ? ', block_user.id, function(err, data) {
        if (err){
          return reject(err);
        }
        if (data) {
          that.blocks = that.blocks.filter((block) => block.id != block_user.id);      
          console.log("block_users", that.blocks)
          return resolve(true);
        }
      })
    }); // return promise
  }

}

module.exports = { Blocks };
