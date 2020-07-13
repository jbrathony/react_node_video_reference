/* eslint-disable space-before-blocks */
import React from 'react';
import PropTypes from 'prop-types';
import { sidebarClose } from '../helpers/sidebarToggle';
import IconClose from 'react-icons/lib/md/close';
import Camera from 'react-icons/lib/md/videocam';
import IconStar from 'react-icons/lib/fa/star';
import IconBlock from 'react-icons/lib/md/block';
import IconLock from 'react-icons/lib/md/lock';
import { withAlert } from "react-alert";
import { ClipLoader } from 'react-spinners';
import ReactTooltip from 'react-tooltip'
import { withTranslation } from 'react-i18next';

import AvatarModal from './AvatarModal';
import UserActionArea from './UserActionArea';
import BroadcastSettingModal from './video/BroadcastSettingModal';

const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};

class SidebarLeft extends React.Component {
  constructor() {
    super();

    this.state = {
      avatarModalOpen: false,
      createRoomModalOpen: false,
      broadcastModalOpen: false,
      audioInputSelect: false,   
      videoInputSelect: false,
      passwordModal: {
        open: false,
        roomName: null,
      },
      isUserSelect: false,
      selectedUser: null,
      showListArea: false,
      searchUser: "",
    };

    this.toggleAvatarModal = this.toggleAvatarModal.bind(this);
    this.toggleCreateRoomModal = this.toggleCreateRoomModal.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
    this.showBroadcastModal = this.showBroadcastModal.bind(this);
    this.hideBroadcastModal = this.hideBroadcastModal.bind(this);
    this.onBlockPerson = this.onBlockPerson.bind(this);
    this.broadcastStream = this.broadcastStream.bind(this);
    this.onChangeSearchUser = this.onChangeSearchUser.bind(this);
  }

  static closeSidebar() {
    sidebarClose('left');
  }

  toggleAvatarModal() {
    this.setState(prevState => ({ avatarModalOpen: !prevState.avatarModalOpen }));
  }

  toggleCreateRoomModal() {
    this.setState(prevState => ({ createRoomModalOpen: !prevState.createRoomModalOpen }));
  }

  showBroadcastModal() {
    if(!this.props.admin_setting.guest_broadcast && this.props.user.type == 'guest') { // default Guest user can't start broadcast
      let message = this.props.t('SidebarLeft.error_guest_dont_have_broadcast_permission');
      this.props.alert.info(message);
    }else{
      navigator.getUserMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
      if(navigator.getUserMedia){
        this.setState({ broadcastModalOpen: true });
      }else{
        let message = this.props.t('SidebarLeft.error_not_support_this_browser');
        this.props.alert.info(message);
      }
    }
  }

  hideBroadcastModal() {
    this.setState({ broadcastModalOpen: false });
  }

  togglePasswordModal(roomName) {
    this.setState(prevState => ({
      passwordModal: {
        open: !prevState.passwordModal.open,
        roomName,
      },
    }));
  }

  onChangeSearchUser(e) {
    this.setState({searchUser: e.target.value});
  }

  onBlockPerson(selUser) {
    if(selUser.name == this.props.user.name){
      console.log("you can't block this person");
    }else{
      this.setState({isUserSelect: true, selectedUser: selUser});
    }
  }

