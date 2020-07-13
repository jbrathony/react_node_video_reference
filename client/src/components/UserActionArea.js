/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
import React from 'react';
import PropTypes from 'prop-types';
import IconClose from 'react-icons/lib/md/close';
import IconComment from 'react-icons/lib/md/mode-comment';
import IconBell from 'react-icons/lib/fa/bell';
import IconFlag from 'react-icons/lib/md/flag';
import IconCamera from 'react-icons/lib/md/videocam';
import { withAlert } from 'react-alert';
import { socketEmit } from '../helpers/socketEvents';
import Config from './config/config';
import { withTranslation } from 'react-i18next';

class UserActionArea extends React.Component {
  constructor() {
    super();

    this.state = {
      isUserSelect: false,
    };

    this.onActionCameraView = this.onActionCameraView.bind(this);
    this.onActionPrivateMessage = this.onActionPrivateMessage.bind(this);
    this.onActionPokeMessage = this.onActionPokeMessage.bind(this);
    this.onActionUserReport = this.onActionUserReport.bind(this);
    this.onActionViewProfile = this.onActionViewProfile.bind(this);
    this.onActionKickPerson = this.onActionKickPerson.bind(this);
    this.onActionBanPerson = this.onActionBanPerson.bind(this);
    this.onActionBlockPerson = this.onActionBlockPerson.bind(this);
    this.onActionUnBlockPerson = this.onActionUnBlockPerson.bind(this);
    // this.isSelUserExisting = this.isSelUserExisting.bind(this);
  }

