const db = require('../config/database');
const moment = require('moment');

class Rooms {
  constructor() {
    this.rooms = [
      {
        id: 0,
        type: 'general',
        name: 'Home Chat',
        owner: 'admin',
        password: '',
        max_users: 9999,
        users: [],
        messages: [],
        banned_users: [],
        blocks: [],
        managers: [],
        category: 'Commedy',
        description: 'This is default room, Please join to default room',
        welcome_message: '',
        available : true,
        icon: '',
        cover_photo: '',
        created_at: moment.utc().format('lll'),
      },
    ];
    var that = this;
    var sql = 'SELECT a.*, b.username as owner FROM _rooms a LEFT JOIN ixt0j_users b ON a.user_id = b.id WHERE a.available = 1';
    db.query( sql, function (err, data) {
      if (err) {
        return reject(err);
      }
      if(data.length > 0){
        data.forEach(function (row){
          var tempRow = {};
          tempRow.id = row.id;
          tempRow.owner = row.owner;
          tempRow.user_id = row.user_id;
          tempRow.name = row.name;
          tempRow.password = row.password;
          tempRow.category = row.category;
          tempRow.description = row.description;
          tempRow.welcome_message = row.welcome_message;
          tempRow.max_users = row.max_users;
          tempRow.icon = row.icon;
          tempRow.cover_photo = row.cover_photo;
          tempRow.created_at = row.created_at;
          tempRow.available = row.available ? true : false;

          if(row.room_type === 0) {
            tempRow.type = "general"
          }else if(row.room_type === 1) {
            tempRow.type = "private"
          }

          tempRow.managers = [];
          if(row.managers) {
            tempRow.managers = JSON.parse(row.managers);
          }

          tempRow.blocks = [];
          if(row.blocks) {
            tempRow.blocks = JSON.parse(row.blocks);
          }
          tempRow.banned_users = [];
          if(row.banned_users) {
            tempRow.banned_users = JSON.parse(row.banned_users);
          }
          
          tempRow.users = [];
          tempRow.messages = [];
          that.rooms.push(tempRow);
        });
      }
    })
  }

  getRooms() {
    this.rooms.sort(function (a, b){return b.users.length - a.users.length});
    var no_message_rooms = [];
    for(var i in this.rooms) {
      no_message_rooms.push(this.rooms[i]);
      no_message_rooms[i].message = [];
    }
    return no_message_rooms;
  }

  getPublicRooms() {
    var rooms = this.getRooms();
    var no_private_rooms = rooms.filter( room => room.password == "");
    // var citrus = fruits.slice(1, 3);
    return no_private_rooms;
  }

  getRoom(roomName) {
    // console.log("current room: ", this.rooms.find(room => room.name === roomName))
    return this.rooms.find(room => room.name === roomName);
  }

  getRoomByID(roomId) {
    return this.rooms.find(room => room.id == roomId);
  }

  addRoom(username, roomName) {
    var that = this;
    return new Promise((resolve, reject) => {
      if (that.rooms.find(room => room.name === roomName)) {
        return reject("Room name already taken");
      }
      if (that.rooms.find( (room) => room.owner == username) ){
        return reject("You already created a room");
      }
        
      // update room available
      db.query('UPDATE _rooms SET available = 1 WHERE name = ? ', roomName, function (err, room) {
        if (err){
          return reject(err);
        }
        if (room) {
          var sql = 'SELECT a.*, b.username as owner FROM _rooms a LEFT JOIN ixt0j_users b ON a.user_id = b.id WHERE a.room_type in (0) AND a.available = 1 AND a.name = ? LIMIT 1';
          db.query( sql, roomName, function (err, data) {
            if (err) {
              return reject(err);
            }
            var row = data[0];
            
            var tempRow = {};
            tempRow.id = row.id;
            tempRow.type = "general";
            tempRow.owner = row.owner;
            tempRow.user_id = row.user_id;
            tempRow.name = row.name;
            tempRow.password = row.password;
            tempRow.category = row.category;
            tempRow.description = row.description;
            tempRow.welcome_message = row.welcome_message;
            tempRow.max_users = row.max_users;
            tempRow.available = row.available;
            tempRow.icon = row.icon;
            tempRow.cover_photo = row.cover_photo;
            tempRow.created_at = row.created_at;
            if(row.room_type === 0) {
              tempRow.type = "general"
            }else if(row.room_type === 1) {
              tempRow.type = "private"
            }

            tempRow.managers = [];
            if(row.managers) {
              tempRow.managers = JSON.parse(row.managers);
            }

            tempRow.blocks = [];
            if(row.blocks) {
              tempRow.blocks = JSON.parse(row.blocks);
            }
            tempRow.banned_users = [];
            if(row.banned_users) {
              tempRow.banned_users = JSON.parse(row.banned_users);
            }
            
            tempRow.users = [];
            tempRow.messages = [];
            that.rooms.push(tempRow);
            return resolve(tempRow);
          })
        }
      })
    }); // return promise
    
  }

