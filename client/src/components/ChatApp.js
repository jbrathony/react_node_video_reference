import React from 'react';
import Modal from 'react-modal';
import More from 'react-icons/lib/fa/bars';
import IconClose from 'react-icons/lib/md/close';
import Palette from 'react-icons/lib/md/palette';
import Close from 'react-icons/lib/md/close';
import Minus from 'react-icons/lib/fa/minus';
import { recreateSocket, socketOn, socketEmit, getSocket, subscribeToTimer } from '../helpers/socketEvents';
import { withAlert } from "react-alert";
import moment from 'moment';
// import '!style-loader!css-loader!rc-notification/assets/index.css';
import Notification from 'rc-notification';
var Sound = require('react-sound').default;
import ReactPlayer from 'react-player'
const utf8 = require('utf8');
const base64 = require('base-64');

import jwt from 'jwt-simple';
import { useTranslation, withTranslation, Trans } from 'react-i18next';

import { sidebarOpen } from '../helpers/sidebarToggle';
import LoginPage from './LoginPage';
import SidebarLeft from './SidebarLeft';
import UserInputMessage from './UserInputMessage';
import SidebarRight from './SidebarRight';
import Message from './Message';
import SystemMessage from './SystemMessage';
import PokeMessage from './PokeMessage';
import MyMessage from './MyMessage';
import JoinRoomModal from './JoinRoomModal';
import CreateRoomModal from './CreateRoomModal';
import BanModal from './BanModal';
import SettingModal from './setting/SettingModal';
import PasswordModal from './PasswordModal';
import BroadcastAuto from './video/BroadcastAuto';
import Config from './config/config';
// import { Z_FIXED } from 'zlib';

let notification = null;
Notification.newInstance({
  style: { top: 20, left: 'calc(50% - 160px)', zIndex: 100, position: "fixed" }
}, (n) => notification = n);
const emoji_options = {
  convertShortnames: true,
  convertUnicode: true,
  convertAscii: true,
  style: {
    backgroundImage: 'url("/path/to/your/emojione.sprites.png")',
    height: 32,
    margin: 4,
  },
  // this click handler will be set on every emoji
  onClick: event => alert(event.target.title)
};

var secret = 'webRTCVideoConference';

class ChatApp extends React.Component {
  constructor() {
    super();

    this.state = {
      admin_setting: {},
      setting: {},
      user: null,
      users: [],
      room: null,
      rooms: [],
      user_rooms: [], // user opened rooms
      private_messages: [], // user has private room messages
      block_users: [],
      ban_users: [],
      broadcasting_viwers: [],
      activeVideoConferences: [],
      createRoomModalOpen: false,
      joinRoomModalOpen: false,
      poke_status: false,               // for poke message
      poke_room_name: '',               // for poke message
      viewSelUser: null,                // select user in message view
      showUserActionArea: false,                // select user in message view
      isShowReconnectModal: false,      //  reconnect modal
      attempt_count: 0,                  // reconnect attempt count

      // join password room
      isShowPasswordModal: false,
      selectJoinRoomName: '',
      // broadcasting
      user_broadcast_rooms: [],
      isLocalBroadcasting: false,
      isLocalBroadcastingStop: false,
      isRemoteBroadcasting: false,
      audioInputSelect: "",
      videoInputSelect: "",
      privateBroadcast: false,
      watermark: false,
      // setting
      isShowSettingModal: false,
      new_sound_alert: false,
      new_broadcast_request_sound: false,
      // ban
      createBanModalOpen: false,
      targetBanUser: null,
      // youtube
      youtubeLink: '',
      youtube_show: false,
    };

    this.attempt_interval
    this.chk_socket_interval
    this.closed_broadcastrooms = [];
    this.pending_broadcast_ids = [];
    this.diff = this.diff.bind(this);
    this.toggleJoinRoomModal = this.toggleJoinRoomModal.bind(this);
    this.toggleCreateRoomModal = this.toggleCreateRoomModal.bind(this);
    this.toggleCreateRoomModal = this.toggleCreateRoomModal.bind(this);
    this.handleSongFinishedPlaying = this.handleSongFinishedPlaying.bind(this);
    this.handleSongFinishedPlayingNew = this.handleSongFinishedPlayingNew.bind(this);
    this.handleSongFinishedPlayingBroadcastRequest = this.handleSongFinishedPlayingBroadcastRequest.bind(this);
    this.newOpenExistingPrivateRoom = this.newOpenExistingPrivateRoom.bind(this);
    /** ******************* Reconnect Action *********************************/
    this.again_connection = this.again_connection.bind(this);
    this.show_reconnect_modal = this.show_reconnect_modal.bind(this);
    this.close_reconnect_modal = this.close_reconnect_modal.bind(this);
    /** ******************* Login Action *********************************/
    this.onActionLogin = this.onActionLogin.bind(this);
    /** ******************* JoinRoomModal Action *********************************/
    this.onActionJoinRoom = this.onActionJoinRoom.bind(this);
    /** ******************* User Action *********************************/
    this.onClickUserAction = this.onClickUserAction.bind(this);
    /********************** Sidebar Left Action ***************************/
    this.onActionSidebarLeft = this.onActionSidebarLeft.bind(this);
    /********************** broadcasting ***************************/
    this.onActionStopBroadcast = this.onActionStopBroadcast.bind(this);
    this.onActionStartBroadcast = this.onActionStartBroadcast.bind(this);
    this.onActionOnBroadcast = this.onActionOnBroadcast.bind(this);
    this.onClickReqDeny = this.onClickReqDeny.bind(this);
    this.onClickReqAccept = this.onClickReqAccept.bind(this);
    this.close_notice = this.close_notice.bind(this);
    /********************** message ***************************/
    this.selectRoom = this.selectRoom.bind(this);
    this.onClickUserInMessage = this.onClickUserInMessage.bind(this);
    this.showMessageContents = this.showMessageContents.bind(this);
    this.addSystemMessage = this.addSystemMessage.bind(this);
    this.receiveSystemMessage = this.receiveSystemMessage.bind(this);
    this.onActionUserInputMessage = this.onActionUserInputMessage.bind(this);
    this.isBlockedUser = this.isBlockedUser.bind(this);
    this.showYoutube = this.showYoutube.bind(this);
    this.youtube_action = this.youtube_action.bind(this);
    /********************** setting ***************************/
    this.toggleSettingModal = this.toggleSettingModal.bind(this);
    this.onActionUpdateSetting = this.onActionUpdateSetting.bind(this);
    /********************** ban modal ***************************/
    this.toggleCreateBanModal = this.toggleCreateBanModal.bind(this);
    /********************** password modal ***************************/
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
    this.socket_handler();
  }

  componentDidUpdate(prevProps, prevState) {
    const messages = document.getElementsByClassName('messages')[0];
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
    // check alarm
    if((prevState.new_sound_alert == true && this.state.new_sound_alert == true) || 
      (prevState.new_broadcast_request_sound == true && this.state.new_broadcast_request_sound == true) || 
      (prevState.poke_status == true && this.state.poke_status == true) ) {
        console.log("new_sound_alert : ",prevState.new_sound_alert)
        console.log("new_broadcast_request_sound : ",prevState.new_broadcast_request_sound)
        console.log("poke_status : ",prevState.poke_status)
      this.setState({new_sound_alert: false, new_broadcast_request_sound: false, poke_status: false})
    }
    
  }