  chatUserActionArea(currentRoom, room_type){
    if(this.props.viewSelUser) {
      return (<UserActionArea
        user={this.props.user}
        selUser={this.props.viewSelUser}
        users={this.props.users}
        current_room={this.props.current_room}  
        admin_setting={this.props.admin_setting}  
        user_rooms={this.props.user_rooms}
        block_users={this.props.block_users}
        selectRoom={this.props.selectRoom}
        user_broadcast_rooms={this.props.user_broadcast_rooms}
        onClickUserAction={this.props.onClickUserAction}
        onCloseActionArea={this.props.onActionSidebarLeft}
        />)
    // }else if(room_type != "private" && !this.props.showUserActionArea ){
    }else if(!this.props.showUserActionArea ){
      var cur_room_user_details = [];
      currentRoom.users.forEach(usr_id => {
        var user = this.props.users.find(user => user.id === usr_id);
        if(user) {
          cur_room_user_details.push(user);
        }
      });
      // console.log("cur_room_user_details : ", cur_room_user_details)
      var cur_room_users = cur_room_user_details.sort(function(a,b) {
        return b.is_broadcast-a.is_broadcast;
      });
      return (
        <div className="chat-user-list">
          <div className="public-chats-list">
            {this.props.current_room && cur_room_users.map( (selUser, key) => {
              // let selUser = this.props.users.find(user => user.id === user_id);
              // if(!selUser){
              //   console.log("there is no users in this room.");
              //   location.reload();
              // }
              if(!selUser.name.includes(this.state.searchUser) ){
                return null;
              }
              // when room is private : hide me
              if(room_type == "private" && selUser.name == this.props.user.name) {
                return null;
              }
              let room = this.props.current_room;
              let currentRoom = this.props.user_rooms.find(r => r.name === room.name);
              // console.log("this.props.user_rooms :",this.props.user_rooms)
              // console.log("room blocks :",room.blocks)
              // console.log("currentRoom :",currentRoom)
              let blockedUser = undefined;
              if(currentRoom !== undefined){
                // console.log("block users :::::::::: :",this.props.block_users)
                // console.log("current users :::::::::: :",selUser.ip)
                blockedUser = this.props.block_users.find(user => user.ip == selUser.ip); // system block
                // console.log("blockeduser :::::::::: :",blockedUser)
                if(blockedUser == undefined) {
                  // console.log("room.blocks : ",room.blocks);
                  // blockedUser = room.blocks.find( user => user.name == selUser.name); // owner block
                  blockedUser = room.blocks.find( user => user.ip == selUser.ip); // owner block
                }
                if(blockedUser == undefined) {
                  // console.log("currentRoom.block_users : ",currentRoom.block_users);
                  blockedUser = currentRoom.block_users.find(username => username == selUser.name); // user_room block
                }
              }else{
                blockedUser = undefined;
              }
              // console.log("blockedUser",blockedUser);
              
              let managers = [];
              managers = room.managers;

              var member_type = selUser.type;
              if(member_type != "super_admin" && member_type != "admin") {
                if(selUser.name == room.owner) {
                  member_type = "owner";
                }else if(managers.includes(selUser.name)) {
                  member_type = "moderator";
                }
              }
              var permission_view_ip = false;
              if(this.props.user.type == "admin" || this.props.user.type == "super_admin")
                permission_view_ip = true;
              
            return (
              <div className="list" key={key} onClick={() => (selUser.name != this.props.user.name) && this.props.onActionSidebarLeft("viewUser",{username: selUser.name})} >
                <div className="p-relative">
                  <img className="img-user-type" src={selUser.type == 'guest' ? '/img/avatars/guest.png' : '/img/avatars/member.png' } alt="user type" />  
                  {blockedUser !== undefined && <IconBlock className="img-user-block" size="20px" />}
                </div>
                <img className="img-user-gender" src={selUser.gender == 'male' ? '/img/avatars/male.png' : '/img/avatars/female.png' } alt="user gender" />
                <Camera className={`img-user-camera ${selUser.is_broadcast ? 'active' : ''}`} size="20px" />
                {selUser.is_broadcast && selUser.is_private_broadcast && <IconLock className="img-user-camera" style={{color: "#d5d841"}} size="17px" />}
                {permission_view_ip ? <div className="pull-left" style={{lineHeight: "18px"}}><label className="primary" data-tip={selUser.ip} data-place='bottom' data-for='icon_ip' >{selUser.name}</label>
                  <ReactTooltip id='icon_ip' />
                                      </div> :
                <label className="primary" >{selUser.name}</label>}
                {member_type == "owner" && <IconStar className="img-user-star-owner" alt="owner" size="20px" />}
                {member_type == "moderator" && <IconStar className="img-user-star-moderator" size="20px" />}
                {(member_type == "admin" || member_type == "super_admin") && <IconStar className="img-user-star-admin" size="20px" />}
              </div>
            )} )}
          </div>
          <div className="search-user">
            <input type="text" maxLength="10" autoComplete="off" placeholder={this.props.t("SidebarLeft.search")} value={this.state.searchUser} onChange={this.onChangeSearchUser} />
          </div>
        </div>
      )
    }
    return null;
  }

