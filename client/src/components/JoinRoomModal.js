import React from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import IconUsers from 'react-icons/lib/md/people';
import IconLock from 'react-icons/lib/md/lock';
import IconClose from 'react-icons/lib/md/close';
import { socketEmit } from '../helpers/socketEvents';
import { withTranslation } from 'react-i18next';

class JoinRoomModal extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      createRoomModalOpen: false,
      show_empty_room: false,
      passwordModal: {
        open: false,
        roomName: null,
      },
    };
    this.toggleCreateRoomModal = this.toggleCreateRoomModal.bind(this);
    this.togglePasswordModal = this.togglePasswordModal.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.handleCheckBox = this.handleCheckBox.bind(this);
  }

  joinRoom(roomName) {
    const sel_room = this.props.rooms.find( room => room.name == roomName);
    var ct_users = sel_room.users.length;
    let is_ban = false;
    let ban_user = this.props.ban_users.find( usr => { 
      // console.log("usr", usr)
      // console.log("roomName", roomName)
      if(usr.room_name==roomName) {
        if(usr.ip == this.props.user.ip || usr.nickname == this.props.user.name) {
          // console.log("this.props.user.ip", this.props.user.ip)
          return true;
        }
      } 
      return false;
     });
    // console.log("ban_user", ban_user)
    if(ban_user) {
      console.log("banned : level admin");
      is_ban = true;
    }
    if(sel_room.banned_users.find( usr => usr.ip == this.props.user.ip)) {
      console.log("banned : level owner");
      is_ban = true;
    }
    
    if(this.props.user.rooms.includes(roomName)){
      this.setState({error: this.props.t("JoinRoomModal.error1")});
    }else if(is_ban){
      this.setState({error: this.props.t("JoinRoomModal.error2")});
    }else if(sel_room.max_users == ct_users){
      this.setState({error: this.props.t("JoinRoomModal.error3")});
    }else if(sel_room.password != ''){
      this.props.onActionJoinRoom("showPasswordModal", {roomName: sel_room.name});
      this.props.onRequestClose();
    }else{
      this.setState({error: ""});
      socketEmit.joinRoom(roomName, sel_room.password || '', 'new', (err) => {
        // console.log("joinRoom emit error", err)
      });
      this.props.onRequestClose();
    }
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }

  toggleCreateRoomModal() {
    this.props.onActionJoinRoom("showCreateRoomModal", {});
    this.props.onRequestClose();
  }

  togglePasswordModal(roomName) {
    this.setState(prevState => ({
      passwordModal: {
        open: !prevState.passwordModal.open,
        roomName,
      },
    }));
  }

  handleCheckBox() {
    this.setState({
      show_empty_room: !this.state.show_empty_room
    });
  }
  
  render() {
    var general_rooms = this.props.rooms.filter( room => room.type != 'private' );
    return (
      <Modal
          className="join-room-modal"
          isOpen={this.props.isOpen}
          onRequestClose={this.props.onRequestClose}
      >
        <div className="join-room-area">
          <div className="md-close">
            <IconClose className="icon close-modal" onClick={this.props.onRequestClose} size="24px" />
          </div>
          <div className="md-header">
            <div className="header-left">
              <h3>{this.props.t("JoinRoomModal.rooms")} ({general_rooms.length})</h3>
            </div>
            { this.props.user.type != "guest" && <div className="header-right">
              <button type="button" className="button-text" onClick={this.toggleCreateRoomModal}>{this.props.t("JoinRoomModal.create_room")}</button>
            </div>}
          </div>
          <div style={{display: 'flex'}}>
            <label style={{cursor: "pointer"}}><input type="checkbox" id="show_empty_room" checked={this.state.show_empty_room} style={{width: "20px", cursor: "pointer"}} onChange={this.handleCheckBox} />
              &nbsp;{this.props.t('JoinRoomModal.show_empty_room')}
            </label>
          </div>
          <div className="md-content">
            
            <div className="error">{this.state.error}</div>
            {general_rooms.map( (room, key) => {
              if(!this.state.show_empty_room) {
                if(room.users.length == 0) {
                  return null;
                }
              }
              return (
              <div className={`room-area ${ (this.props.user.rooms.includes(room.name) ) ? 'hide' : 'show'}`} key={key} onClick={() => this.joinRoom(room.name)} title={`${room.password !== "" ? 'Enter password to join' : 'Join'} this room`}>
                <div className="md-c-left">
                  <img src={room.icon === '' ? '/img/public_chat.png' : '/img/rooms/'+room.icon } alt="chat-room" />
                </div>
                <div className="md-c-center">
                  <h4>{room.name}</h4>
                  {/* <p>{room.description}</p> */}
                </div>
                <div className="md-c-right">
                  <p>
                    { room.password !== "" && <IconLock className="icon" size="24px" />}
                    <IconUsers className="icon" size="24px" />
                    <span> {room.users.length}</span>
                  </p>
                </div>
              </div> 
              
            )})}
            
          </div>
        </div>
      </Modal>
    );
  }
}

JoinRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
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
  activeRoom: PropTypes.string,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
  ban_users: PropTypes.array.isRequired,
  onActionJoinRoom: PropTypes.func.isRequired
};

export default withTranslation()(JoinRoomModal);
