const db = require('../config/database');
const request = require('request-promise');

class Users {
  constructor() {
    this.users = [];
  }

  getUsers() {
    return this.users;
  }

  getUser(id) {
    return this.users.find(user => user.id === id);
  }

  getUserByUsername(username) {
    return this.users.find(user => user.name === username);
  }

  getUserByBroadcastId(broadcastId) {
    return this.users.find(user => user.broadcast_id == broadcastId);
  }

  addGuestUser(id, name, gender, ip, roomId, roomName) {
    const password = '123456';
    const username = name;
    const that = this;
    return new Promise((resolve, reject) => {
      if (that.users.find(user => user.name === name)) {
        return reject('Username taken');
      }
      db.query('SELECT * FROM ixt0j_users WHERE username = ? LIMIT 1', username, (err, user) => {
        if (err) {
          return reject(err);
        }
        if (user.length !== 0) {
          return reject('Username taken');
        }
        // add guest user
        let newUser = {
          id, // socket.io
          user_id: 0,
          is_broadcast: false,
          broadcast_id: '',
          is_private_broadcast: false,
          broadcast_watermark: false,
          name,
          gender,
          type: 'guest',
          color: 'color1',
          avatar: '',
          rooms: [roomName],
          init_room_id: roomId,
          ip,
        };
        that.users.push(newUser);
        return resolve(newUser);
      });
    });
  }

  checkUserFromServer(username, password) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        uri: 'https://www.trand.co.il/index.php?option=com_ajax&custom=usercheck',
        form: {
          username,
          password,
        },
        // json: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      request(options).then((response) => {
        // console.log("response : ", response)
        let rs = JSON.parse(response);
        if (rs.success) {
          return resolve(rs.success);
        }
        return reject(rs.message);


      })
        .catch((err) => {
          console.log(err);
          return reject(err);
        });
    });
  }

  addUser(id, name, ip, roomId, roomName) {
    const username = name;
    const that = this;
    return new Promise((resolve, reject) => {
      if (that.users.find(user => user.name === name)) {
        return reject('Username taken');
      }
      // get user
      db.query('SELECT * FROM ixt0j_users WHERE username = ? LIMIT 1', username, (err, user) => {
        if (err) {
          return reject(err);
        }
        if (user.length != 0) {
          const newUser = {
            id, // socket.io
            user_id: user[0].id,
            is_broadcast: false,
            broadcast_id: '',
            is_private_broadcast: false,
            broadcast_watermark: false,
            name: user[0].username,
            gender: 'male',
            color: 'color1',
            type: 'member',
            avatar: '',
            rooms: [roomName],
            init_room_id: roomId,
            ip,
          };
          let sql = "SELECT a.id, a.username, IF(ISNULL(b.value), 'male', b.value) as gender, max(c.group_id) as top_group, IF(ISNULL(d.thumb), '', d.thumb) as thumb ";
          sql += 'FROM ixt0j_users a ';
          sql += 'LEFT JOIN ixt0j_community_fields_values b ON a.id = b.user_id AND b.field_id = 2 ';
          sql += 'LEFT JOIN ixt0j_user_usergroup_map c ON a.id = c.user_id ';
          sql += 'LEFT JOIN ixt0j_community_users d ON a.id = d.userid ';
          sql += 'WHERE a.id = ? LIMIT 1';
          db.query(sql, newUser.user_id, (err, last_user) => {
            if (err) {
              return reject(err);
            }
            if (last_user.length != 0) {
              if (last_user[0].gender == 'COM_COMMUNITY_MALE') {
                newUser.gender = 'male';
              } else if (last_user[0].gender == 'COM_COMMUNITY_FEMALE') {
                newUser.gender = 'female';
              }
              if (last_user[0].top_group !== null) {
                if (last_user[0].top_group == 7) {
                  newUser.type = 'admin';
                }
                if (last_user[0].top_group == 8) {
                  newUser.type = 'super_admin';
                }
              }
            }
            newUser.avatar = last_user[0].thumb;
            that.users.push(newUser);
            return resolve(newUser);
          });
        } else {
          return reject('Username not exist');
        }
      });
    });
  }

  updateSocket(id, username) {
    this.users.find(user => user.name === username).id = id;
  }

  updateAvatar(id, avatar) {
    this.users.find(user => user.id === id).avatar = `/img/avatars/${avatar}`;
  }

  updateColor(id, color) {
    this.users.find(user => user.id === id).color = color;
  }

  startBroadcast(id, is_broadcast, broadcastId, is_private_broadcast, watermark) {
    const user = this.users.find(user => user.id === id);
    if (user) {
      this.users.find(user => user.id === id).is_broadcast = is_broadcast;
      this.users.find(user => user.id === id).broadcast_id = broadcastId;
      this.users.find(user => user.id === id).is_private_broadcast = is_private_broadcast;
      this.users.find(user => user.id === id).broadcast_watermark = watermark;
    }
  }

  stopBroadcast(id, is_broadcast, broadcastId, is_private_broadcast, watermark) {
    const user = this.users.find(user => user.id === id);
    if (user) {
      this.users.find(user => user.id === id).is_broadcast = is_broadcast;
      this.users.find(user => user.id === id).broadcast_id = broadcastId;
      this.users.find(user => user.id === id).is_private_broadcast = is_private_broadcast;
      this.users.find(user => user.id === id).broadcast_watermark = watermark;
    }
  }

  removeUser(id) {
    this.users = this.users.filter(user => user.id !== id);
  }

  addRoom(id, roomName) {
    const user = this.getUser(id);
    const isRoom = user.rooms.find(room_name => room_name === roomName);
    if (isRoom == undefined) {
      this.users.find(user => user.id === id).rooms.push(roomName);
    }
  }

  removeRoom(id, roomName) {
    const user = this.getUser(id);
    if (user) { user.rooms = user.rooms.filter(room => room !== roomName); }
  }
}

module.exports = { Users };