  publicChatArea() {
    const currentRoom = this.props.current_room;
    if(!currentRoom){
      return (
        <div className="public-chats">
          <ClipLoader
            css={override}
            sizeUnit={"px"}
            size={35}
            color={'#6c65ace0'}
            loading={this.state.loading}
          />
        </div>
      );
    }
    var currentRoomName = currentRoom.name;
    if(currentRoom.type == "private") {
      var target_username = "";
      if(currentRoom.owner == this.props.user.name) {
        target_username = currentRoom.managers;
      }else{
        target_username = currentRoom.owner;
      }
      currentRoomName = this.props.t("SidebarLeft.private_chat_with") + target_username;
    }else{
      currentRoomName = currentRoomName + " (" + currentRoom.users.length + ")";
    }

    return (
      <div className="public-chats">
            <div className="panel">
              <p>{currentRoomName}</p>
            </div>
            {this.chatUserActionArea(currentRoom, currentRoom.type)}
      </div>
    );
  }

  broadcastStream() {
    if(!this.props.isLocalBroadcasting) {
      return (
        <div className="broadcast">
          <button className="btn-camera" title={this.props.t("SidebarLeft.start_broadcasting")} onClick={this.showBroadcastModal}>
            <Camera className="camera" size="24px" />
            Start Broadcasting
          </button>
        </div>
      );
    }
    return (
      <div className="broadcast">
          <button className="btn-camera" title={this.props.t("SidebarLeft.stop_broadcasting")} onClick={this.props.onActionStopBroadcast}>
            <Camera className="camera" size="24px" />
            Stop Broadcasting
          </button>
      </div>
    );
  }

  render() {
    return (
      <div className="sidebar-left sidebar-left-closed">
        {this.broadcastStream()}
        {this.publicChatArea()}
        
        <AvatarModal
          isOpen={this.state.avatarModalOpen}
          onRequestClose={this.toggleAvatarModal}
          user={this.props.user}
        />
        {this.state.broadcastModalOpen && <BroadcastSettingModal
          isOpen={this.state.broadcastModalOpen}  
          user={this.props.user}
          onActionStartBroadcast={this.props.onActionStartBroadcast}
          onRequestClose={this.hideBroadcastModal}
        />}
        <button className="close" onClick={() => SidebarLeft.closeSidebar()}>
          <IconClose className="img-close-sidebar" alt="close sidebar" size="20px" />
        </button>
      </div>
    );
  }
}

SidebarLeft.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    user_id: PropTypes.number,
    is_broadcast: PropTypes.bool,
    broadcast_id: PropTypes.string,
    is_private_broadcast: PropTypes.bool,
    broadcast_watermark: PropTypes.bool,
    name: PropTypes.string,
    color: PropTypes.string,
    gender: PropTypes.string,
    type: PropTypes.string,
    ip: PropTypes.string,
    avatar: PropTypes.string,
    rooms: PropTypes.array,
  }).isRequired,
  isLocalBroadcasting: PropTypes.bool,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  current_room: PropTypes.object.isRequired,
  admin_setting: PropTypes.object.isRequired,
  user_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
  block_users: PropTypes.array.isRequired,
  selectRoom: PropTypes.func.isRequired,
  onClickUserAction: PropTypes.func.isRequired,
  onActionStopBroadcast: PropTypes.func.isRequired,
  onActionStartBroadcast: PropTypes.func.isRequired,
  onActionSidebarLeft: PropTypes.func.isRequired,
  viewSelUser: PropTypes.object,
  user_broadcast_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
  showUserActionArea: PropTypes.bool,
};

export default withTranslation()(withAlert()(SidebarLeft));