  onActionCameraView() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    if (this.props.selUser.is_broadcast) {
      if (this.props.user_broadcast_rooms.find(room => room.roomId == this.props.selUser.broadcast_id)) {
        const message = this.props.t('UserActionArea.you_are_already_watching_the_broadcasting');
        this.props.alert.show(message);
      } else if (this.props.selUser.is_private_broadcast) {
        // socketEmit.getPermissionToOwner(this.props.selUser.name, this.props.selUser.broadcast_id);
        this.props.onClickUserAction('getPermissionToOwner', { broadcastId: this.props.selUser.broadcast_id, owner: this.props.selUser.name});
      } else {
        this.props.onClickUserAction('view_user_broadcast', { broadcastId: this.props.selUser.broadcast_id, owner: this.props.selUser.name, watermark: this.props.selUser.broadcast_watermark, private: this.props.selUser.is_private_broadcast });
      }

      this.props.onCloseActionArea('closeUserActionArea', {});
    } else {
      const message = this.props.t('UserActionArea.error_not_broadcast_video');
      this.props.alert.info(message);
      // if( this.props.user.type == "guest" ){
      // }
    }
  }
  onActionPrivateMessage() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    if (!this.props.admin_setting.guest_private && this.props.user.type == 'guest') { // default guest can send private message
      const message = this.props.t('UserActionArea.error_guest_dont_have_permission');
      this.props.alert.info(message);
    } else {
      const roomName = `${this.props.user.id}@${this.props.selUser.id}`;
      const alternative = `${this.props.selUser.id}@${this.props.user.id}`;
      if (this.props.user_rooms.find(room => room.name === roomName)) {
        // select room
        this.props.selectRoom(roomName);
      } else if (this.props.user_rooms.find(room => room.name === alternative)) {
        // select room
        this.props.selectRoom(alternative);
      } else {
        const that = this;
        socketEmit.createPrivateRoom(roomName, this.props.selUser.id, (err) => {
          if (!err) {
            // created private room
            that.props.onClickUserAction('created_private_room', { roomName, receiver: this.props.selUser.name });
          }
          // console.log('create private room : ', err);
        });
        this.props.onCloseActionArea('closeUserActionArea', {});
      }

      this.props.onCloseActionArea('closeUserActionArea', {});
    }
  }
  onActionPokeMessage() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    const that = this;
    const room = this.props.current_room;
    if(room.type === 'private') {
      socketEmit.clientPrivateMessage(this.props.selUser.id, this.props.current_room.name, this.props.user.color, 'poke', '', (err) => {
        if (err) { that.props.onClickUserAction('send_poke_message', { roomName: this.props.current_room.name, receiver: this.props.selUser }); }
      });
    }else{
      socketEmit.clientMessage(this.props.selUser.id, this.props.current_room.name, this.props.user.color, 'poke', '', (err) => {
        if (!err) { that.props.onClickUserAction('send_poke_message', { roomName: this.props.current_room.name, receiver: this.props.selUser }); }
      });
    }
    
    this.props.onCloseActionArea('closeUserActionArea', {});
  }
  onActionUserReport() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    const message = this.props.t('UserActionArea.error_user_report');
    this.props.alert.info(message);
  }
  onActionViewProfile() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }

    const url = `/profile/${this.props.selUser.name}`;
    window.open(url, '_blank');
  }
  onActionKickPerson() {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    const that = this;
    socketEmit.kickUser(this.props.selUser.name, this.props.current_room.name, (err) => {
      console.log(err);
    });
    that.props.onCloseActionArea('closeUserActionArea', {});
  }
  onActionBanPerson(member_type) {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);

    const that = this;
    if (this.props.selUser.type == 'super_admin' || this.props.selUser.type == 'admin') {
      const message = this.props.t('UserActionArea.error_cant_ban_admin');
      this.props.alert(message);
    } else if (member_type == 'super_admin' || member_type == 'admin') {
      this.props.onClickUserAction('ban_person', { selUser: this.props.selUser });
      // socketEmit.adminAddBanUser(this.props.selUser.name, this.props.current_room.name, (err) => {
      //     console.log(err);
      //     that.props.onCloseActionArea();
      // });
      this.props.onCloseActionArea('closeUserActionArea', {});
    } else {
      if (is_selUser_socket_id) {
        socketEmit.banUser(this.props.selUser.name, this.props.current_room.name, (err) => {
          console.log(err);
          that.props.onCloseActionArea('closeUserActionArea', {});
        });
      }
      this.props.onCloseActionArea('closeUserActionArea', {});
    }
  }
  onActionBlockPerson(member_type) {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }

    const room = this.props.current_room;
    if(room.type === 'private') {
      this.props.onClickUserAction('block_person', { block_type: 'block', selRoom: this.props.current_room.name, selUsername: this.props.selUser.name, selUserIp: this.props.selUser.ip });
      this.props.onCloseActionArea('closeUserActionArea', {});
    }else {

      if (this.props.selUser.type == 'super_admin' || this.props.selUser.type == 'admin') {
        const message = this.props.t('UserActionArea.error_cant_block_admin');
        this.props.alert(message);
      } else if (member_type == 'admin' || member_type == 'super_admin') {
        socketEmit.adminBlockUser(this.props.selUser.name, this.props.user.name, (err) => {
          console.log(err);
        });
        this.props.onCloseActionArea('closeUserActionArea', {});
      } else if (member_type == 'owner' || member_type == 'moderator') {
        socketEmit.ownerBlockUser(this.props.selUser.name, this.props.current_room.name, (err) => {
          console.log(err);
        });
        this.props.onCloseActionArea('closeUserActionArea', {});
      } else {
        this.props.onClickUserAction('block_person', { block_type: 'block', selRoom: this.props.current_room.name, selUsername: this.props.selUser.name, selUserIp: this.props.selUser.ip });
        this.props.onCloseActionArea('closeUserActionArea', {});
      }
    }
  }

  onActionUnBlockPerson(member_type) {
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    if (!is_selUser_socket_id) {
      return null;
    }
    const room = this.props.current_room;
    if(room.type === 'private') {
      this.props.onClickUserAction('block_person', { block_type: 'unblock', selRoom: this.props.current_room.name, selUsername: this.props.selUser.name, selUserIp: this.props.selUser.ip });
      this.props.onCloseActionArea('closeUserActionArea', {});
    }else{
      if (member_type == 'admin' || member_type == 'super_admin') {
        socketEmit.adminUnblockUser(this.props.selUser.name, (err) => {
          console.log(err);
        });
        this.props.onCloseActionArea('closeUserActionArea', {});
      } else if (member_type == 'owner' || member_type == 'moderator') {
        socketEmit.ownerUnblockUser(this.props.selUser.name, this.props.current_room.name, (err) => {
          console.log(err);
        });
        this.props.onCloseActionArea('closeUserActionArea', {});
      } else {
        this.props.onClickUserAction('block_person', { block_type: 'unblock', selRoom: this.props.current_room.name, selUsername: this.props.selUser.name, selUserIp: this.props.selUser.ip });
        this.props.onCloseActionArea('closeUserActionArea', {});
      }
    }
  }

  render() {
    const room = this.props.current_room;
    let managers = [];
    managers = room.managers;

    let member_type = this.props.user.type; // super_admin, admin, owner, manager, guest
    if (member_type != 'super_admin' && member_type != 'admin') {
      if (this.props.user.name == room.owner) {
        member_type = 'owner';
      } else if (managers.includes(this.props.user.name)) {
        member_type = 'moderator';
      }
    }
    // console.log("member_types", member_type)

    const enable_member_types = ['owner', 'moderator', 'admin', 'super_admin'];
    const enable_admin_types = ['admin', 'super_admin'];

    const currentRoom = this.props.user_rooms.find(r => room.name === r.name);
    let blockedUser;
    blockedUser = this.props.block_users.find(user => user.ip == this.props.selUser.ip); // system block
    if (blockedUser == undefined) {
      blockedUser = room.blocks.find(user => user.ip == this.props.selUser.ip); // owner block
    }
    if (currentRoom && blockedUser == undefined) {
      blockedUser = currentRoom.block_users.find(username => username == this.props.selUser.name); // user_room block
    }

    // console.log("selUser : ", this.props.selUser)
    // console.log("users : ",  this.props.users)
    // if selUser socket is not existing, only ban the user.
    const is_selUser_socket_id = this.props.users.find(usr => usr.id == this.props.selUser.id);
    // console.log("is_selUser_socket_id: ", is_selUser_socket_id)

    if(room.type === 'private'){
      // private room
      return (
        <div className="user-action-area">
          <div className="panel-body">
              <div className="user-body">
                  <div className="md-close">
                      <IconClose className="close-modal" onClick={() => this.props.onCloseActionArea('closeUserActionArea', {})} size="24px" />
                    </div>
                  <div className="user-avatar">
                      <img src={this.props.selUser.avatar === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.props.selUser.avatar} alt="user-avatar" />
                    </div>
                  <div className="user-name">{this.props.selUser.name}</div>
                </div>
              <div className="user-actions">
                  <div className="user-action" onClick={this.onActionCameraView} >
                      <div className="icon-base">
                          <IconCamera className={`icon icon-camera `} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.view')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionPrivateMessage} >
                      <div className="icon-base">
                          <IconComment className={`icon icon-comment `} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.message')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionPokeMessage} >
                      <div className="icon-base">
                          <IconBell className={`icon icon-bell ${is_selUser_socket_id ? 'active' : ''}`} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.poke')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionUserReport}>
                      <div className="icon-base">
                          <IconFlag className={`icon icon-flag `} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.report')}
                        </div>
                    </div>
                </div>
            </div>
          <div className="panel-body">
              <div className="panel-links">
                  {is_selUser_socket_id && blockedUser === undefined && (
                    <div className="action-link text-danger" onClick={() => this.onActionBlockPerson(member_type)}>
                            {this.props.t('UserActionArea.mute_this_person')}
                        </div>)
                    }
                  {is_selUser_socket_id && blockedUser !== undefined && (
                    <div className="action-link text-danger" onClick={() => this.onActionUnBlockPerson(member_type)}>
                            {this.props.t('UserActionArea.unmute_this_person')}
                        </div>)
                    }
                </div>
            </div>
        </div>
      );
    }else{
      // general room
      return (
        <div className="user-action-area">
          <div className="panel-body">
              <div className="user-body">
                  <div className="md-close">
                      <IconClose className="close-modal" onClick={() => this.props.onCloseActionArea('closeUserActionArea', {})} size="24px" />
                    </div>
                  <div className="user-avatar">
                      <img src={this.props.selUser.avatar === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.props.selUser.avatar} alt="user-avatar" />
                    </div>
                  <div className="user-name">{this.props.selUser.name}</div>
                </div>
              <div className="user-actions">
                  <div className="user-action" onClick={this.onActionCameraView} >
                      <div className="icon-base">
                          <IconCamera className={`icon icon-camera ${is_selUser_socket_id && this.props.selUser.is_broadcast ? 'active' : ''}`} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.view')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionPrivateMessage} >
                      <div className="icon-base">
                          <IconComment className={`icon icon-comment ${is_selUser_socket_id && this.props.user.type != 'guest1' ? 'active' : ''}`} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.message')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionPokeMessage} >
                      <div className="icon-base">
                          <IconBell className={`icon icon-bell ${is_selUser_socket_id ? 'active' : ''}`} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.poke')}
                        </div>
                    </div>
                  <div className="user-action" onClick={this.onActionUserReport}>
                      <div className="icon-base">
                          <IconFlag className={`icon icon-flag ${is_selUser_socket_id && this.props.user.type != 'guest' ? 'active' : ''}`} size="20px" />
                        </div>
                      <div className="label-base">
                          {this.props.t('UserActionArea.report')}
                        </div>
                    </div>
                </div>
            </div>
          <div className="panel-body">
              <div className="panel-links">
                  {is_selUser_socket_id && this.props.selUser.type != 'guest' && <div className="action-link" onClick={this.onActionViewProfile}>
                        {this.props.t('UserActionArea.view_profile')}
                                                                                    </div>}
                  {is_selUser_socket_id && enable_member_types.includes(member_type) && !enable_admin_types.includes(this.props.selUser.type) && <div className="action-link" onClick={this.onActionKickPerson}>
                        {this.props.t('UserActionArea.kick_from_room')}
                                                                                                                                                    </div>}
                  {enable_member_types.includes(member_type) && <div className="action-link" onClick={() => this.onActionBanPerson(member_type)}>
                        {this.props.t('UserActionArea.ban_from_room')}
                                                                  </div>}
                  {is_selUser_socket_id && blockedUser === undefined && (
                    <div className="action-link text-danger" onClick={() => this.onActionBlockPerson(member_type)}>
                            {this.props.t('UserActionArea.mute_this_person')}
                        </div>)
                    }
                  {is_selUser_socket_id && blockedUser !== undefined && (
                    <div className="action-link text-danger" onClick={() => this.onActionUnBlockPerson(member_type)}>
                            {this.props.t('UserActionArea.unmute_this_person')}
                        </div>)
                    }
                </div>
            </div>
        </div>
      );
    }
  }
}

UserActionArea.propTypes = {
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
  selUser: PropTypes.shape({
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
  current_room: PropTypes.object.isRequired,
  admin_setting: PropTypes.object.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  user_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
  user_broadcast_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
  block_users: PropTypes.array.isRequired,
  selectRoom: PropTypes.func.isRequired,
  onCloseActionArea: PropTypes.func.isRequired,
  onClickUserAction: PropTypes.func.isRequired,
};

export default withTranslation()(withAlert()(UserActionArea));