  socket_handler = () => {
    var cur_socket = getSocket();
    // console.log(cur_socket) // socket id
    this.chk_socket_interval = setInterval(() => {
      subscribeToTimer.checkSocket((err) => {
        console.log({err})
      } );
    }, 2000)
    

    socketOn.updateUserAndRoom((data) => {
      // console.log("received updateUserAndRoom: ", data)
      var { user, room } = data;
      if(user === null) {
        this.setState({ 
          user: null
        });
        return ;
      }
      // console.log("received updateUserAndRoom: ", user)
      if(user.rooms.length == 0) return null;
      let expire_time = Date.now() + 24*3600*1000;
      let payload = {
        version: Config.VERSION,
        name: user.name,
        type: user.type,
        user_id: user.user_id,
        gender: user.gender,
        init_room_id: user.init_room_id,
        expire: expire_time
      }
      var token = jwt.encode(payload, secret);
      localStorage.setItem("token", token);

      // update room
      let newUserRooms = [];
      let is_actived = false;
      this.state.user_rooms.map( (item, i) => {
        if(room.name != item.name) {
          newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
        }
        else{
          newUserRooms.push({ name: item.name, active: 1, missing_m_ct: 0, block_users: item.block_users, messages: item.messages});
          is_actived = true;
        }
      });
      if(!is_actived) { // new join room
        this.onActionLogin('join_room', room.id) // update socket token roomIds
        newUserRooms.push( {name: room.name, active: 1, missing_m_ct: 0, block_users: [], messages: room.messages});
        newUserRooms = this.addSystemMessage(newUserRooms, room.name, "join");
        // add welcome message
        if(room.welcome_message != "") {
          var welcome_message = room.welcome_message;
          var message = {
            sender: {name:'system_message'},
            text: welcome_message,
            color: 'color1',
            type: "system",
            time: moment.utc().valueOf(),
          };
          var foundIndex = newUserRooms.findIndex( r => r.name === room.name );
          if (newUserRooms[foundIndex].messages.length >= 30) {
            newUserRooms[foundIndex].messages.shift();
          }
          newUserRooms[foundIndex].messages.push(message);
        }
      }
      
      this.setState({ 
        user: {...user, ...{version:Config.VERSION}},
        room: room.name, 
        user_rooms: newUserRooms
      });
    });

    socketOn.updateUsersRoomsBlocksBans((data) => {
      var { users, rooms, bans, blocks } = data;
      var updateState = {};
      var new_broadcast_rooms = [];

      if(!this.state.user) {
        return ; // go to login page
      }else{
        new_broadcast_rooms = this.update_broadcast_rooms(users, rooms);
        var isRemoteBroadcasting = new_broadcast_rooms.length > 0 ? true : false;    
        updateState.user_broadcast_rooms = new_broadcast_rooms
        updateState.isRemoteBroadcasting = isRemoteBroadcasting
      }

      if(blocks){
        updateState.block_users = blocks
      }
      if(bans){
        updateState.ban_users = bans
      }
      if(rooms){
        updateState.rooms = rooms
      }
      if(users){
        updateState.users = users
      }

      this.setState(updateState);
    });

    socketOn.updateUser((user) => {
      // console.log("received update user: ", user)
      this.setState({ user: {...user, ...{version:Config.VERSION}} });
    });

    socketOn.updateUsers((users) => {
      // console.log({users})
      var new_broadcast_rooms = [];
      if(this.state.user) {
        new_broadcast_rooms = this.update_broadcast_rooms(users, this.state.rooms);
      }
      var isRemoteBroadcasting = new_broadcast_rooms.length > 0 ? true : false;

      this.setState({ users, user_broadcast_rooms: new_broadcast_rooms, isRemoteBroadcasting });
    });

    socketOn.updateRoom((room_object) => {
      // console.log("update room: ", room_object)
      let newUserRooms = [];
      let is_actived = false;
      this.state.user_rooms.map( (item, i) => {
        if(room_object.name != item.name) {
          newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
        }
        else{
          newUserRooms.push({ name: item.name, active: 1, missing_m_ct: 0, block_users: item.block_users, messages: item.messages});
          is_actived = true;
        }
      });
      if(!is_actived) { // new join room
        newUserRooms.push( {name: room_object.name, active: 1, missing_m_ct: 0, block_users: [], messages: room_object.messages});
        newUserRooms = this.addSystemMessage(newUserRooms, room_object.name, "join");
        // add welcome message
        var welcome_message = room_object.welcome_message;
        var message = {
          sender: {name:'system_message'},
          text: welcome_message,
          color: 'color1',
          type: "system",
          time: moment.utc().valueOf(),
        };
        var foundIndex = newUserRooms.findIndex(room => room.name === room_object.name);
        if (newUserRooms[foundIndex].messages.length >= 30) {
          newUserRooms[foundIndex].messages.shift();
        }
        newUserRooms[foundIndex].messages.push(message);
      }
      // console.log("user_new_rooms : ", newUserRooms)
      this.setState({ room: room_object.name, user_rooms: newUserRooms });
    });

    socketOn.updateBlocks((blocks) => {
      // console.log("blocks : ", blocks)
      this.setState({ block_users: blocks });
    });

    socketOn.updateBans((bans) => {
      // console.log("ban users : ", bans)
      this.setState({ ban_users: bans });
    });

    socketOn.kickUser((roomName, socket_id) => {
      if(this.state.user.id == socket_id) {
        this.closeRoom(roomName, 'kick');
      }
    });

    socketOn.banUser((roomName, socket_id) => {
      if(this.state.user.id == socket_id) {
        this.closeRoom(roomName, 'ban');
      }
    });

    socketOn.adminBanUser((roomName) => {
      // close broadcasting video
      if(this.state.isLocalBroadcasting && !this.state.isLocalBroadcastingStop) {
        // this.close_remote_video(this.state.user.id);
        this.setState({isLocalBroadcastingStop: true});
      }

      if(roomName == "all") {
        // logout user
        // this.closeRoom(this.state.room, 'admin_ban');
        // console.log("roomName2 : ",roomName)
        // console.log("socket_id2 : ",socket_id)
        this.props.alert.show(this.props.t("ChatApp.error_admin_ban_all_room"));
        localStorage.removeItem("token");
        this.setState({user: null});
      }else {
        // console.log("roomName1 : ",roomName)
        // console.log("socket_id1 : ",socket_id)
        this.closeRoom(roomName, 'admin_ban');
        // this.props.alert.show(this.props.t("ChatApp.sys_ban_admin_room", {username: this.state.user.name}));
      }
    });

    socketOn.ownerBlockUser((userName) => {
      // console.log("ownerBlockUser  : ", userName);
      if(this.state.user.name != userName) {
        // console.log("username : ", userName);
        this.onClickUserAction("block_person", {block_type: "block", selUsername: userName});
      }
    });

    socketOn.ownerUnblockUser((userName) => {
      if(this.state.user.name != userName) {
        // console.log("username : ", userName);
        this.onClickUserAction("block_person", {block_type: "unblock", selUsername: userName});
      }
    });

    socketOn.updateRooms((rooms) => {
      // console.log("rooms : ", rooms)
      this.setState({ rooms });
    });

    socketOn.receivedNewMessage((roomName) => {
      // update user_rooms
      let newUserRooms = [];
      this.state.user_rooms.map( (item, i) => {
        if(roomName == item.name && item.active == 0){
          newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct + 1, block_users: item.block_users, messages: item.messages});
        }
        else{
          newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
        }
      });
      this.setState({ user_rooms: newUserRooms });
    });

    socketOn.newReceiveMessageInRoom((data) => {
      // console.log("newReceiveMessageInRoom: ", data)
      var {roomName, message} = data
      
      // check sender is blocked user
      if(this.isBlockedUser(message.sender, this.state.users, this.state.rooms)) {
        if(message.type === 'poke'){
          socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "blocked", (err) => {
          });
        }
        return false
      }else {
        let new_poke_status = this.state.poke_status
        let new_poke_room_name = this.state.poke_room_name
        if(message.type === 'poke'){
          if(this.state.user.id == message.receiver.id){
            // only receiver
            if(this.state.setting.noti_sound_poke) {
              new_poke_status = true
              new_poke_room_name = roomName
            }else{
              socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "", (err) => {
                this.setState({ poke_status: false });
              });
            }  
          }
        }
        // update user_rooms
        let newUserRooms = [];
        this.state.user_rooms.map( (item, i) => {
          let update_messages = item.messages
          
          if(roomName == item.name) {
            if (update_messages.length >= 30) {
              update_messages.shift();
            }
            update_messages.push(message);
            newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: update_messages});
          }
          else{
            newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: update_messages});
          }
        });
        this.setState({ user_rooms: newUserRooms, poke_status: new_poke_status, poke_room_name: new_poke_room_name });
      }
      
    });

    socketOn.receivedSystemMessage((data) => {
      // console.log("data:", data)
      // update user_rooms
      let newUserRooms = this.receiveSystemMessage(this.state.user_rooms, data.roomName, data.type, data.sender, data.message);
      this.setState({ user_rooms: newUserRooms });
    });

    socketOn.receivedPokeMessage((data) => {
      const {roomName, sender} = data;
      const selUser = this.state.users.find(u => u.id == sender);
      // can't receive block(mute) user or ban user message 
      // console.log({selUser})
      const cur_room = this.state.rooms.find(r => r.name == roomName);
      if(cur_room.type === 'private' ) {
        if(selUser) {
          if(this.isBlockedUser(selUser, this.state.users, this.state.rooms)) {
            socketEmit.clientPrivateMessage('', roomName, this.state.user.color, 'poke_check', "blocked", (err) => {
            });
            return false
          }else {
            // play poke sound
            console.log("play poke sound")
            if(this.state.setting.noti_sound_poke) {
              this.setState({ poke_status: true, poke_room_name: roomName });
            }else{
              socketEmit.clientPrivateMessage('', roomName, this.state.user.color, 'poke_check', "", (err) => {
                this.setState({ poke_status: false });
              });
            }
          }
        }else{
          socketEmit.clientPrivateMessage('', roomName, this.state.user.color, 'poke_check', "blocked", (err) => {
          });
          return false
        }
      }else{
        if(selUser) {
          console.log("is blocker")
          console.log(selUser)
          if(this.isBlockedUser(selUser, this.state.users, this.state.rooms)) {
            console.log("checked")
            socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "blocked", (err) => {
            });
            return false
          }else {
            // play poke sound
            console.log("play sound")
            if(this.state.setting.noti_sound_poke) {
              this.setState({ poke_status: true, poke_room_name: roomName });
            }else{
              socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "", (err) => {
                this.setState({ poke_status: false });
              });
            }
          }
        }else{
          socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "blocked", (err) => {
          });
          return false
        }
      }
      // console.log("here")
    });

    socketOn.receivedNewPrivateMessage(( {roomName, message } ) => {
      // console.log("receivedNewPrivateMessage", message)
      let currentRoom = this.state.rooms.find(r => r.name == roomName);
      // console.log("current private room ", currentRoom)
      var currentRoomName = currentRoom.name;
      var target_username = "";
      if(currentRoom.owner == this.state.user.name) {
        target_username = currentRoom.managers;
      }else{
        target_username = currentRoom.owner;
      }
      let selUser = this.state.users.find(u => u.name == target_username);
      // can't receive block(mute) user or ban user message 
      if(selUser) {
        if(this.isBlockedUser(selUser, this.state.users, this.state.rooms)) return false;
      }else{
        return false;
      }
      // if setting new_message is true, play music
      let new_sound_alert = false
      if(this.state.setting.noti_sound_new_message && message.type !== 'poke') {
        new_sound_alert = true
      }
      let new_poke_status = this.state.poke_status
      let new_poke_room_name = this.state.poke_room_name
      if(this.state.setting.noti_sound_poke && message.type === 'poke') {
        new_poke_status = true
        new_poke_room_name = roomName
      }
      // add new private message
      var new_private_messages = this.state.private_messages;
      const new_private_room = new_private_messages.find(room => room.name === roomName);
      let newUserRooms = [];
      this.state.user_rooms.map( (item, i) => {
        if(roomName == item.name && item.active == 0) {
          newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct + 1, block_users: item.block_users, messages: item.messages});
        }
        else{
          newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
        }
      });
      if(new_private_room) {
        // alredy exist current private room      
        if (new_private_room.messages.length >= 30) {
          new_private_room.messages.shift();
        }
        new_private_room.messages.push(message);
        this.setState({user_rooms: newUserRooms, private_messages: new_private_messages, new_sound_alert});
      }else {

        // add new private room
        newUserRooms.push( {name: roomName, active: 0, missing_m_ct: 1, block_users: [], messages: []});
        // console.log("newUserRooms : ",newUserRooms)
        // add new private messages
        var new_room = {name: roomName, messages: []};
        let new_message = this.props.t('ChatApp.sys_private_message',{ username: message.sender.name});
        var new_system_message = {
          type : "system",
          sender: {name:'system_message'},
          text: new_message,
          color: 'color1',
          time: moment.utc().valueOf(),
        };
        new_room.messages.push(new_system_message);
        new_room.messages.push(message);
        new_private_messages.push(new_room);

        this.setState({user_rooms: newUserRooms, private_messages: new_private_messages, new_sound_alert, poke_status: new_poke_status, poke_room_name: new_poke_room_name});
      }

    });

    socketOn.adminDeleteRoom((roomName) => {
      // close the room
      this.closeRoom(roomName, 'admin_close_room');

    });

    socketOn.joinPrivateRoom(( {roomName, alternative} ) => {
      // join private room
      if(this.state.user_rooms.find(room => room.name === roomName)){
        // join to this room
        this.selectRoom(roomName);
      }else if(this.state.user_rooms.find(room => room.name === alternative)){
        // join to this room
        this.selectRoom(alternative);
      }else{
        var that = this;
        socketEmit.joinRoom(roomName, '', 'private', (err) => {
          if(!err) {
            that.newOpenExistingPrivateRoom(roomName);
          }
        });
      }
    });

    socketOn.permissionRequest((username) => {
      if(this.state.setting.noti_sound_view_broadcast_req) {
        this.setState({new_broadcast_request_sound: true});
      }
      let message = this.props.t('ChatApp.system_user_request_video_permission', {username});
      const key = Date.now();
      notification.notice({
        content: <div className="react-alert-area" style={{display: "flex", flexDirection: "column"}}>
          <div className="message-content">
            <span style={{maxWidth: "85%"}}>{message}</span>
            <Close onClick={() =>this.close_notice(key)} className="icon icon-alert-close"size="20px" style={{color: "white"}} />
          </div>
          <div className="confirm-area">
            <button onClick={()=> this.onClickReqAccept(username, key)} className="btn-alert-ok" >{this.props.t('ChatApp.accept')}</button>
            <button onClick={()=> this.onClickReqDeny(username, key)} className="btn-alert-cancel" >{this.props.t('ChatApp.deny')}</button>  
          </div>
        </div>,
        duration: 20,
        key,
      });
    });

    socketOn.permissionResponse((ownername, type) => {
      console.log("pending broadcast ids ", this.pending_broadcast_ids)
      this.pending_broadcast_ids = this.pending_broadcast_ids.filter( b => b.owner != ownername )
      console.log("pending broadcast ids ", this.pending_broadcast_ids)
      if(type) {
        let message = this.props.t('ChatApp.owner_granted_video_request', {ownername});
        this.props.alert.show(message);
        let owner = this.state.users.find((user) => user.name == ownername);
        this.onClickUserAction("view_user_broadcast", {broadcastId: owner.broadcast_id, owner: owner.name, private: owner.is_private_broadcast, watermark: owner.broadcast_watermark});
      }else {
        let message = this.props.t('ChatApp.owner_deny_video_request', {ownername});
        this.props.alert.show(message);
        // console.log(message);
      }
    });

    socketOn.remoteUserExit((socket_id) => {
      // console.log("remoteUserExit : ", username);
      let new_broadcasting_viwers = this.state.broadcasting_viwers.filter( (user) => user != socket_id );
      this.setState({broadcasting_viwers: !new_broadcasting_viwers ? [] : new_broadcasting_viwers});
    });

    socketOn.disconnected_user((socket_id) => {
      // remove private room with this user
      if(this.state.isLocalBroadcasting) {
        var new_broadcasting_viwers = this.state.broadcasting_viwers.filter(user => user != socket_id);
      }
      this.setState({broadcasting_viwers: !new_broadcasting_viwers ? [] : new_broadcasting_viwers});
    });

    socketOn.disconnected_this_user((socket_id) => {
      // remove private room with this user
      if(this.state.isLocalBroadcasting) {
        var new_broadcasting_viwers = this.state.broadcasting_viwers.filter(user => user != socket_id);
      }
      this.setState({broadcasting_viwers: !new_broadcasting_viwers ? [] : new_broadcasting_viwers});
      let message = this.props.t('ChatApp.socket_disconnected');
      this.props.alert.show(message);
      setTimeout( () => {
        location.reload(false);
      },1000)
      
      // console.log("socket disconnected  ***  username : ", this.state.user.name)
      // this.again_connection()
      
    });

    socketOn.disconnect(() => {
      console.log("******* socket disconnected from server")
      this.again_connection()
    })

    socketOn.connection_attempt(() => {
      console.log("******* connection_attempt ******************")
      this.again_connection()
    })

    socketOn.network_offline(() => {
      console.log("******* network_offline ******************")
      this.again_connection()
    })

    socketOn.joinUserToBroadcast((socket_id) => {
      var new_broadcasting_viwers = this.state.broadcasting_viwers;
      // console.log("new_broadcasting_viwers: ", new_broadcasting_viwers)
      if(new_broadcasting_viwers.find( (user) => user == socket_id )) {
        // console.log("join_room_user : this user already exist : ", socket_id)
      }else {
        new_broadcasting_viwers.push(socket_id);
      }
      this.setState({broadcasting_viwers: new_broadcasting_viwers});
    });
    
    // admin
    // socketOn.update_setting_language( (sel_lang) => {
    //   this.props.i18n.changeLanguage(sel_lang);
    // });
    socketOn.admin_setting( (settings) => {
      this.props.i18n.changeLanguage(settings.language);
      localStorage.setItem("admin_setting", JSON.stringify(settings));
      this.setState({admin_setting: settings})
    });
  }

  componentWillMount() {
    var setting = JSON.parse(localStorage.getItem("setting"));
    if(!setting){
      setting = {
        message_font_size: 16,
        noti_sound_new_message: true,
        noti_sound_poke: true,
        noti_sound_view_broadcast_req: true,
        noti_join_leave_message: true,
        auto_broadcasting: true,
        color: "color1",
        language: "en"
      };
    }
    this.setState({setting});
  }

  componentDidMount() {
    
  }

  static openSidebar(side) {
    sidebarOpen(side);
  }

  /******************** reconnecting function *************************/

  again_connection = () => {
    clearInterval(this.chk_socket_interval)
    
    console.log(this.attempt_interval)
    if(this.attempt_interval === undefined || this.attempt_interval === 0) {
      console.log("start interval : ", this.attempt_interval)
      this.attempt_interval = setInterval( () => this.show_reconnect_modal(), 15000)
      if(this.attempt_interval) {
        this.show_reconnect_modal()
      }
    }
  }

  show_reconnect_modal = () => {
    console.log("here is show_reconnect_modal")
    var new_attempt_count = this.state.attempt_count
    new_attempt_count ++
    socketEmit.disconnect();
    recreateSocket();
    this.socket_handler();
    var token = sessionStorage.getItem("socket_token");
    setTimeout( () => {
      if(this.attempt_interval !== undefined || this.attempt_interval !== 0){
        socketEmit.rejoinUser(token,(err) => {
          if(err === null) {
            clearInterval(this.attempt_interval)
            this.attempt_interval = 0
            this.close_reconnect_modal()
          }else {
            console.log("rejoin user response :: " ,err)
            this.setState({user: null})
          }
        
        })
      }
    }, 1000);
    this.setState({isShowReconnectModal: true, attempt_count: new_attempt_count})
  }

  close_reconnect_modal = () => {
    this.setState({isShowReconnectModal: false, attempt_count: 0})
  }

  newOpenExistingPrivateRoom(roomName) {
    var selected_room = this.state.rooms.find(room => room.name === roomName);
    // add new private message
    var receiver = this.state.user.name == selected_room.owner ? selected_room.managers : selected_room.owner;
    var new_sys_message = this.props.t("ChatApp.sys_private_message", {username: selected_room.owner});
    var message = {
      type : "system",
      sender: {name:'system_message'},
      text: new_sys_message,
      color: 'color1',
      time: moment.utc().valueOf(),
    };
    var new_private_messages = this.state.private_messages;
    const new_private_room = new_private_messages.find(room => room.name === roomName);
    if(new_private_room) {
      if (new_private_room.messages.length >= 30) {
        new_private_room.messages.shift();
      }
      new_private_room.messages.push(message);

    }else {
      // add new private room
      var new_room = {name: roomName, messages: []};
      new_room.messages.push(message);
      new_private_messages.push(new_room)
    }

    this.setState({private_messages: new_private_messages});
  }

  /****************************** Login Action ******************************/
  onActionLogin(type, param) {
    let decode_token = {}
    console.log(type)
    switch(type){
      case "create_socket":
        const b_64 = base64.encode(utf8.encode(JSON.stringify(param)));
        sessionStorage.setItem("socket_token", b_64);
        // this.socket_handler();
        break;
      case "join_room":
        console.log("join room param")
        console.log(param)
        decode_token = JSON.parse(utf8.decode(base64.decode(sessionStorage.getItem("socket_token"))));
        let find_room_index = decode_token.roomIds.findIndex( r => r == param)
        if(find_room_index > -1){
          decode_token.roomIds = decode_token.roomIds.filter( r => r != param) // reorder room ids
          console.log(decode_token.roomIds)
          decode_token.roomIds.unshift(param)
          console.log(decode_token.roomIds)
        }else {
          decode_token.roomIds.unshift(param)
        }
        console.log(decode_token)
        sessionStorage.setItem("socket_token", base64.encode(utf8.encode(JSON.stringify(decode_token))))
        break;
      case "close_room":
        console.log("join room param")
        console.log(param)
        decode_token = JSON.parse(utf8.decode(base64.decode(sessionStorage.getItem("socket_token"))));
        decode_token.roomIds = decode_token.roomIds.filter( r => r != param)
        console.log(decode_token)
        sessionStorage.setItem("socket_token", base64.encode(utf8.encode(JSON.stringify(decode_token))))
        break;
    }
  } 

  /****************************** JoinRoom Action ******************************/
  onActionJoinRoom(type, data) {
    switch(type){
      case "showPasswordModal":
        this.setState({isShowPasswordModal: true, selectJoinRoomName: data.roomName});
        break;
      case "showCreateRoomModal":
        this.setState({ joinRoomModalOpen: !this.state.joinRoomModalOpen, createRoomModalOpen: !this.state.createRoomModalOpen });
        break;
    }
  }  
  /****************************** JoinRoom Action End ******************************/

  /********************** Setting Area *********************************/
  toggleSettingModal() {
    this.setState({isShowSettingModal: !this.state.isShowSettingModal});
  }

  onActionUpdateSetting(type, value) {
    var setting = this.state.setting;
    switch(type){
      case "font_size":
        setting.message_font_size = value;
        break;
      case "language":
        setting.language = value;
        this.props.i18n.changeLanguage(value);
        break;
      case "sound_new_message":
        setting.noti_sound_new_message = !setting.noti_sound_new_message;
        break;
      case "sound_poke":
        setting.noti_sound_poke = !setting.noti_sound_poke;
        break;
      case "sound_view_broadcast_req":
        setting.noti_sound_view_broadcast_req = !setting.noti_sound_view_broadcast_req;
        break;
      case "join_leave_message":
        setting.noti_join_leave_message = !setting.noti_join_leave_message;
        break;
      case "auto_broadcasting":
        setting.auto_broadcasting = !setting.auto_broadcasting;
        break;
      case "remove_blocked_user":
        let block_users = this.state.block_users.filter( (user) => user != value );
        this.setState({block_users});
        break;
    }
    localStorage.setItem("setting", JSON.stringify(setting));
    this.setState({setting});
    
  }

  /********************** Setting Area End *********************************/
  
  /****************************** Alert Action ******************************/
  close_notice(key) {
    notification.removeNotice(key);
  }

  onClickReqAccept(username, key) {
    var message = this.props.t("ChatApp.user_broadcast_permission", {username});
    notification.notice({
      content: <div className="react-alert-area" style={{display: "flex", flexDirection: "column"}}>
        <div className="message-content">
          <span style={{maxWidth: "85%"}}>{message}</span>
          <Close onClick={() =>this.close_notice(key)} className="icon icon-alert-close"size="20px" style={{color: "white"}} />
        </div>
        <div className="confirm-area">
          <span>{this.props.t("ChatApp.owner_permission_granted")}</span>
        </div>
      </div>,
      duration: 20,
      key,
    });
    // notification.removeNotice(key);
    let type = true;
    socketEmit.setPermissionFromOwner(username, type);
  }

  onClickReqDeny(username, key) {
    var message = this.props.t("ChatApp.user_broadcast_permission", {username});
    notification.notice({
      content: <div className="react-alert-area" style={{display: "flex", flexDirection: "column"}}>
        <div className="message-content">
          <span style={{maxWidth: "85%"}}>{message}</span>
          <Close onClick={() =>this.close_notice(key)} className="icon icon-alert-close"size="20px" style={{color: "white"}} />
        </div>
        <div className="confirm-area">
          <span>{this.props.t("ChatApp.owner_permission_denied")}</span>
        </div>
      </div>,
      duration: 20,
      key,
    });
    let type = false;
    socketEmit.setPermissionFromOwner(username, type);
  }
  /****************************** Alert Action End ******************************/

  /****************************** Broadcasting Action ******************************/
  onActionStopBroadcast() {
    this.setState({isLocalBroadcastingStop: true});
    // this.close_remote_video(this.state.user.id);
  }

  onActionStartBroadcast(data) {
    var new_broadcast_rooms = this.state.user_broadcast_rooms;
    if(this.chk_max_video(new_broadcast_rooms)) {
      new_broadcast_rooms.push(
        {
          type: "local",
          roomId: this.state.user.id, 
          owner: this.state.user.name,
          audioInputSelect: data.audioInputSelect,
          videoInputSelect: data.videoInputSelect, 
          private: data.privateBroadcast, 
          watermark: data.watermark, 
          mute: false, 
          volume: 0, 
          zoom: false,
          created: new Date().getTime()
        });
        this.setState({ isLocalBroadcasting: true, user_broadcast_rooms: new_broadcast_rooms, isRemoteBroadcasting: true });
    }
    // this.setState(
    //   {
    //     isLocalBroadcasting: true,
    //     audioInputSelect: data.audioInputSelect,
    //     videoInputSelect: data.videoInputSelect,
    //     privateBroadcast: data.privateBroadcast,
    //     watermark: data.watermark,
    //   });
  }

  onActionOnBroadcast( type, data) {
    var new_broadcast_rooms = [];
    var new_broadcasting_viwers = [];
    var isRemoteBroadcasting = this.state.isRemoteBroadcasting;
    switch(type){
      case "start_broadcasting":
        // console.log("data : ", data)
        socketEmit.startBroadcast(true, data.broadcastId, data.is_private_broadcast, data.watermark);
        break;
      case "stop_broadcasting":
        // console.log("stop broadcasting")
        socketEmit.stopBroadcast(false, "", false, false);
        let c_room = this.state.user_broadcast_rooms.find( (room) => room.roomId == data.room_id );
        new_broadcast_rooms = this.state.user_broadcast_rooms.filter( (room) => room.roomId != data.room_id );
        isRemoteBroadcasting = this.state.isRemoteBroadcasting;
        if(new_broadcast_rooms.length == 0) {
          isRemoteBroadcasting = false;
        }
        this.setState({isRemoteBroadcasting, isLocalBroadcasting: false, user_broadcast_rooms: new_broadcast_rooms, broadcasting_viwers: []});
        break;
      case "join_room_user":
        // console.log("join_room_user user : ", data.username)
        socketEmit.joinUserBroadcast({broadcastId: data.room_id});
        break;
      case "join_room_error":
        this.props.alert.error(data.error);
        // console.log("join_room_error roomid : ", data.broadcastId)
        new_broadcast_rooms = this.state.user_broadcast_rooms.filter( (room) => room.roomId != data.broadcastId );
        isRemoteBroadcasting = this.state.isRemoteBroadcasting;
        if(new_broadcast_rooms.length == 0) {
          isRemoteBroadcasting = false;
        }
        // console.log("join_room_error : ", new_broadcast_rooms)
        this.setState({isRemoteBroadcasting, user_broadcast_rooms: new_broadcast_rooms});
        break;
      case "closed_remote_video":
        let current_user = this.state.users.find( (usr) => usr.id == data.room_id );
        // console.log("current_user : ", data.room_id)
        if(current_user){
          let username = current_user.name;
          if(data.type == "owner") {
            let message = this.props.t("ChatApp.owner_close_broadcasting", {username});
            this.props.alert.info(message);
          }else if(data.type == "not_same_room") {
            let message = this.props.t("ChatApp.owner_not_same_room", {username});
            // console.log("not same room : ", message)
            this.props.alert.info(message);
          }
        }

        this.closed_broadcastrooms.push(data.room_id);
        
        new_broadcast_rooms = this.state.user_broadcast_rooms.filter( (room) => room.roomId != data.room_id );
        isRemoteBroadcasting = this.state.isRemoteBroadcasting;
        if(new_broadcast_rooms.length == 0) {
          isRemoteBroadcasting = false;
        }
        socketEmit.closedRemoteVideo(data.room_id);
        this.setState({isRemoteBroadcasting, user_broadcast_rooms: new_broadcast_rooms});
        break;
      case "remote_video_action":
        new_broadcast_rooms = this.state.user_broadcast_rooms;
        var foundIndex = new_broadcast_rooms.findIndex(room => room.roomId === data.roomId);
        var new_ordered_broadcast_rooms = [];
        if(foundIndex !== -1 ) {
          if(data.type == "mute"){
            // console.log("custom slider data : ", data)
            new_broadcast_rooms[foundIndex].mute = data.value;
          }else if(data.type == "value") {
            // console.log("custom slider data : ", data)
              if(data.value == 0) {
                new_broadcast_rooms[foundIndex].mute = true;
                new_broadcast_rooms[foundIndex].volume = data.value;
              }else {
                new_broadcast_rooms[foundIndex].mute = false;
                new_broadcast_rooms[foundIndex].volume = data.value;
              }
          }else if(data.type == "zoom") {
            // console.log("custom zoom data : ", data)
            if(data.value) {
              // remove all zoom = false
              for (var x of new_broadcast_rooms) {
                x.zoom = false;
              }
            }
            // update zoom value
            const focus_room = new_broadcast_rooms.find(r => r.roomId === data.roomId);
            focus_room.zoom = data.value;

            new_ordered_broadcast_rooms = new_broadcast_rooms.sort(function(a,b){
              return a.created-b.created;
            });
            // console.log("time sort new rooms : ", JSON.stringify(new_ordered_broadcast_rooms))
            new_ordered_broadcast_rooms = new_broadcast_rooms.sort(function(a,b){
              return b.zoom-a.zoom;
            });
            // console.log("zoom sort new rooms : ", JSON.stringify(new_ordered_broadcast_rooms))
          }
        }
        // console.log("custom slider data : ", new_broadcast_rooms)
        this.setState({user_broadcast_rooms: new_broadcast_rooms});
        break;
    }
  }

  close_remote_video(room_id) {
    let current_room = this.state.user_broadcast_rooms.find( (room) => room.roomId == room_id );
    let username = current_room.owner;
    // console.log({current_room})
    let new_broadcast_rooms = this.state.user_broadcast_rooms.filter( (room) => room.roomId != room_id );
    // console.log({new_broadcast_rooms})
    // let isRemoteBroadcasting = this.state.isRemoteBroadcasting;
    // if(new_broadcast_rooms.length == 0) {
    //   isRemoteBroadcasting = false;
    // }

    
    return new_broadcast_rooms
    
  }
  /****************************** Broadcasting Action End******************************/

  /****************************** Left Side Bar Action ******************************/
  onActionSidebarLeft(type, data) {
    switch(type){
      case "viewUser":
        let user = this.state.users.find( (user) => user.name == data.username );
        this.setState({viewSelUser: user, showUserActionArea: true});
        break;
      case "closeUserActionArea":
        this.setState({viewSelUser: null, showUserActionArea: false});
        break;
    }
  }  
  /****************************** Left Side Bar Action End ******************************/

  /****************************** Top Bar Action ******************************/
  toggleCreateRoomModal() {
    if(this.state.user.type != 'guest'){
      this.setState({ createRoomModalOpen: !this.state.createRoomModalOpen });
    }else{
      this.props.alert.error(this.props.t('ChatApp.error_create_room'));
      // this.props.alert.show("Only member can create a room", { type: 'error' }, null, false);
    }
  }

  toggleJoinRoomModal() {
    // this.props.alert.show(this.props.t('ChatApp.socket_disconnected'));
    // socketEmit.disconnect();
    // setTimeout( () => {
    //   var token = localStorage.getItem("socket_token");
    //   console.log("here is test recreate socket *************", token)
    //     recreateSocket();
    //     setTimeout( () => {socketEmit.rejoinUser(token,(err) => {
    //       console.log("rejoin user response :: " ,err)
    //     })}, 1000);
      
    // },1000)
    this.setState({ joinRoomModalOpen: !this.state.joinRoomModalOpen });
  }

  /****************************** Top Bar Action End ******************************/
  

  /****************************** Message Area ******************************/
  selectRoom(roomName) {
    if(roomName == this.state.room) {
      return;
    }else {
      let targetRoom = this.state.rooms.find(room => room.name === roomName);
      this.onActionLogin('join_room', targetRoom.id) // update socket token roomIds
      let newUserRooms = [];
      this.state.user_rooms.map( (item, i) => {
        if(item.name == roomName){
          newUserRooms.push({ name: item.name, active: 1, missing_m_ct: 0, block_users: item.block_users, messages: item.messages});
        }else {
          newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
        }
      });
      // console.log("user_rooms : ", newUserRooms)
      this.setState({ user_rooms: newUserRooms , room: roomName});
      socketEmit.joinRoom(targetRoom.name, targetRoom.password, 'change', (err) => {
        // console.log("join room " + targetRoom.name + " : ", err);
      });
    }
  }

  closeRoom(roomName, type = 'general') {
    const sel_room = this.state.rooms.find( r => r.name == roomName)
    this.onActionLogin('close_room', sel_room.id) // update socket token roomIds
    let newUserRooms = [];
    if(type == "kick") {
      let message = this.props.t("ChatApp.kicked_from_owner", {roomName});
      this.props.alert.show(message);
    }
    if(type == "ban") {
      let message = this.props.t("ChatApp.banned_from_owner", {roomName});
      this.props.alert.show(message);
    }
    if(type == "admin_ban") {
      let message = this.props.t("ChatApp.banned_from_admin", {roomName});
      this.props.alert.show(message);
    }
    if(type == "admin_close_room"){
      let message = this.props.t("ChatApp.deleted_room_by_admin", {roomName});
      this.props.alert.show(message);
    }
    if(type == "private") {
      var new_private_messages = this.state.private_messages.filter(room => room.name != roomName);
      this.setState({ private_messages: new_private_messages });
    }
    
    this.state.user_rooms.map( (item, i) => {
      if(item.name != roomName){
        newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
      }
    });    

    if(newUserRooms.length > 0) {
      // console.log({newUserRooms})
      this.setState({ user_rooms: newUserRooms });
      socketEmit.leaveRoom(roomName, type, (err) => {});
      const targetRoom = this.state.rooms.find(room => room.name === newUserRooms[0].name);
      socketEmit.joinRoom(targetRoom.name, targetRoom.password || null, 'change', (err) => {
      });
    }else {
      // socketEmit.leaveRoom(roomName, type, (err) => {});
      socketEmit.disconnect();
      localStorage.removeItem("token");
      this.setState({user: null});
    }
  }

  onClickUserInMessage(action , username, id, room_type) {
    if(action == "show_profile") {
      // let user = this.state.users.find( (user) => user.name == username );
      // if(user && room_type == "general" && user.name != this.state.user.name && id != undefined) {
      if(room_type == "general" && username != this.state.user.name && id != undefined) {
        const current_room = this.state.user_rooms.find( room => room.name == this.state.room);
        let cur_message = current_room.messages.find( message => message.id == id);
        console.log({cur_message})
        let user = cur_message.sender;
        this.setState({viewSelUser: user, showUserActionArea: true});
      }

    }else if(action == "show_link") {
      console.log("url : ", username)
      // console.log("host : ", id)
      if(id == 'youtube.com' || id == 'www.youtube.com') {
        this.showYoutube(username)
      }else{
        // console.log(username)
        window.open(username, '_blank');
      }
    }else if(action == "show_image") {
      if(room_type == "private"){
        var new_private_messages = this.state.private_messages;
        const new_private_room = new_private_messages.find(room => room.name === this.state.room);
        // new_private_room.messages.find(msg => msg.id == id).is_check = true;
        for(var message of new_private_room.messages) {
          if(message.id == id) {
            message.is_check = true;
          }
        }
        this.setState({private_messages: new_private_messages});
      }else{
        let newUserRooms = [];
        this.state.user_rooms.map( (item, i) => {
          if(this.state.room != item.name) {
            newUserRooms.push(item);
          }
          else{
            var new_messages = item.messages;
            for(var message of new_messages) {
              if(message.id == id) {
                message.is_check = true;
              }
            }
            newUserRooms.push({ name: item.name, active: 1, missing_m_ct: 0, block_users: item.block_users, messages: new_messages});
          }
        });
        this.setState({user_rooms: newUserRooms});
      }
      
    }
    
  }

  showMessageContents(currentRoom) {
    const currentUserRoom = this.state.user_rooms.find(room => room.name === this.state.room); // for blocked users
    if(currentRoom === undefined || currentUserRoom === undefined) {
      return null;
    }
    var messages = currentUserRoom.messages;
    if(currentRoom.type == "private") {
      var active_private_room = this.state.private_messages.find(room => room.name == this.state.room);
      messages = active_private_room !== undefined ? active_private_room.messages : [];
    }
    if(messages.length == 0) {
      return null;
    }
    return (<div className="messages" style={{fontSize: this.state.setting.message_font_size}}>
        {this.state.room && currentRoom && currentUserRoom && messages.map((message, key) => {
          if (message.type == "general" && message.sender.name === this.state.user.name) {
            return <MyMessage  onActionOnMessage={this.onClickUserInMessage} message={message} font_size={this.state.setting.message_font_size} key={key} />;
          }else if(message.type == "general" && this.state.block_users.find(usr =>usr.ip == message.sender.ip)) {
            // console.log("admin level blocked users message.");
            return null;
          }else if(message.type == "general" && currentRoom.blocks.find(usr =>usr.ip == message.sender.ip)) {
            // console.log("owner or moderator level blocked users message.");
            return null;
          }else if(message.type == "general" && currentUserRoom.block_users.includes(message.sender.name)) {
            // console.log("user level blocked users message.");
            return null;
          }else if(message.type == "system"){
            return <SystemMessage 
              message={message} 
              key={key} 
            />;
          }else if(message.type == "poke"){
            return <PokeMessage activeRoom={this.state.room} user={this.state.user} message={message} key={key} />;
          }else{
            return <Message onActionOnMessage={this.onClickUserInMessage}  font_size={this.state.setting.message_font_size} message={message} key={key} />;
          }
          
        })}
      </div>)
  }

  addSystemMessage(newUserRooms, roomName, type) {
    let sender = 'you';//this.state.user.name;
    let messageText = '';
    if(type == "join"){
      messageText += this.props.t("ChatApp.sys_join_room", {username: sender});
    }else if(type == "ban"){
      messageText += this.props.t("ChatApp.sys_ban_owner_room", {username: sender});
    }else if(type == "admin_ban"){
      messageText += this.props.t("ChatApp.sys_ban_admin_room", {username: sender});
    }else if(type == "kick"){
      messageText += this.props.t("ChatApp.sys_kick_room", {username: sender});
    }else if(type == "join_private"){
      messageText += this.props.t("ChatApp.sys_private_message", {username: sender});
    }else if(type == "leave"){
      messageText += this.props.t("ChatApp.sys_leave_room", {username: sender});
    }
    
    const message = {
      sender: {name:'system_message'},
      text: messageText,
      color: 'color1',
      type: "system",
      time: moment.utc().valueOf(),
    };
    var foundIndex = newUserRooms.findIndex(room => room.name === roomName);
    if(foundIndex !== -1 ) {
      // send system message other members of room 
      // socketEmit.sendSystemMessage(roomName, type);
      if (newUserRooms[foundIndex].messages.length >= 30) {
        newUserRooms[foundIndex].messages.shift();
      }
      newUserRooms[foundIndex].messages.push(message);
      return newUserRooms
    }else {
      return newUserRooms
    }
    
  }

  receiveSystemMessage(newUserRooms, roomName, type, sender) {
    let messageText = '';
    if(type == "join"){
      messageText += this.props.t("ChatApp.sys_join_room", {username: sender});
      // if setting leave and join message is true, notification
      if(!this.state.setting.noti_join_leave_message || this.state.user.name == sender) {
        return newUserRooms
      }
    }else if(type == "ban"){
      messageText += this.props.t("ChatApp.sys_ban_owner_room", {username: sender});
    }else if(type == "admin_ban"){
      messageText += this.props.t("ChatApp.sys_ban_admin_room", {username: sender});
    }else if(type == "admin_ban_all"){
      messageText += this.props.t("ChatApp.sys_ban_admin_room_all", {username: sender});
    }else if(type == "kick"){
      messageText += this.props.t("ChatApp.sys_kick_room", {username: sender});
    }else if(type == "join_private"){
      messageText += this.props.t("ChatApp.sys_private_message", {username: sender});
    }else if(type == "leave"){
      // if setting leave and join message is true, notification
      messageText += this.props.t("ChatApp.sys_leave_room", {username: sender});
      if(!this.state.setting.noti_join_leave_message || this.state.user.name == sender) {
        return newUserRooms
      }
    }

    const message = {
      sender: {name:'system_message'},
      text: messageText,
      color: 'color1',
      type: "system",
      time: moment.utc().valueOf(),
    };
    var foundIndex = newUserRooms.findIndex(room => room.name === roomName);
    if(foundIndex !== -1 ) {
      if (newUserRooms[foundIndex].messages.length >= 30) {
        newUserRooms[foundIndex].messages.shift();
      }
      newUserRooms[foundIndex].messages.push(message);
      return newUserRooms
    }else {
      return newUserRooms
    }
  }

  onActionUserInputMessage(type, data) {
    switch(type) {
      case "change_color":
        const {sel_color} = data;
        var tempUser = this.state.user;
        tempUser.color = sel_color;
    
        var setting = this.state.setting;
        setting.color = sel_color;
        localStorage.setItem("setting", JSON.stringify(setting));
        this.setState({setting});
        socketEmit.changeUserColor(sel_color);
        this.setState({user: tempUser});
        break;
      case "loggedOutAPrivateUser":
        let sys_closed_private_message = this.props.t("ChatApp.sys_closed_private_message");
        var message = {
          type : "system",
          sender: {name:'system_message'},
          text: sys_closed_private_message,
          color: 'color1',
          time: moment.utc().valueOf(),
        };
        var new_private_messages = this.state.private_messages;
        var new_private_room = new_private_messages.find(room => room.name === this.state.room);
        if (new_private_room.messages.length >= 30) {
          new_private_room.messages.shift();
        }
        new_private_room.messages.push(message);
        this.setState({private_messages: new_private_messages});
        // update the room available = 0
        socketEmit.loggedOutAPrivateUser(this.state.room);
        break;
      case "newPrivateMessage":
        // add new message
        var message = {
          type : "private",
          sender: this.state.user,
          text: data.text,
          message_type: data.message_type,
          is_check: false,
          color: this.state.setting.color,
          time: moment.utc().valueOf(),
        };
        var new_private_messages = this.state.private_messages;
        var new_private_room = new_private_messages.find(room => room.name === this.state.room);
        if(new_private_room) {
          if (new_private_room.messages.length >= 30) {
            new_private_room.messages.shift();
          }
          new_private_room.messages.push(message);

        }else {
          // add new private room
          var new_room = {name: this.state.room, messages: []};
          new_room.messages.push(message);
          new_private_messages.push(new_room)
        }

        this.setState({private_messages: new_private_messages});
        break;
    }
}

  isBlockedUser(selUser, users, rooms) {
    // console.log({selUser})
    const {room, user_rooms, block_users} = this.state;
    var all_block_users = [];
    let blockedUser = undefined;
    for(var i in user_rooms) {
      // console.log("isblockeduser user rooms: ", user_rooms[i])
      // console.log("isblockeduser rooms: ", rooms)
      let room = rooms.find(r => r.name == user_rooms[i].name);
      if(room.type != "private1") { // we don't need to check private room
        // system block
        // console.log("system blocks: ",  block_users)
        blockedUser = block_users.find(user => user.ip == selUser.ip); // system block
        if(blockedUser) return true;
        // room block
        // console.log("room blocks: ",  room.blocks)
        blockedUser = room.blocks.find( user => user.ip == selUser.ip); // owner block
        if(blockedUser) return true;
        // user block
        // console.log("user blocks: ",  user_rooms[i].block_users)
        blockedUser = user_rooms[i].block_users.find(username => username == selUser.name); // user_room block
        if(blockedUser) return true;
      }
    }
    return false;

  }

  showYoutube(link) {
    this.setState({youtubeLink: link, youtube_show: true})
  }

  youtube_action (action) {
    if(action == 'close') {
      this.setState({youtubeLink : ''})
    }else if(action == 'hide') {
      this.setState({youtube_show : !this.state.youtube_show})
    }
  }

  /****************************** Message Area End ******************************/
  /****************************** ban modal ******************************/
  toggleCreateBanModal() {
    if(this.state.user.type == 'super_admin' || this.state.user.type == 'admin') {
      this.setState({ createBanModalOpen: !this.state.createBanModalOpen });
      this.onActionSidebarLeft('closeUserActionArea', {});
    }else{
      let messageText = this.props.t("ChatApp.error_admin_can_ban_user");
      this.props.alert.error(messageText);
      // this.props.alert.show("Only member can create a room", { type: 'error' }, null, false);
    }
  }
  /****************************** ban modal end ******************************/
  /****************************** password modal ******************************/
  togglePasswordModal() {
    this.setState({ isShowPasswordModal: !this.state.isShowPasswordModal });
  }
  /****************************** password modal end ******************************/

  /****************************** Sound Area ******************************/
  handleSongFinishedPlaying(roomName) {
    
    socketEmit.clientMessage('', roomName, this.state.user.color, 'poke_check', "", (err) => {
      // console.log(err);
      this.setState({ poke_status: false });
    });
  }

  handleSongFinishedPlayingNew() {
    this.setState({new_sound_alert: false});
  }

  handleSongFinishedPlayingBroadcastRequest() {
    this.setState({new_broadcast_request_sound: false});
  }
  /****************************** Sound Area End ******************************/

 
 /****************************** UserAction area message ******************************/
  diff(arr, arr2) {
    var ret = [];
    for(var i in arr) {   
        if(arr2.indexOf(arr[i]) > -1){
            ret.push(arr[i]);
        }
    }
    return ret;
  }
  update_broadcast_rooms = (users, rooms) => {
    // validate viewing broadcast user is in the same room
    var that = this;
    let new_broadcast_rooms = [];
    let same_room_users = this.get_all_same_room_users(users, rooms);
    // console.log({same_room_users})
    this.state.user_broadcast_rooms.forEach( function(room) {
      // console.log("view broadcasting user ", room.roomId) 
      // console.log("room owner :", room.owner ) 
      let user = same_room_users.find(usr => usr == room.roomId)
      // console.log({user} ) 
      if(user) {
        new_broadcast_rooms.push(room);
      }else{
        // let username = room.owner;
        // let message = that.props.t("ChatApp.owner_not_same_room", {username});
        // that.props.alert.info(message);
        // console.log("user not exist")
        // close remote video
      }
    });
    

    // if auto broadcasting, add auto broadcast
    if(this.state.setting.auto_broadcasting) {
      for (var y of same_room_users) {
        // console.log({users})
        // console.log({y})
        const sel_user = users.find( u => u.id == y);
        // console.log({sel_user})
        if(sel_user && sel_user.is_broadcast) {
          // if not existing in current video rooms
          // console.log("current rooms : ", JSON.stringify(new_broadcast_rooms))
          if(new_broadcast_rooms.find(r => r.roomId == y) || this.state.user.id == y || sel_user.is_private_broadcast) {
            // already exist

          }else{
            // console.log("current input user : ", sel_user)
            if(!this.closed_broadcastrooms.find( r => r == sel_user.id) && this.chk_max_video(new_broadcast_rooms)) {
              new_broadcast_rooms.push(
                {
                  type: "remote",
                  roomId: sel_user.id, 
                  owner: sel_user.name,
                  private: sel_user.is_private_broadcast, 
                  watermark: sel_user.broadcast_watermark, 
                  mute: false, 
                  volume: 100, 
                  zoom: false,
                  created: new Date().getTime()
                }
              );
              // end push
            }
          }
        } 
      }
    }
    
    return new_broadcast_rooms;
  }

  get_all_same_room_users = (users, rooms) => {
    var current_user = users.find( usr => usr.id == this.state.user.id);
    var all_users = [];
    if(current_user) {
      for(var x of current_user.rooms) {
        var sel_room = rooms.find(r => r.name == x)
        all_users = [...all_users, ...sel_room.users]
        // all_users = all_users.concat(sel_room.users);
      }
      const uniqueArray = all_users.filter((item,index) => all_users.indexOf(item) === index);
      // remove blocked user
      let last_array = [];
      for(var i in uniqueArray) {
        const user = users.find(u => u.id == uniqueArray[i])
        // console.log({user})
        // console.log(this.isBlockedUser(user, users, rooms))
        if(user && !this.isBlockedUser(user, users, rooms)) {
          last_array.push(uniqueArray[i]);
        }
      }
      // console.log({last_array})
      return last_array;
    }else{
      // console.log("current user not existing in users : ", this.state.user)
      return [];
    }
  }

  chk_max_video = (user_broadcast_rooms) => {
    if(user_broadcast_rooms.length >= this.state.admin_setting.max_video_count) {
      let message = this.props.t('ChatApp.error_max_broadcast_video', {count: this.state.admin_setting.max_video_count});
      this.props.alert.info(message);
      return false;
    }else {
      return true;
    }
  }
  onClickUserAction(type, data) {
    switch(type) {
      case "view_user_broadcast":
        if(this.chk_max_video(this.state.user_broadcast_rooms)) {
          // console.log(this.state.user_broadcast_rooms.length)
          this.closed_broadcastrooms = this.closed_broadcastrooms.filter(r => r != data.broadcastId);
          var new_broadcast_rooms = this.state.user_broadcast_rooms;
          new_broadcast_rooms.push(
            {
              type: "remote",
              roomId:data.broadcastId, 
              owner: data.owner, 
              private: data.private, 
              watermark: data.watermark, 
              mute: false, 
              volume: 100, 
              zoom: false,
              created: new Date().getTime()
            }
          );
          this.setState({ user_broadcast_rooms: new_broadcast_rooms, isRemoteBroadcasting: true });
        }
        break;
      case "getPermissionToOwner":
        const find_pending_id = this.pending_broadcast_ids.find( b => b.owner == data.owner)
        if(!find_pending_id) {
          const message = this.props.t('UserActionArea.sent_broadcast_request', { owner: data.owner });
          this.props.alert.show(message);
          this.pending_broadcast_ids.push( { owner: data.owner, broadcastId: data.broadcastId } )
          socketEmit.getPermissionToOwner( data.owner, data.broadcastId );
        }else {
          let message = this.props.t("ChatApp.pending_permission_request");
          this.props.alert.error(message);
        }
        break;
      case "created_private_room":
        var new_private_messages = this.state.private_messages;
        // add new private room
        let sys_messageText = this.props.t("ChatApp.sys_private_message", {username:data.receiver});
        var message = {
          type : "system",
          sender: {name:'system_message'},
          text: sys_messageText,
          color: 'color1',
          time: moment.utc().valueOf(),
        };
        var new_room = {name: data.roomName, messages: []};
        new_room.messages.push(message);
        new_private_messages.push(new_room);
        break;
      case "send_poke_message":
        let newUserRooms = [];
        console.log("poke sent")
        const cur_room = this.state.rooms.find(r => r.name === data.roomName)
        if(cur_room.type === 'private') {
          var new_private_messages = this.state.private_messages;
          const new_private_room = new_private_messages.find(room => room.name === data.roomName);
          let newUserRooms = [];
          this.state.user_rooms.map( (item, i) => {
            if(data.roomName == item.name && item.active == 0) {
              newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct + 1, block_users: item.block_users, messages: item.messages});
            }
            else{
              newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
            }
          });
          if (new_private_room.messages.length >= 30) {
            new_private_room.messages.shift();
          }
          let message = {
            sender: this.state.user,
            receiver: data.receiver,
            text: 'poke',
            color: 'color5',
            time: moment.utc().valueOf(),
            type: "poke",
            checked: true,
          }
          new_private_room.messages.push(message);
          this.setState({user_rooms: newUserRooms, private_messages: new_private_messages});
        }else {
          this.state.user_rooms.map( (item, i) => {
            let update_messages = item.messages
            
            if(item.name == data.roomName) {
              if (update_messages.length >= 30) {
                update_messages.shift();
              }
              let message = {
                sender: this.state.user,
                receiver: data.receiver,
                text: 'poke',
                color: 'color5',
                time: moment.utc().valueOf(),
                type: "poke",
                checked: true,
              }
              update_messages.push(message);
              newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: update_messages});
            }
            else{
              newUserRooms.push({ name: item.name, active: item.active, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: update_messages});
            }
          });
          this.setState({ user_rooms: newUserRooms });
        }
        break;
      case "block_person":
        // general user block -> internal room block
        // update user_rooms
        var newUserRooms = [];
        var new_broadcast_rooms = [];
        var isRemoteBroadcasting = false;
        var remove_broadcast = false;
        this.state.user_rooms.map( (item, i) => {
          if(item.name == data.selRoom){
            var newBlockUsers = item.block_users;
            if(data.block_type == "block"){
              // if user is watching selected user video, close remote video
              const selUser = this.state.users.find(u => u.name == data.selUsername)
              // console.log({selUser})
              if(selUser) {
                if(selUser.is_broadcast) { // selected user is broadcasting
                  remove_broadcast = true;
                  new_broadcast_rooms = this.state.user_broadcast_rooms.filter(r => r.owner != data.selUsername);
                  isRemoteBroadcasting = new_broadcast_rooms.length > 0 ? true : false;
                  socketEmit.closedRemoteVideo(selUser.broadcast_id);
                }
              } 

              newBlockUsers.push(data.selUsername);  
            }else{
              newBlockUsers = item.block_users.filter(username => username != data.selUsername);
            }
            newUserRooms.push({ name: item.name, active: 1, missing_m_ct: item.missing_m_ct, block_users: newBlockUsers, messages: item.messages});
          }else{
            newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users, messages: item.messages});
          }
        });
        if(remove_broadcast) {
          this.setState({ user_rooms: newUserRooms, user_broadcast_rooms: new_broadcast_rooms, isRemoteBroadcasting });
        }else{
          this.setState({ user_rooms: newUserRooms });
        }
        break;
      case "ban_person":
        // show modal ban
        this.setState({ createBanModalOpen: true,targetBanUser: data.selUser });
        break;
    }
  }

  /****************************** UserAction area message end ******************************/

  render() {
    
    var route_param = this.props.match.params
    var roomId = "";
    var serverAutoLogin = false;
    var sUser = "";
    var sPass = "";
    if(route_param.roomId !== undefined) {
      roomId = route_param.roomId
    }else {
      // return null;
      document.location.href = Config.CHAT_SERVER_URL
      return;
    }

    if(route_param.username !== undefined) {
      sUser = route_param.username
    }
    if(route_param.password !== undefined) {
      sPass = route_param.password
    }
    if(sUser != "" && sPass != "") {
      serverAutoLogin = true;
    }
    // console.log("roomId 1 :" , roomId)
    if (!this.state.user) {
      var token = localStorage.getItem("token");
      if(token) {
        var user = jwt.decode(token, secret);
        if(user.version != Config.VERSION) {
          localStorage.removeItem("token");
          return <LoginPage onActionLogin={this.onActionLogin} lastUser={null} autoLogin={true} roomId={roomId} serverAutoLogin={serverAutoLogin} sUser={sUser} sPass={sPass} />;  
        }else{
          if(user.expire > Date.now()) {
            return <LoginPage onActionLogin={this.onActionLogin} lastUser={user} autoLogin={true} roomId={roomId} serverAutoLogin={serverAutoLogin} sUser={sUser} sPass={sPass} />;  
          }else{
            localStorage.removeItem("token");
            return <LoginPage onActionLogin={this.onActionLogin} lastUser={null} autoLogin={true} roomId={roomId} serverAutoLogin={serverAutoLogin} sUser={sUser} sPass={sPass} />;  
          }
        }
        
      }else{
        return <LoginPage onActionLogin={this.onActionLogin} lastUser={null} autoLogin={false} roomId={roomId} serverAutoLogin={serverAutoLogin} sUser={sUser} sPass={sPass} />;
      }
    }else{
      if(this.state.user.version != Config.VERSION) {
        localStorage.removeItem("token");
        return <LoginPage onActionLogin={this.onActionLogin} lastUser={null} autoLogin={false} roomId={roomId} serverAutoLogin={false} sUser={sUser} sPass={sPass} />;  
      }else {
        const current_room = this.state.rooms.find( room => room.name === this.state.room );
        if(!current_room) {
          return null;
        }
        var target_user = null; // using in private chat
        var is_available = true; // using in private chat - target user is available ?
        if(current_room.type == "private") {
          var socket_ids = current_room.name.split("@");
          
          if(socket_ids[0] == this.state.user.id) {
            target_user = this.state.users.find(user => user.id === socket_ids[1]);
          }else{
            target_user = this.state.users.find(user => user.id === socket_ids[0]);
          }
          if(!target_user) {
            is_available = false;
          }
        }
        return (
          <div className="video-conference">
            <div className="header-bar">
              <div className="header-left">
                <div className="logo">
                  <img src={'/img/logo_chat_trand_small_6.png'} alt="logo" />
                </div>
                <div className="settings">
                  <div className="themes">
                    <button onClick={this.toggleJoinRoomModal} title={this.props.t('ChatApp.rooms_descr')}>
                      {/* <IconRoom className="icon" size="24px" /> ROOMS */}
                      <strong>{this.props.t('ChatApp.rooms')}</strong>
                    </button>
                  </div>
                  <div className="create-room">
                    <button onClick={this.toggleSettingModal} title={this.props.t('ChatApp.setting_sounds')}>
                      {/* <Comments className="icon" size="24px" /> */}
                      <strong>{this.props.t('ChatApp.setting_sounds')}</strong>
                    </button>
                  </div>
                </div>
              </div>
              <div className="header-right">
                <div className="setting-area">
                  <button onClick={() => ChatApp.openSidebar('right')} title={this.props.t('ChatApp.change_theme_background')}>
                    <Palette className="icon" size="24px" />
                  </button>
                </div>
                <div className="current-user">
                  <div className="avatar-area">
                    <img className="user-avatar" src={this.state.user.avatar === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.state.user.avatar} alt="user-avatar" />
                    <img className="user-type" src={this.state.user.type == 'guest' ? '/img/avatars/guest.png' : '/img/avatars/member.png' } alt="user-type" />
                  </div>
                  <div className="name-area">
                    <label>{this.state.user.name}</label>
                  </div>
                  
                </div>
              </div>
            </div>
            <div className="chat-app">
              <SidebarLeft
                user={this.state.user}
                users={this.state.users}
                current_room={current_room}
                admin_setting={this.state.admin_setting}
                isLocalBroadcasting={this.state.isLocalBroadcasting}
                user_rooms={this.state.user_rooms}
                block_users={this.state.block_users}
                selectRoom={this.selectRoom}
                onActionStopBroadcast={this.onActionStopBroadcast}
                onActionStartBroadcast={this.onActionStartBroadcast}
                onClickUserAction={this.onClickUserAction}
                onActionSidebarLeft={this.onActionSidebarLeft}
                viewSelUser={this.state.viewSelUser}
                user_broadcast_rooms={this.state.user_broadcast_rooms}
                showUserActionArea={this.state.showUserActionArea}
              />
              <div className="chat-content">
                <div className="topbar">
                  <div className="more">
                    <button onClick={() => ChatApp.openSidebar('left')} title={this.props.t('ChatApp.show_public_chats')}>
                      <More className="icon" size="22px" />
                    </button>
                  </div>
                  <div className="room-info">
                    {this.state.user_rooms.length > 0 && this.state.user_rooms.map((room, key) => {
                      const selRoom = this.state.rooms.find( (r) => r.name == room.name );
                      var currentRoomName = selRoom.name;
                      if(selRoom.type == "private") {
                        if(selRoom.owner == this.state.user.name) {
                          currentRoomName = selRoom.managers;
                        }else{
                          currentRoomName = selRoom.owner;
                        }
                      }
                      let last_room = this.state.user_rooms.length == 1 ? false : true;
                      return (
                        <div className={`user-room ${room.active ? 'active' : ''}`} key={key}>
                          <p onClick={() =>this.selectRoom(room.name)} className="cur-pointer">{currentRoomName}</p>
                          {last_room && <Close onClick={() =>this.closeRoom(room.name, selRoom.type)} className="icon cur-pointer" size="20px" />}
                          <span className={`missing-badge-ct ${room.missing_m_ct !== 0 ? 'active' : ''}`}>{ room.missing_m_ct > 9 ? '9+' : room.missing_m_ct }</span>
                        </div>
                        );
                    })}
                  </div>
                  
                </div>
                {this.showMessageContents(current_room)}
                {this.state.youtubeLink != '' && <div className={`youtube-content ${this.state.youtube_show ? '' : 'hide-youtube'}`}>
                  <div id='yt_player'>
                    <ReactPlayer url={this.state.youtubeLink} playing={this.state.youtube_show} width='100%' height='100%' controls/>
                  </div>
                  <div id='icon_area'>
                    <Close onClick={() =>this.youtube_action('close')} className="icon" size="20px" style={{color: "black"}} />
                    <Minus onClick={() =>this.youtube_action('hide')} className="icon" size="20px" style={{color: "black"}} />
                  </div>
                </div>}
                <UserInputMessage 
                  user_type={this.state.user.type}
                  user_color={this.state.setting.color}
                  is_available={is_available}
                  current_room_type={current_room.type}
                  current_room_available={current_room.available}
                  current_room_name={current_room.name}
                  admin_setting={this.state.admin_setting}
                  onActionUserInputMessage={this.onActionUserInputMessage}
                />
                
              </div>
              { ( this.state.isLocalBroadcasting || this.state.isRemoteBroadcasting ) && <BroadcastAuto
                socket_id={this.state.user.id}
                user_name={this.state.user.name}
                isLocalBroadcasting={this.state.isLocalBroadcasting}
                isLocalBroadcastingStop={this.state.isLocalBroadcastingStop}
                broadcasting_viwers={this.state.broadcasting_viwers ? this.state.broadcasting_viwers : []}
                user_broadcast_rooms={this.state.user_broadcast_rooms}
                isRemoteBroadcasting={this.state.isRemoteBroadcasting}
                onActionOnBroadcast={this.onActionOnBroadcast}
              />}
              <SidebarRight />
            </div>
            <CreateRoomModal
              isOpen={this.state.createRoomModalOpen}
              user={this.state.user}
              onRequestClose={() => this.toggleCreateRoomModal()}
            />
            <JoinRoomModal
              user={this.state.user}
              users={this.state.users}
              rooms={this.state.rooms}
              ban_users={this.state.ban_users}
              activeRoom={this.state.room}
              isOpen={this.state.joinRoomModalOpen}
              onRequestClose={() => this.toggleJoinRoomModal()}
              onActionJoinRoom={this.onActionJoinRoom}
            />
            <Modal
            className="reconnect-modal"
            isOpen={this.state.isShowReconnectModal}
            onRequestClose={ () => this.close_reconnect_modal() }
            >
              <div className="reconnect-area">
                <div className="md-header">
                  <div className="header-left">
                    <h3>{this.props.t('ChatApp.connection_lost')}</h3>
                  </div>
                </div>
                <div className="md-content">
                  <div>
                    <p>{this.props.t('ChatApp.connection_lost_description')}</p>
                    <p>{this.props.t('ChatApp.connection_attempt')} {this.state.attempt_count}</p>
                  </div> 
                </div>
              </div>
            </Modal>
            <SettingModal
              isOpen={this.state.isShowSettingModal}
              user={this.state.user}
              block_users={this.state.block_users}
              setting={this.state.setting}
              onActionUpdateSetting={this.onActionUpdateSetting}
              onRequestClose={() => this.toggleSettingModal()}
            />
            {this.state.isShowPasswordModal && <PasswordModal
              isOpen={this.state.isShowPasswordModal}
              onRequestClose={() => this.togglePasswordModal()}
              rooms={this.state.rooms}
              roomName={this.state.selectJoinRoomName}
            />}
            {this.state.createBanModalOpen && <BanModal
              isOpen={this.state.createBanModalOpen}
              user={this.state.user}
              activeRoom={this.state.room}
              targetBanUser={this.state.targetBanUser}
              onRequestClose={() => this.toggleCreateBanModal()}
            />}
            {this.state.poke_status && <Sound
                url="/media/poke.mp3"
                playStatus={Sound.status.PLAYING}
                playFromPosition={10 /* in milliseconds */}
                // onLoading={this.handleSongLoading}
                // onPlaying={this.handleSongPlaying}
                onFinishedPlaying={() => this.handleSongFinishedPlaying(this.state.poke_room_name)}
              />}
            {this.state.new_sound_alert && <Sound
              url="/media/new_message.mp3"
              playStatus={Sound.status.PLAYING}
              playFromPosition={10 /* in milliseconds */}
              onFinishedPlaying={this.handleSongFinishedPlayingNew}
            />}
            {this.state.new_broadcast_request_sound && <Sound
              url="/media/broadcast_requests.mp3"
              playStatus={Sound.status.PLAYING}
              playFromPosition={10 /* in milliseconds */}
              onFinishedPlaying={this.handleSongFinishedPlayingBroadcastRequest}
            />}
          </div>
        );
      } // user is existing
    } // version is right
  }
}

export default withTranslation()(withAlert()(ChatApp));
