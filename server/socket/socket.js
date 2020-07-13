/* eslint-disable camelcase */
// eslint-disable-next-line semi
// const RTCMultiConnectionServer = require('rtcmulticonnection-server');
const { Users } = require('../constructors/Users');
const { Rooms } = require('../constructors/Rooms');
const { Blocks } = require('../constructors/Blocks');
const { Bans } = require('../constructors/Bans');
const { Settings } = require('../constructors/Settings');
const Config = require('../config/config');
const moment = require('moment');
const utf8 = require('utf8');
const base64 = require('base-64');
const fs = require('fs');

const createSocketHanlder = (io) => {
  const users = new Users();
  const rooms = new Rooms();
  const blocks = new Blocks();
  const bans = new Bans();
  const settings = new Settings();
  return function socketHandler(socket) {
    io.emit('admin_setting', settings.getSettings());

    socket.on('joinGuestUser', async ({ userName, gender, roomId, version }, callback) => {
      // console.log(version)

      if (version != Config.VERSION) {
        return callback('Please use new version');
      }
      let ip = socket.handshake.address;
      if (ip.substr(0, 7) == '::ffff:') {
        ip = ip.substr(7);
      }

      if (roomId === '') {
        return callback('Please select room');
      }

      const sel_room = rooms.getRoomByID(roomId);
      if (!sel_room) {
        return callback('Please select room');
      }

      // filter ban
      if (bans.availableUser(userName, ip, sel_room.name)) {
        return callback('You banned by admin');
      }
      // check owner ban
      if (sel_room.banned_users.find(ban => ban.ip === ip)) {
        return callback('You banned by room manager');
      }

      try {
        var user = await users.addGuestUser(socket.id, userName, gender, ip, roomId, sel_room.name);
      } catch (err) {
        return callback(err);
      }

      // save user info into file
      const date = new Date();
      let user_info = `Ip : ${ip}`;
      user_info += `, Username : ${userName}`;
      user_info += `, Member type : ${user.type}`;
      user_info += `, Login : ${date.toUTCString() }\r\n`;
      const file_name = `./logs/${date.getFullYear() }-${String(date.getMonth() + 1) }-${date.getDate() }.txt`;

      fs.open(file_name, 'a+', (e, file) => {
        fs.appendFile(file, user_info, { flag: 'w+' }, () => {
          fs.close(file, function(){
            // console.log('file closed');
          });
        });
      });

      rooms.addUser(socket.id, sel_room.name);
      socket.join(sel_room.name);
      socket.room = sel_room.name;

      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      // send join user system message
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: blocks.getBlocks(),
          bans: bans.getBans(),
        },
      );

      socket.broadcast.to(sel_room.name).emit('receivedSystemMessage', { roomName: sel_room.name, type: 'join', sender: userName });

      return callback('success');
    });

    socket.on('joinUser', async (userName, password, type, roomId, version, callback) => {
      if (version != Config.VERSION) {
        return callback(`Please use new version ${Config.VERSION}`);
      }
      let ip = socket.handshake.address;
      if (ip.substr(0, 7) == '::ffff:') {
        ip = ip.substr(7);
      }

      if (roomId == '') {
        return callback('Please select room');
      }

      const sel_room = rooms.getRoomByID(roomId);
      if (!sel_room) {
        return callback('Please select room');
      }
      // filter ban
      if (bans.availableUser(userName, ip, sel_room.name)) {
        return callback('You banned by admin');
      }
      // check owner ban
      if (sel_room.banned_users.find(ban => ban.ip === ip)) {
        return callback('You banned by room manager');
      }

      // check user
      if (type == 'general') {
        try {
          var response = await users.checkUserFromServer(userName, password);
        } catch (err) {
          return callback(err);
        }
      } else if (type == 'server_auto_login') {
        userName = Base64.decode(userName);
        password = Base64.decode(password);
        // console.log("server auto login username :", userName)
        // console.log("server auto login password :", password)
        try {
          var response = await users.checkUserFromServer(userName, password);
        } catch (err) {
          return callback(err);
        }
      }

      try {
        var user = await users.addUser(socket.id, userName, ip, roomId, sel_room.name);
      } catch (err) {
        return callback(err);
      }

      // save user info into file
      const date = new Date();
      let user_info = `Ip : ${ip}`;
      user_info += `, Username : ${userName}`;
      user_info += `, Member type : ${user.type}`;
      user_info += `, Login : ${date.toUTCString() }\r\n`;
      const file_name = `./logs/${date.getFullYear() }-${String(date.getMonth() + 1) }-${date.getDate() }.txt`;

      fs.open(file_name, 'a+', (e, file) => {
        fs.appendFile(file, user_info, { flag: 'w+' }, () => {
          fs.close(file, function(){
            // console.log('file closed');
          });
        });
      });

      rooms.addUser(socket.id, sel_room.name);
      socket.join(sel_room.name);
      socket.room = sel_room.name;

      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      socket.broadcast.to(sel_room.name).emit('receivedSystemMessage', { roomName: sel_room.name, type: 'join', sender: userName });
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: blocks.getBlocks(),
          bans: bans.getBans(),
        },
      );

      return callback(null);
    });

    socket.on('rejoinUser', async (token, callback) => {
      console.log('rejoin user ************************** ');
      const decode_token = utf8.decode(base64.decode(token));
      const user_token = JSON.parse(decode_token);
      // if(user_token.version != Config.VERSION) {
      //     socket.emit('updateUserAndRoom', {user: null, room: null});
      //     return null;
      // }
      // console.log({user_token});
      let ip = socket.handshake.address;
      if (ip.substr(0, 7) === '::ffff:') {
        ip = ip.substr(7);
      }
      const sel_room = rooms.getRoomByID(user_token.roomIds[0]);
      if (!sel_room) {
        return callback('Please select room');
      }
      // filter ban : check admin ban
      if (bans.availableUser(user_token.userName, ip, sel_room.name)) {
        return callback('You banned by admin');
      }
      // check owner ban
      if (sel_room.banned_users.find(ban => ban.ip === ip)) {
        return callback('You banned by room manager');
      }

      // check user
      const old_user = users.getUserByUsername(user_token.userName);
      // console.log({old_user})
      let user = null;
      const date = new Date();
      if (old_user) {
        // disconnected user end
        var user_info = `Ip : ${old_user.ip}`;
        user_info += `, Username : ${old_user.name}`;
        user_info += `, Member type : ${old_user.type}`;
        user_info += `, Disconnect : ${date.toUTCString() }\r\n`;
        var file_name = `./logs/${date.getFullYear() }-${String(date.getMonth() + 1) }-${date.getDate() }.txt`;

        fs.open(file_name, 'a+', (e, file) => {
          fs.appendFile(file, user_info, { flag: 'w+' }, () => {
            fs.close(file, function(){
              // console.log('file closed');
            });
          });
        });

        old_user.rooms.forEach((room) => {
          rooms.removeUser(old_user.id, room);
          socket.leave(room, () => {
            // socket.to(room).emit('updateRooms', rooms.getRooms()); // to other members
            socket.broadcast.to(room).emit('receivedSystemMessage', { roomName: room, type: 'leave', sender: old_user.name });
          });
        });

        users.removeUser(old_user.id);
        io.emit('disconnected_user', old_user.id);
        // disconnected user end


        // users.updateSocket(socket.id, old_user.name)
        // var user = users.getUser(socket.id)
      }

      try {
        if (user_token.user_type == 'guest') {
          user = await users.addGuestUser(socket.id, user_token.userName, user_token.gender, ip, user_token.roomIds[0], sel_room.name);
        } else {
          let decodedUsername = user_token.userName;
          let decodedPassword = user_token.password;
          if (user_token.type == 'server_auto_login') {
            decodedUsername = Base64.decode(user_token.userName);
            decodedPassword = Base64.decode(user_token.password);
          }
          try {
            const response = await users.checkUserFromServer(decodedUsername, decodedPassword);
          } catch (err) {
            return callback(err);
          }
          user = await users.addUser(socket.id, decodedUsername, ip, user_token.roomIds[0], sel_room.name);
        }
      } catch (err) {
        console.log({ err });
        return callback(err);
      }

      // console.log({user})
      // save user info into file
      var user_info = `Ip : ${ip}`;
      user_info += `, Username : ${user.name}`;
      user_info += `, Member type : ${user.type}`;
      user_info += `, recreated_socket : ${date.toUTCString() }\r\n`;
      var file_name = `./logs/${date.getFullYear() }-${String(date.getMonth() + 1) }-${date.getDate() }.txt`;

      fs.open(file_name, 'a+', (e, file) => {
        fs.appendFile(file, user_info, { flag: 'w+' }, () => {
          fs.close(file, function(){
            // console.log('file closed');
          });
        });
      });

      // add rooms
      if(user_token.roomIds.length > 1) {
        for(var k = 1; k < user_token.roomIds.length; k ++) {
          const temp_room = rooms.getRoomByID(user_token.roomIds[k])
          console.log("temp_room")
          console.log(temp_room)
          users.addRoom(socket.id, temp_room.name);
          rooms.addUser(socket.id, temp_room.name);
          socket.join(temp_room.name);
        }
      }
      // add rooms end
      rooms.addUser(socket.id, sel_room.name);
      socket.join(sel_room.name);
      socket.room = sel_room.name;

      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      socket.broadcast.to(sel_room.name).emit('receivedSystemMessage', { roomName: sel_room.name, type: 'join', sender: user.name });
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: blocks.getBlocks(),
          bans: bans.getBans(),
        },
      );

      return callback(null);
    });

    socket.on('kickUser', (userName, roomName, callback) => {
      const user = users.getUserByUsername(userName);
      if (user) {
        io.emit('kickUser', roomName, user.id);
      } else {
        io.in(roomName).emit('updateRooms', rooms.getRooms());
      }
      return callback(null);
    });

    socket.on('banUser', async (userName, roomName, callback) => {
      const user = users.getUserByUsername(userName);
      try {
        await rooms.banUser(user, roomName);
        // rooms.removeUser(user.id, roomName); // added
      } catch (err) {
        return callback(err);
      }
      io.in(roomName).emit('banUser', roomName, user.id);
      io.emit('updateRooms', rooms.getRooms());
      return callback(null);
    });

    socket.on('adminAddBanUser', async (userName, ip, user_id, roomName, adminName, ban_type, ips, callback) => {
      // var user = users.getUserByUsername(userName);
      const user = { name: userName, ip, user_id };
      const admin = users.getUserByUsername(adminName);
      try {
        await bans.addBan(user, admin, roomName, ban_type, ips);
      } catch (err) {
        return callback(err);
      }
      io.emit('updateBans', bans.getBans());
      const old_user = users.getUserByUsername(userName);
      // console.log("leave room : ", roomName, old_user.name)
      if (old_user) {
        // io.emit('adminBanUser', roomName, old_user.id);
        if (roomName == 'all') {
          old_user.rooms.forEach((room) => {
            rooms.removeUser(old_user.id, room);
            io.in(room).emit('updateRooms', rooms.getRooms()); // to other members
            io.in(room).emit('receivedSystemMessage', { roomName: room, type: 'admin_ban_all', sender: old_user.name });
          });
          users.removeUser(old_user.id);
          io.emit('updateRooms', rooms.getRooms());
          io.emit('updateUsers', users.getUsers());
        } else {
          rooms.removeUser(old_user.id, roomName);
          io.in(roomName).emit('receivedSystemMessage', { roomName, type: 'admin_ban', sender: old_user.name });
          io.emit('updateRooms', rooms.getRooms());
        }
        socket.broadcast.to(old_user.id).emit('adminBanUser', roomName);
      }

      return callback(null);
    });

    socket.on('ownerBlockUser', async (userName, roomName, callback) => {
      const user = users.getUserByUsername(userName);
      try {
        await rooms.blockUser(user, roomName);
      } catch (err) {
        return callback(err);
      }
      // socket.broadcast.to(roomName).emit('ownerBlockUser', userName);
      io.in(roomName).emit('updateRooms', rooms.getRooms());
      return callback(null);
    });

    socket.on('ownerUnblockUser', async (userName, roomName, callback) => {
      const user = users.getUserByUsername(userName);
      try {
        await rooms.unblockUser(user, roomName);
      } catch (err) {
        return callback(err);
      }
      io.emit('updateRooms', rooms.getRooms());
      return callback(null);
    });

    socket.on('adminBlockUser', async (userName, adminName, callback) => {
      console.log('userName : ', userName);
      console.log('admin : ', adminName);
      const user = users.getUserByUsername(userName);
      const admin = users.getUserByUsername(adminName);
      try {
        await blocks.addBlock(user, admin);
      } catch (err) {
        return callback(err);
      }
      io.emit('updateBlocks', blocks.getBlocks());
      return callback(null);
    });

    socket.on('adminUnblockUser', async (userName, callback) => {
      console.log('userName', userName);
      const user = users.getUserByUsername(userName);
      try {
        await blocks.removeBlock(user);
      } catch (err) {
        return callback(err);
      }
      io.emit('updateBlocks', blocks.getBlocks());
      return callback(null);
    });

    socket.on('joinRoom', async ({ roomName, password = '', type }, callback) => {
      const user = users.getUser(socket.id);
      if(!user){
        var disconnect_error = 'join Room ******';
        console.log(disconnect_error)
        console.log(roomName+ ' : ' + socket.id)
        socket.emit('disconnected_this_user', {socket_id: socket.id})
        return null;
      }
      const room = rooms.getRoom(roomName);
      if(!room || room === undefined ){
        return callback('target room doesn\'t exist');
      }
        if (room.password !== '' && room.password !== password) {
          return callback('Wrong password');
        } 

          // const user = users.getUser(socket.id);
          if(user) {
            users.addRoom(socket.id, roomName);
            rooms.addUser(users.getUser(socket.id).id, roomName);
            socket.join(roomName);
            socket.room = roomName;
                
            if(type == 'new') {
              // rooms.addSystemMessage(user.name, 'join', roomName);
            }else if(type == 'private') {
              // rooms.addSystemMessage(user.name, 'join_private', roomName);
            }
                    
            // socket.emit('updateRoom', rooms.getRoom(socket.room));
            // socket.emit('updateUser', users.getUser(socket.id));
            // io.emit('updateUsers', users.getUsers());
            // io.emit('updateRooms', rooms.getRooms());

            socket.emit('updateUserAndRoom', {user: users.getUser(socket.id), room: rooms.getRoom(socket.room)}); 
            if(type != 'change') {
              socket.broadcast.to(roomName).emit('receivedSystemMessage', {roomName:roomName, type: 'join', sender: user.name});
            }
            io.emit('updateUsersRoomsBlocksBans',
              {
                users: users.getUsers(),
                rooms: rooms.getRooms(),
                blocks: null,
                bans: null,
              }
            );

            return callback(null);
          }else{
            return callback('disconnect');
          }
                    
        
      
        
    });

    socket.on('createRoom', async ({ roomName, password = '', type }, callback) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'create room *********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      try {
        const newRoom = await rooms.addRoom(user.name, roomNamepassword); // await function
      } catch (err) {
        return callback(err);
      }
      users.addRoom(socket.id, roomName);
      rooms.addUser(users.getUser(socket.id).id, roomName);
      socket.join(roomName);
      socket.room = roomName;

      // rooms.addSystemMessage(user.name, 'join', roomName);

      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: null,
          bans: null,
        },
      );

      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type: 'join', sender: user.name });
      return callback(null);
    });

    socket.on('createPrivateRoom', (roomName, receiverId, callback) => {
      console.log('createPrivateRoom ', roomName);
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'create private room ******';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const receiverUser = users.getUser(receiverId);
      const alternative = `${receiverId }@${user.id}`;
      const newRoom = rooms.addPrivateRoom(roomName, alternative, user, receiverUser);
      users.addRoom(socket.id, newRoom.name);
      rooms.addUser(users.getUser(socket.id).id, newRoom.name);
      // add receiver into current room
      users.addRoom(receiverId, newRoom.name);
      rooms.addUser(users.getUser(receiverId).id, newRoom.name);
      socket.join(newRoom.name);
      socket.room = newRoom.name;

      // io.emit('updateUsers', users.getUsers());
      // socket.emit('updateUser', users.getUser(socket.id));
      // io.emit('updateRooms', rooms.getRooms());
      // socket.emit('updateRoom', rooms.getRoom(socket.room));
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: null,
          bans: null,
        },
      );

      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      // socket.broadcast.to(roomName).emit('receivedSystemMessage', {roomName:roomName, type: "join", sender: user.name});

      return callback(null);
    });

    socket.on('leaveRoom', ({ roomName, type }, callback) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'leave room **********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      if (type == 'kick') {
        // rooms.addSystemMessage(user.name, 'kick', roomName);
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type, sender: user.name });
      } else if (type == 'ban') {
        // rooms.addSystemMessage(user.name, 'ban', roomName);
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type, sender: user.name });
      } else if (type == 'admin_ban') {
        // rooms.addSystemMessage(user.name, 'admin_ban', roomName);
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type, sender: user.name });
      } else if (type == 'admin_ban_all') {
        // rooms.addSystemMessage(user.name, 'admin_ban', roomName);
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type, sender: user.name });
      } else if (type == 'general') {
        // rooms.addSystemMessage(user.name, 'leave', roomName);
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type: 'leave', sender: user.name });
      }

      rooms.removeUser(socket.id, roomName);
      users.removeRoom(socket.id, roomName);
      socket.leave(roomName);

      socket.room = user.rooms[user.rooms.length - 1];

      if (type == 'private') {
        rooms.removePrivateRoom(roomName);
      }

      // socket.emit('updateRoom', rooms.getRoom(socket.room));
      // io.emit('updateUsers', users.getUsers());
      // socket.emit('updateUser', users.getUser(socket.id));
      // io.emit('updateRooms', rooms.getRooms());
      socket.emit('updateUserAndRoom', { user: users.getUser(socket.id), room: rooms.getRoom(socket.room) });
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: null,
          bans: null,
        },
      );

      // if(socket.room == undefined)
      return callback(null);
    });

    socket.on('clientMessage', async (data, callback) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'client message **********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const room = rooms.getRoom(data.roomName);

      if (data.type == 'poke_check') {
        if(data.message_type == "blocked"){
          // when blocked user sent poke message, not sound play and no sending system checked message
          console.log("************************************************")
          return callback(null);  
        }else{
          rooms.checkPokeMessage(users.getUser(socket.id), data.roomName); // update poke check
          io.in(room.name).emit('updateRooms', rooms.getRooms());
          return callback(null);
        }
      } else {
        let message = {
          sender: users.getUser(socket.id),
          text: data.text,
          message_type: data.message_type,
          color: data.color,
          is_check: false,
          time: moment.utc().valueOf(),
        };
  
        if (room.messages.length && message.sender === room.messages[room.messages.length - 1].sender) {
          message.consecutive = true;
        }
  
        if (data.type == 'poke') {
          message.type = 'poke';
          message.receiver = users.getUser(data.text);
          message.color = 'color5';
          message.text = 'poke';
          message.checked = false;
        } else {
          message.type = 'general';
        }
        try {
          message = await rooms.addMessage(message, data.roomName); // await function
        } catch (err) {
          return callback(err);
        }
  
        // io.in(room.name).emit('updateRooms', rooms.getRooms()); // to other members
        if (data.type == 'general') {
          io.in(room.name).emit('newReceiveMessageInRoom', { roomName: data.roomName, message, type: 'general' }); // to all members
          socket.broadcast.to(room.name).emit('receivedNewMessage', room.name);
        } else if (data.type == 'poke') {
          socket.broadcast.to(users.getUser(data.text).id).emit('newReceiveMessageInRoom', { roomName: data.roomName, message }); // to target memeber
          // socket.broadcast.to(users.getUser(data.text).id).emit('receivedPokeMessage', { roomName: data.roomName, sender: user.id });
        }
        return callback(null);
      }
    });

    socket.on('sendSystemMessage', ({ roomName, type }, callback) => {
      // console.log("sendSystemMessage: "+ roomName + " *** " +type + " *** ")
      const sender = users.getUser(socket.id);
      if (!sender) {
        const disconnect_error = 'send system message ********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      if (type == 'admin_ban_all') {
        sender.rooms.forEach((room) => {
          rooms.removeUser(socket.id, room);
          socket.leave(room, () => {
            socket.broadcast.to(room).emit('receivedSystemMessage', { roomName: room, type, sender: sender.name }); // to other members
          });
        });
      } else {
        socket.broadcast.to(roomName).emit('receivedSystemMessage', { roomName, type, sender: sender.name });
      }
    });

    socket.on('clientPrivateMessage', async (data, callback) => {
      const room = rooms.getRoom(data.roomName);
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'client private message *********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      if (room === undefined || user === undefined) {
        return callback(false);
      }
      let receiver = null;
      if (room.owner == user.name) {
        receiver = users.getUserByUsername(room.managers);
      } else {
        receiver = users.getUserByUsername(room.owner);
      }
      if (data.type == 'poke_check') {
        if(data.message_type == "blocked"){
          // when blocked user sent poke message, not sound play and no sending system checked message
          console.log("************************************************")
        }else{
          rooms.checkPokeMessage(users.getUser(socket.id), data.roomName); // update poke check
          return callback(null);
        }
      }else{
        const message = {
          sender: user,
          text: data.text,
          message_type: data.message_type,
          is_check: false,
          color: data.color,
          time: moment.utc().valueOf(),
        };
  
        if (room.messages.length && message.sender === room.messages[room.messages.length - 1].sender) {
          message.consecutive = true;
        }
  
        if (data.type == 'poke') {
          message.type = 'poke';
          message.receiver = users.getUser(data.text);
          message.color = 'color5';
          message.text = 'poke';
          message.checked = false;
        } else {
          message.type = 'private';
        }
  
        try {
          const result = await rooms.addPrivateMessage(data.roomName, user.name, receiver.name, data.text); // await function
          socket.broadcast.to(receiver.id).emit('receivedNewPrivateMessage', { roomName: data.roomName, message });
          if(message.type == 'poke') {
            socket.broadcast.to(receiver.id).emit('receivedPokeMessage', { roomName: data.roomName, sender: user.id });
          }
          // socket.broadcast.to(receiver.id).emit('receivedNewMessage', room.name);
          return callback(true); // message saved successfully
        } catch (err) {
          return callback(false); // message save failed
        }
      }

    });

    socket.on('getAvatar', () => {
      io.emit('updateUsers', users.getUsers());
      socket.emit('updateUser', users.getUser(socket.id));
      io.emit('updateRooms', rooms.getRooms());
    });

    socket.on('changeUserColor', ({ color }) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'change user color **********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      users.updateColor(socket.id, color);
      socket.emit('updateUser', users.getUser(socket.id));
    });

    socket.on('disconnect', () => {
      const user = users.getUser(socket.id);
      console.log('*************** disconnected user *************');
      console.log(user);
      if (user) {
        console.log('disconnected user : ', user.name);
        // log user info into file
        const date = new Date();
        let user_info = `Ip : ${user.ip}`;
        user_info += `, Username : ${user.name}`;
        user_info += `, Member type : ${user.type}`;
        user_info += `, Disconnect : ${date.toUTCString() }\r\n`;
        const file_name = `./logs/${date.getFullYear() }-${String(date.getMonth() + 1) }-${date.getDate() }.txt`;

        fs.open(file_name, 'a+', (e, file) => {
          fs.appendFile(file, user_info, { flag: 'w+' }, () => {
            fs.close(file, function(){
              // console.log('file closed');
            });
          });
        });

        user.rooms.forEach((room) => {
          rooms.removeUser(socket.id, room);
          socket.leave(room, () => {
            // socket.to(room).emit('updateRooms', rooms.getRooms()); // to other members
            socket.broadcast.to(room).emit('receivedSystemMessage', { roomName: room, type: 'leave', sender: user.name });
          });
        });

        users.removeUser(socket.id);
        io.emit('disconnected_user', socket.id);
      }
      // else{
      //     let token = socket.handshake.query.token;
      //     let decode_token = Base64.decode(token)
      //     let user_token = JSON.parse(decode_token);
      //     console.log({user_token})
      //     user = users.getUserByUsername(user_token.userName);

      //     if(user){
      //         console.log({user})
      //         user.rooms.forEach((room) => {
      //             rooms.removeUser(user.id, room);
      //         });

      //         users.removeUser(user.id);
      //         io.emit('disconnected_user', user.id);
      //     }

      // }


      // io.emit('updateRooms', rooms.getRooms());
      // io.emit('updateUsers', users.getUsers());
      io.emit(
        'updateUsersRoomsBlocksBans',
        {
          users: users.getUsers(),
          rooms: rooms.getRooms(),
          blocks: null,
          bans: null,
        },
      );
    });

    socket.on('subscribeToTimer', () => {
      socket.emit('timer', true);
      // setInterval(() => {
      //     socket.emit('timer', new Date())
      // }, interval);
    });

    socket.on('startBroadcast', ({ is_broadcast, broadcastId, is_private_broadcast, watermark }) => {
      // console.log("start broadcastId : ", broadcastId)
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'start broadcast *******';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      users.startBroadcast(socket.id, is_broadcast, broadcastId, is_private_broadcast, watermark);
      io.emit('updateUsers', users.getUsers());
    });
    socket.on('stopBroadcast', ({ is_broadcast, broadcastId, is_private_broadcast, watermark }) => {
      // console.log("stop broadcastId : ", broadcastId)var user = users.getUser(socket.id);
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'stop broadcast ******';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      users.stopBroadcast(socket.id, is_broadcast, broadcastId, is_private_broadcast, watermark);
      io.emit('updateUsers', users.getUsers());
    });

    socket.on('joinUserBroadcast', (data) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'join user broadcast ********';
        console.log(disconnect_error);
        console.log(data);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const owner = users.getUserByBroadcastId(data.broadcastId);
      if (owner) {
        socket.broadcast.to(owner.id).emit('joinUserToBroadcast', user.id);
      }
    });

    socket.on('getPermissionToOwner', ({ owner, broadcastId }) => {
      // console.log("getPermissionToOwner broadcastId : ", broadcastId)
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'get permission to owner *********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const ownerUser = users.getUserByUsername(owner);
      if (ownerUser) {
        socket.broadcast.to(ownerUser.id).emit('permissionRequest', user.name);
      } else { // owner not existing
        io.emit('updateRooms', rooms.getRooms());
        return null;
      }
    });

    socket.on('setPermissionFromOwner', ({ username, type }) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'set permission from owner ********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const requestUser = users.getUserByUsername(username);
      if (requestUser) { socket.broadcast.to(requestUser.id).emit('permissionResponse', user.name, type); }
    });

    socket.on('closedRemoteVideo', ({ broadcastId }) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'closed remote video **********';
        console.log(disconnect_error);
        console.log({ broadcastId });
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      const owner = users.getUserByBroadcastId(broadcastId);
      if (user && owner) {
        socket.broadcast.to(owner.id).emit('remoteUserExit', user.id);
      }
    });

    socket.on('loggedOutAPrivateUser', ({ roomName }) => {
      const user = users.getUser(socket.id);
      if (!user) {
        const disconnect_error = 'logged out private user ********';
        console.log(disconnect_error);
        socket.emit('disconnected_this_user', { socket_id: socket.id });
        return null;
      }
      rooms.updatePrivateRoomStatus(roomName);
      io.emit('updateRooms', rooms.getRooms());
    });

    /** *********************** external page ************************** */
    socket.on('updateRoomByOwner', ({ room }, callback) => {
      const updated_room = rooms.updateRoom(room);
      if (updated_room) {
        io.emit('updateRooms', rooms.getRooms());
      }
      return callback(null);
    });

    socket.on('getPublicRooms', (callback) => {
      const response = {};
      response.rooms = rooms.getPublicRooms();
      response.users = users.getUsers();
      return callback(response);
    });

    /** ************************** admin panel ************************************ */

    socket.on('test', (message, callback) => {
      io.emit('test', message);
      socket.emit('received', message);
      return callback('success');
    });

    socket.on('admin_add_ban', (ban, callback) => {
      bans.addAdminBan(ban);
      io.emit('updateBans', bans.getBans());
      return callback('success');
    });

    socket.on('admin_delete_ban', (ban_id, callback) => {
      bans.removeBan(ban_id);
      io.emit('updateBans', bans.getBans());
      return callback('success');
    });

    socket.on('admin_delete_room', async (roomName, callback) => {
      try {
        await rooms.adminRemoveRoom(roomName);
        // send message to all room users
        io.in(roomName).emit('adminDeleteRoom', roomName);
        rooms.removeRoom(roomName); // remove room from socket
        io.emit('updateRooms', rooms.getRooms());
        return callback('success');
      } catch (err) {
        return callback(err);
      }
    });

    socket.on('admin_delete_room_modetator', async (roomName, username, callback) => {
      try {
        await rooms.adminRemoveModetator(roomName, username);
        io.emit('updateRooms', rooms.getRooms());
        return callback('success');
      } catch (err) {
        return callback(err);
      }
    });

    socket.on('admin_delete_room_ban', async (roomName, username, callback) => {
      try {
        await rooms.adminRemoveBan(roomName, username);
        io.emit('updateRooms', rooms.getRooms());
        return callback('success');
      } catch (err) {
        return callback(err);
      }
    });

    socket.on('admin_setting_language', (sel_lang, callback) => {
      settings.updateLanguage(sel_lang);
      // io.emit('update_setting_language', sel_lang);
      io.emit('admin_setting', settings.getSettings());
      return callback('success');
    });

    socket.on('admin_setting_private', (sel_private, callback) => {
      settings.updateGuestPrivate(sel_private);
      // io.emit('update_setting_language', sel_lang);
      io.emit('admin_setting', settings.getSettings());
      return callback('success');
    });

    socket.on('admin_setting_broadcast', (sel_broadcast, callback) => {
      settings.updateGuestBroadcast(sel_broadcast);
      io.emit('admin_setting', settings.getSettings());
      return callback('success');
    });

    socket.on('admin_setting_max_message_size', (sel_max_message_size, callback) => {
      settings.updateMaxMessageSize(sel_max_message_size);
      io.emit('admin_setting', settings.getSettings());
      return callback('success');
    });

    socket.on('admin_setting_message_time_interval', (sel_message_time_interval, callback) => {
      settings.updateMessageTimeInterval(sel_message_time_interval);
      io.emit('admin_setting', settings.getSettings());
      return callback('success');
    });
  };
};

module.exports = createSocketHanlder;

