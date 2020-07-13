/* eslint-disable camelcase */
import socketIOClient from 'socket.io-client';
import Config from '../components/config/config';

const base64 = require('base-64');
const utf8 = require('utf8');

let socket = socketIOClient(Config.SOCKET_SERVER_URL, {
  rejectUnauthorized: true,
  // transports:["websocket"]
  // reconnection: true,
  // reconnectionDelay: 500,
  // reconnectionDelayMax: 5000,
  // reconnectionAttempts: Infinity,
});

// console.log("socket_id :", socket.id)
// let socket = null

const createSocket = (param) => {
  const b_64 = base64.encode(utf8.encode(JSON.stringify(param)));
  localStorage.setItem('socket_token', b_64);
  console.log('socket_token1 :', b_64);
  socket = socketIOClient(Config.SOCKET_SERVER_URL, {
    rejectUnauthorized: true,
    // reconnection: true,
    // reconnectionDelay: 500,
    // reconnectionDelayMax: 5000,
    // reconnectionAttempts: Infinity,
    // query: {token:base64}
  });
};

const recreateSocket = () => {
  // var token = localStorage.getItem("socket_token");
  socket = socketIOClient(Config.SOCKET_SERVER_URL, {
    rejectUnauthorized: true,
    // transports:["websocket"]
    // reconnection: true,
    // reconnectionDelay: 500,
    // reconnectionDelayMax: 5000,
    // reconnectionAttempts: Infinity,
    // query: {token}
  });
};

const socketOn = {
  updateUser: (callback) => {
    if (!socket) return;
    socket.on('updateUser', (user) => {
      callback(user);
    });
  },
  updateUsers: (callback) => {
    if (!socket) return;
    socket.on('updateUsers', (users) => {
      callback(users);
    });
  },
  updateRoom: (callback) => {
    if (!socket) return;
    socket.on('updateRoom', (room) => {
      callback(room);
    });
  },
  updateRooms: (callback) => {
    if (!socket) return;
    socket.on('updateRooms', (rooms) => {
      callback(rooms);
    });
  },
  updateUserAndRoom: (callback) => { // when user login
    if (!socket) return;
    socket.on('updateUserAndRoom', (data) => {
      callback(data);
    });
  },
  updateUsersRoomsBlocksBans: (callback) => { // when user login
    if (!socket) return;
    socket.on('updateUsersRoomsBlocksBans', (data) => {
      callback(data);
    });
  },
  updateBlocks: (callback) => {
    if (!socket) return;
    socket.on('updateBlocks', (blocks) => {
      callback(blocks);
    });
  },
  updateBans: (callback) => {
    if (!socket) return;
    socket.on('updateBans', (bans) => {
      callback(bans);
    });
  },
  receivedNewMessage: (callback) => {
    if (!socket) return;
    socket.on('receivedNewMessage', (roomName) => {
      callback(roomName);
    });
  },
  newReceiveMessageInRoom: (callback) => {
    if (!socket) return;
    socket.on('newReceiveMessageInRoom', (data) => {
      callback(data);
    });
  },
  receivedSystemMessage: (callback) => {
    if (!socket) return;
    socket.on('receivedSystemMessage', (data) => {
      callback(data);
    });
  },
  receivedPokeMessage: (callback) => {
    if (!socket) return;
    socket.on('receivedPokeMessage', (data) => {
      callback(data);
    });
  },
  receivedNewPrivateMessage: (callback) => {
    if (!socket) return;
    socket.on('receivedNewPrivateMessage', ({ roomName, message }) => {
      callback({ roomName, message });
    });
  },
  joinPrivateRoom: (callback) => {
    if (!socket) return;
    socket.on('joinPrivateRoom', ({ roomName, alternative }) => {
      callback({ roomName, alternative });
    });
  },
  kickUser: (callback) => {
    if (!socket) return;
    socket.on('kickUser', (roomName, socket_id) => {
      callback(roomName, socket_id);
    });
  },
  banUser: (callback) => {
    if (!socket) return;
    socket.on('banUser', (roomName, socket_id) => {
      callback(roomName, socket_id);
    });
  },
  adminBanUser: (callback) => {
    if (!socket) return;
    socket.on('adminBanUser', (roomName) => {
      callback(roomName);
    });
  },
  adminDeleteRoom: (callback) => {
    if (!socket) return;
    socket.on('adminDeleteRoom', (roomName) => {
      callback(roomName);
    });
  },
  ownerBlockUser: (callback) => {
    if (!socket) return;
    socket.on('ownerBlockUser', (userName) => {
      callback(userName);
    });
  },
  ownerUnblockUser: (callback) => {
    if (!socket) return;
    socket.on('ownerUnblockUser', (userName) => {
      callback(userName);
    });
  },
  permissionRequest: (callback) => {
    if (!socket) return;
    socket.on('permissionRequest', (username) => {
      callback(username);
    });
  },
  permissionResponse: (callback) => {
    if (!socket) return;
    socket.on('permissionResponse', (ownername, type) => {
      callback(ownername, type);
    });
  },
  remoteUserExit: (callback) => {
    if (!socket) return;
    socket.on('remoteUserExit', (username) => {
      callback(username);
    });
  },
  disconnected_user: (callback) => {
    if (!socket) return;
    socket.on('disconnected_user', (socket_id) => {
      callback(socket_id);
    });
  },
  disconnected_this_user: (callback) => {
    if (!socket) return;
    socket.on('disconnected_this_user', (socket_id) => {
      callback(socket_id);
    });
  },
  disconnect: (callback) => {
    console.log('disconnected from server **************** ');
    if (!socket) return;
    socket.on('disconnect', (err) => {
      socket.disconnect();
      console.log('disconnected from server *** ');
      callback(err);
    });
  },
  network_offline: (callback) => {
    console.log('to catch if the server is offline **************** ');
    socket.io.on('connect_error', callback);
  },
  connection_attempt: (callback) => {
    console.log('to catch failed connection attempts ');
    socket.on('connect_failed', callback);
  },
  joinUserToBroadcast: (callback) => {
    if (!socket) return;
    socket.on('joinUserToBroadcast', (username) => {
      callback(username);
    });
  },
  admin_setting: (callback) => {
    if (!socket) return;
    socket.on('admin_setting', (settings) => {
      callback(settings);
    });
  },
  // expernal page
  landingpage_data: (callback) => {
    if (!socket) return;
    socket.on('landingpage_data', (response) => {
      console.log('response', response);
      callback(response);
    });
  },
};