  addPrivateRoom(roomName, alternative, user, receiver) {
    var oldRoom = this.rooms.find(room => room.name === roomName || room.name === alternative);
    if(oldRoom)
      return oldRoom
    else {
      var newRoom = {
        id: Math.floor(Math.random() * 1000000),
        type: 'private',
        name: roomName,
        owner: user.name,
        managers: receiver.name,
        password: '',
        users: [],
        messages: [],
        banned_users: [],
        blocks: [],
        category: 'Commedy',
        description: '',
        welcome_message: '',
        available: true,
        icon: '',
        cover_photo: '',
        created_at: moment.utc().format('lll'),
      };
      this.rooms.push(newRoom);
      return newRoom;
    }

    // return new Promise((resolve, reject) => {
    //   var oldRoom = that.rooms.find(room => room.name === roomName || room.name === alternative);
    //   if(oldRoom) {
    //     return resolve(oldRoom);
    //   }
      // else if(receiver.type == "guest") {
      //   console.log(user.name + "created with guest user : ", receiver.name );
      //   that.rooms.push(newRoom);
      //   return resolve(newRoom);
      // }
      // save private room
      // return resolve(newRoom);
      // var sql = "INSERT INTO _rooms(user_id, name, room_type, category, description, welcome_message, max_users, available, managers) VALUES ( ? )";
      // var params = [user.user_id, roomName, 1, 'Comedy', '', receiver.type, 2, 1, receiver.name];
      // db.query(sql, [params], async function(err, result1) {
      //   if (err){
      //     return reject(err);
      //   }else {
      //     var new_id = result1.insertId;
      //     newRoom.id = new_id;
      //     that.rooms.push(newRoom);
      //     return resolve(newRoom);
      //   }
      // })
    // });
  }

  removeRoom(roomName) {
    this.rooms = this.rooms.filter((room) => {
      if (roomName !== 'Home Chat') {
        return room.name !== roomName;
      }

      return room;
    });
  }

  removePrivateRoom(roomName) {
    var room = this.rooms.find(r => r.name == roomName);
    if(room.type == "private" && room.available == 0) {
      this.rooms = this.rooms.filter((room) => {
        if (roomName !== 'Home Chat') {
          return room.name !== roomName;
        }
        return room;
      });
    }
  }

  addUser(user_id, roomName) { // user_id = user socket id
    const room = this.rooms.find(room => room.name === roomName);
    const isUser = room.users.find(user => user === user_id);
    if (isUser == undefined) {
      room.users.push(user_id);
    }
  }

  removeUser(user_id, roomName) {  // user_id == socket_id
    const room = this.getRoom(roomName);

    if (room) {
      room.users = room.users.filter(user => user !== user_id);

      // if (!room.users.length) {
      //   this.removeRoom(roomName);
      // }
    }
  }

  banUser(user, roomName) {
    // console.log("user : ", roomName);
    const room = this.rooms.find(room => room.name === roomName);
    room.banned_users.push({ name: user.name, ip: user.ip });
    
    return new Promise((resolve, reject) => {
      // update room available
      db.query('UPDATE _rooms SET banned_users = ? WHERE name = ? ', [JSON.stringify(room.banned_users), roomName], function (err, room) {
        if (err){
          return reject(err);
        }
        if (room) {
          return resolve(room);
        }
      })
    }); // return promise
    
  }

  blockUser(user, roomName) {
    const room = this.rooms.find(room => room.name === roomName);
    room.blocks.push({name:user.name, ip:user.ip});
    
    return new Promise((resolve, reject) => {
        
      // update room available
      db.query('UPDATE _rooms SET blocks = ? WHERE name = ? ', [JSON.stringify(room.blocks), roomName], function (err, room) {
        if (err){
          return reject(err);
        }
        if (room) {
          return resolve(room);
        }
      })
    }); // return promise
    
  }

  unblockUser(selUser, roomName) {
    const room = this.rooms.find(room => room.name === roomName);
    room.blocks = room.blocks.filter( user => user.ip != selUser.ip);
    return new Promise((resolve, reject) => {
        
      // update room available
      db.query('UPDATE _rooms SET blocks = ? WHERE name = ? ', [JSON.stringify(room.blocks), roomName], function (err, room) {
        if (err){
          return reject(err);
        }
        if (room) {
          return resolve(room);
        }
      })
    }); // return promise
    
  }

