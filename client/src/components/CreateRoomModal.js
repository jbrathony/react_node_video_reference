import React from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import PropTypes from 'prop-types';
import { socketEmit } from '../helpers/socketEvents';
import IconClose from 'react-icons/lib/md/close';
import { withTranslation } from 'react-i18next';

const customStyles = {
  overlay : {
    overflowY           : 'scroll'
  }
};

class CreateRoomModal extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      category: '',
      password: '',
      max_users: 9999
    };

    this.createRoom = this.createRoom.bind(this);
    this.handleChangeCategory = this.handleChangeCategory.bind(this);
    this.handleChangeMaxUsers = this.handleChangeMaxUsers.bind(this);
    this.onChangePassword = this.onChangePassword.bind(this);
  }

  createRoom(e) {
    e.preventDefault();
    const data = new FormData();

    // general
    const roomName = e.target.elements.roomName.value.trim();
    const description = e.target.elements.description.value.trim();
    const welcome_message = e.target.elements.welcome_message.value.trim();
    const password = this.state.password;

    if (!roomName) {
      return this.setState({ error: this.props.t('CreateRoomModal.error2') });
    }
    if(this.state.category == ''){
      return this.setState({ error: this.props.t('CreateRoomModal.error3') });
    }

    // media
    const file_icon = document.getElementById('icon');
    const file_cover_photo = document.getElementById('cover_photo');

    data.append('user_id', this.props.user.user_id);
    data.append('roomName', roomName);
    data.append('category', this.state.category);
    data.append('description', description);
    data.append('welcome_message', welcome_message);
    data.append('max_users', this.state.max_users);
    data.append('password', password);

    data.append('file_icon', file_icon.files[0]);
    data.append('file_cover_photo', file_cover_photo.files[0]);

    var newName = e.target.elements.roomName;
    var newDescription = e.target.elements.description;
    var newWelcomMessage = e.target.elements.welcome_message;
    
    axios.post('/api/create_temp_room', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => {
        if(response.data.code == 300){
          this.setState({ error: response.data.message });
        }else{
          socketEmit.createRoom(roomName, password, 'general', (err) => {
            if(err){
              this.setState({ error: err });
            } else {
              newName.value = '';
              newDescription.value = '';
              newWelcomMessage.value = '';
              this.setState({category: '', max_users: 9999, error: null, password: ''});
              this.props.onRequestClose();
            }
          }); // end socketEmit
        }
      })
      .catch(() => {
        this.setState({ error: this.props.t('CreateRoomModal.error1') });
      });
      
    
  }

  handleChangeCategory(event) {
    this.setState({category: event.target.value});
  }

  handleChangeMaxUsers(event) {
    this.setState({max_users: event.target.value});
  }

  onChangePassword(event) {
    this.setState({password: event.target.value});
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }
  
  render() {
    return (
      <Modal
        className="create-room-modal"
        isOpen={this.props.isOpen}
        onRequestClose={this.props.onRequestClose}
        style={customStyles}
      >
        <div className="md-close">
          <IconClose className="icon close-modal" onClick={this.props.onRequestClose} size="24px" />
        </div>
        <form onSubmit={this.createRoom}>
          <h3>{this.props.t('CreateRoomModal.create_a_room')}</h3>
          <p className="error">{this.state.error}</p>
          <fieldset>
            <legend>{this.props.t('CreateRoomModal.general')}</legend>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.room_name')}</p>
              <input type="text" name="roomName" maxLength="20" autoFocus autoComplete="off" />
              <small>{this.props.t('CreateRoomModal.room_name_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.category')}</p>
              <select id="category" name="category" value={this.state.category} onChange={this.handleChangeCategory}>
                <option value="">{this.props.t('CreateRoomModal.select')}</option>
                <option value="Comedy">{this.props.t('CreateRoomModal.commedy')}</option>
                <option value="Entertainment">{this.props.t('CreateRoomModal.entertainment')}</option>
                <option value="Gaming">{this.props.t('CreateRoomModal.gaming')}</option>
                <option value="Social">{this.props.t('CreateRoomModal.social')}</option>
                <option value="Technology">{this.props.t('CreateRoomModal.technology')}</option>
                <option value="Teen">{this.props.t('CreateRoomModal.teen')}</option>
                <option value="Other">{this.props.t('CreateRoomModal.other')}</option>
              </select>
              <small>{this.props.t('CreateRoomModal.category_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.description')}</p>
              <input type="text" name="description" maxLength="80" autoComplete="off" />
              <small>{this.props.t('CreateRoomModal.description_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.welcome_message')}</p>
              <textarea name="welcome_message" rows="3" maxLength="700" autoComplete="off" />
              <small>{this.props.t('CreateRoomModal.welcome_message_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.max_users')}</p>
              <select id="max_users" name="max_users" value={this.state.max_users} onChange={this.handleChangeMaxUsers}>
                <option value="9999">{this.props.t('CreateRoomModal.unlimited')}</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
              <small>{this.props.t('CreateRoomModal.max_users_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.password')}</p>
              <input type="password" name="password" value={this.state.password} onChange={this.onChangePassword} />  
              <small>{this.props.t('CreateRoomModal.password_descr')}</small>
            </div>
          </fieldset>
          <fieldset>
            <legend>{this.props.t('CreateRoomModal.media')}</legend>
            <div >
              <p className="title">{this.props.t('CreateRoomModal.upload_icon')}</p>
              <input type="file" name="icon" id="icon" />
              <small>{this.props.t('CreateRoomModal.icon_descr')}</small>
            </div>
            <div>
              <p className="title">{this.props.t('CreateRoomModal.cover')}</p>
              <input type="file" name="cover_photo" id="cover_photo" />
              <small>{this.props.t('CreateRoomModal.cover_descr')}</small>
            </div>
          </fieldset>
          
          <button type="submit" className="button-text">{this.props.t('CreateRoomModal.create')}</button>
        </form>
      </Modal>
    );
  }
}

CreateRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
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
  onRequestClose: PropTypes.func.isRequired,
};

export default withTranslation()(CreateRoomModal);