const socketEmit = {
  joinGuestUser: (userName, gender, roomId, version, callback) => {
    socket.emit('joinGuestUser', { userName, gender, roomId, version }, err => callback(err));
  },
  rejoinUser: (token, callback) => {
    // console.log("recreated socket :", socket.id)
    socket.emit('rejoinUser', token, err => callback(err));
  },
  joinUser: (userName, password, type, roomId, version, callback) => {
    socket.emit('joinUser', userName, password, type, roomId, version, err => callback(err));
  },
  kickUser: (userName, roomName, callback) => {
    socket.emit('kickUser', userName, roomName, err => callback(err));
  },
  banUser: (userName, roomName, callback) => {
    socket.emit('banUser', userName, roomName, err => callback(err));
  },
  adminAddBanUser: (userName, ip, user_id, roomName, adminName, ban_type, ips, callback) => {
    socket.emit('adminAddBanUser', userName, ip, user_id, roomName, adminName, ban_type, ips, err => callback(err));
  },
  ownerBlockUser: (userName, roomName, callback) => {
    socket.emit('ownerBlockUser', userName, roomName, err => callback(err));
  },
  ownerUnblockUser: (userName, roomName, callback) => {
    socket.emit('ownerUnblockUser', userName, roomName, err => callback(err));
  },
  adminBlockUser: (userName, adminName, callback) => {
    socket.emit('adminBlockUser', userName, adminName, err => callback(err));
  },
  adminUnblockUser: (userName, callback) => {
    socket.emit('adminUnblockUser', userName, err => callback(err));
  },
  createRoom: (roomName, password, type, callback) => {
    socket.emit('createRoom', { roomName, password, type }, err => callback(err));
  },
  joinRoom: (roomName, password, type, callback) => {
    socket.emit('joinRoom', { roomName, password, type }, err => callback(err));
  },
  leaveRoom: (roomName, type, callback) => {
    socket.emit('leaveRoom', { roomName, type }, err => callback(err));
  },
  clientMessage: (text, roomName, color, type, message_type, callback) => {
    // console.log("send message socket :", socket.id)
    socket.emit('clientMessage', { text, roomName, color, type, message_type }, err => callback(err));
  },
  sendSystemMessage: (roomName, type) => {
    socket.emit('sendSystemMessage', { roomName, type });
  },
  changeUserColor: (color) => {
    socket.emit('changeUserColor', { color });
  },
  refreshBrouser: (callback) => {
    socket.emit('disconnect', err => callback(err));
  },
  getAvatar: () => {
    socket.emit('getAvatar');
  },
  startBroadcast: (is_broadcast, broadcastId, is_private_broadcast, watermark) => {
    socket.emit('startBroadcast', { is_broadcast, broadcastId, is_private_broadcast, watermark });
  },
  stopBroadcast: (is_broadcast, broadcastId, is_private_broadcast, watermark) => {
    socket.emit('stopBroadcast', { is_broadcast, broadcastId, is_private_broadcast, watermark });
  },
  joinUserBroadcast: (data) => {
    socket.emit('joinUserBroadcast', data);
  },
  getPermissionToOwner: (owner, broadcastId) => {
    socket.emit('getPermissionToOwner', { owner, broadcastId });
  },
  setPermissionFromOwner: (username, type) => {
    socket.emit('setPermissionFromOwner', { username, type });
  },
  closedRemoteVideo: (broadcastId) => {
    socket.emit('closedRemoteVideo', { broadcastId });
  },
  disconnect: () => {
    socket.emit('disconnect');
  },
  // private room
  createPrivateRoom: (roomName, receiverId, callback) => {
    socket.emit('createPrivateRoom', roomName, receiverId, err => callback(err));
  },
  clientPrivateMessage: (text, roomName, color, type, message_type, callback) => {
    socket.emit('clientPrivateMessage', { text, roomName, color, type, message_type }, err => callback(err));
  },
  loggedOutAPrivateUser: (roomName) => {
    socket.emit('loggedOutAPrivateUser', { roomName });
  },
  /** ********************************************** external page ******************************************* */
  updateRoomByOwner: (room, callback) => {
    socket.emit('updateRoomByOwner', { room }, err => callback(err));
  },
  getPublicRooms: (callback) => {
    socket.emit('getPublicRooms', err => callback(err));
  },
};

const socketDisconnect = {
  refreshBrouser: (callback) => {
    socket.emit('disconnect', err => callback(err));
  },
};

const subscribeToTimer = {
  checkSocket: (callback) => {
    // socket.on('timer', err => callback(err));
    // console.log("test ... connect")
    socket.emit('subscribeToTimer');
  },
};

const getSocket = () => (socket ? socket.id : "");

export { createSocket, recreateSocket, socketOn, socketEmit, socketDisconnect, subscribeToTimer, getSocket };