  addMessage(message, roomName) {
    const room = this.rooms.find(room => room.name === roomName);
    return new Promise((resolve) => {
      // save message into database
      message.id = Math.floor((Math.random() * 100000000) + 1)
      if (room.messages.length >= 30) {
        room.messages.shift();
      }
      
      room.messages.push(message);
      var sql = "INSERT INTO _messages(room_id, room_name, user_id, username, message) VALUES ( ? )";
      var params = [room.id, roomName, message.sender.user_id, message.sender.name, message.text];
      db.query(sql, [params], function (err) {
        if (err){
          console.log(err)
          // return reject(err);
        }
        // message.id = result.insertId;
        // if (room.messages.length >= 30) {
        //   room.messages.shift();
        // }
    
        // room.messages.push(message);
        // return resolve(message);     
      })
      return resolve(message);  
    }); // return promise
  }

  addPrivateMessage(roomName, sender, receiver, message) {
    return new Promise((resolve) => {
      // save message into database
      var sql = "INSERT INTO _private_messages(room_name, sender, receiver, message) VALUES ( ? )";
      var params = [roomName, sender, receiver, message];
      db.query(sql, [params], function (err) {
        if (err){
          console.log(err)
          // return reject(err);
        }
        // return resolve(true);     
      })
      return resolve(true);
    }); // return promise
  }

  checkPokeMessage(receiver, roomName) {
    const room = this.rooms.find(room => room.name === roomName);
    room.messages.forEach( (message) => {
      if( message.type == 'poke' && message.receiver.name == receiver.name ) {
        message.checked = true;
      }
    });
  }

  addSystemMessage(username, type, roomName){
    let messageText = username;
    if(type == "join"){
      messageText += " entered in the room";
    }else if(type == "ban"){
      messageText += " has banned by owner";
    }else if(type == "admin_ban"){
      messageText += " has banned by admin";
    }else if(type == "kick"){
      messageText += " has kicked in the room";
    }else if(type == "join_private"){
      messageText = "Private chat with: ";
    }else if(type == "leave"){
      messageText += " has left the room";
    }
    const message = {
      sender: {name:'system_message'},
      text: messageText,
      color: 'color1',
      type: "system",
      time: moment.utc().valueOf(),
    };
    const room = this.rooms.find(room => room.name === roomName);
    room.messages.push(message);

  }

  updatePrivateRoomStatus(updated_room) {
    const room = this.rooms.find(room => room.name === updated_room);
    room.available = 0;
    return true;
  }

  updateRoom(updated_room) {
    var foundIndex = this.rooms.findIndex(room => room.id === updated_room.id);
 
    if(foundIndex !== -1 ) {
      var tempRoom = this.rooms[foundIndex];
      tempRoom.category = updated_room.category;
      tempRoom.description = updated_room.description;
      tempRoom.max_users = updated_room.max_users;
      tempRoom.welcome_message = updated_room.welcome_message;
      tempRoom.password = updated_room.password;
      tempRoom.managers = updated_room.managers ? JSON.parse(updated_room.managers) : [];
      tempRoom.banned_users = updated_room.banned_users ? JSON.parse(updated_room.banned_users) : [];
      tempRoom.blocks = updated_room.blocks ? JSON.parse(updated_room.blocks) : [];
      tempRoom.icon = updated_room.icon;
      tempRoom.cover_photo = updated_room.cover_photo;
      this.rooms[foundIndex] = tempRoom;
      return tempRoom;
    }else {
      return false;
    }
  }

  adminRemoveRoom(roomName) { 
    const room = this.getRoom(roomName);

    console.log("remove room", room)
    return new Promise((resolve, reject) => {
      // update room available
      db.query('DELETE FROM _rooms WHERE name = ? ', roomName, function (err) {
        if (err){
          return reject(err);
        }else{
          return resolve(true);
        }
      })
    }); // return promise
  }

  adminRemoveModetator(roomName, username) { 
    const room = this.getRoom(roomName);

    if (room) {
      room.managers = room.managers.filter(user => user !== username);
    }
    console.log("update rooms", room)
    console.log("update user", username)
    return new Promise((resolve, reject) => {
      // update room available
      db.query('UPDATE _rooms SET managers=? WHERE name = ? ', [JSON.stringify(room.managers),roomName], function (err) {
        if (err){
          return reject(err);
        }else{
          return resolve(true);
        }
      })
    }); // return promise
  }

  adminRemoveBan(roomName, ip) { 
    const room = this.getRoom(roomName);

    if (room) {
      room.banned_users = room.banned_users.filter(ban => ban.ip !== ip);
    }

    return new Promise((resolve, reject) => {
      // update room available
      db.query('UPDATE _rooms SET banned_users=? WHERE name = ? ', [JSON.stringify(room.banned_users),roomName], function (err) {
        if (err){
          return reject(err);
        }else{
          return resolve(true);
        }
      })
    }); // return promise
  }

}

module.exports = { Rooms };
