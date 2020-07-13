/* eslint-disable import/first */
import React from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { socketEmit } from '../helpers/socketEvents';
import IconClose from 'react-icons/lib/md/close';

const customStyles = {
  overlay: {
    overflowY: 'scroll',
  },
};

class BanModal extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      room_name: 'all',
      ban_type: 'ip',
      ip1: 0,
      ip2: 0,
      ip3: 0,
      ip4: 0,
      ip_from_1: 0,
      ip_from_2: 0,
      ip_from_3: 0,
      ip_from_4: 0,
      ip_to_1: 0,
      ip_to_2: 0,
      ip_to_3: 0,
      ip_to_4: 0,
    };

    this.createBan = this.createBan.bind(this);
    this.handleChangeRoom = this.handleChangeRoom.bind(this);
    this.handleChangeBanType = this.handleChangeBanType.bind(this);
    this.onChangeIp = this.onChangeIp.bind(this);
  }

  createBan(e) {
    e.preventDefault();
    let ips = '';
    if (this.state.ban_type == 'ip') {
      ips = this.state.ip1+'.'+this.state.ip2+'.'+this.state.ip3+'.'+this.state.ip4;
    } else {
      ips = this.state.ip_from_1+'.'+this.state.ip_from_2+'.'+this.state.ip_from_3+'.'+this.state.ip_from_4;
      ips += '~';
      ips += this.state.ip_to_1+'.'+this.state.ip_to_2+'.'+this.state.ip_to_3+'.'+this.state.ip_to_4;
    }
    let that = this;
    let selUser = this.props.targetBanUser;
    socketEmit.adminAddBanUser(selUser.name, selUser.ip, selUser.user_id, this.state.room_name, this.props.user.name, this.state.ban_type, ips, (err) => {
      // console.log(err);
      that.props.onRequestClose();
    });
  }

  handleChangeRoom(event) {
    this.setState({room_name: event.target.value});
  }

  handleChangeBanType(event) {
    this.setState({ban_type: event.target.value});
  }

  onChangeIp(id, event) {
    switch (id) {
      case 'ip1':
        this.setState({ip1: event.target.value});
        break;
      case 'ip2':
        this.setState({ip2: event.target.value});
        break;
      case 'ip3':
        this.setState({ip3: event.target.value});
        break;
      case 'ip4':
        this.setState({ip4: event.target.value});
        break;
      case 'ip_from_1':
        this.setState({ip_from_1: event.target.value});
        break;
      case 'ip_from_2':
        this.setState({ip_from_2: event.target.value});
        break;
      case 'ip_from_3':
        this.setState({ip_from_3: event.target.value});
        break;
      case 'ip_from_4':
        this.setState({ip_from_4: event.target.value});
        break;
      case 'ip_to_1':
        this.setState({ip_to_1: event.target.value});
        break;
      case 'ip_to_2':
        this.setState({ip_to_2: event.target.value});
        break;
      case 'ip_to_3':
        this.setState({ip_to_3: event.target.value});
        break;
      case 'ip_to_4':
        this.setState({ip_to_4: event.target.value});
        break;
    }
  }

  componentWillMount() {
    let ips = this.props.targetBanUser.ip.split('.');
    this.setState({
      ip1: ips[0], ip2: ips[1], ip3: ips[2], ip4: ips[3],
      ip_from_1: ips[0], ip_from_2: ips[1], ip_from_3: ips[2], ip_from_4: ips[3],
      ip_to_1: ips[0], ip_to_2: ips[1], ip_to_3: ips[2], ip_to_4: ips[3],
    });
    Modal.setAppElement('body');
  }
  
  render() {
    // console.log(this.state)
    return (
      <Modal
        className="create-ban-modal"
        isOpen={this.props.isOpen}
        onRequestClose={this.props.onRequestClose}
        style={customStyles}
      >
        <div className="md-close">
          <IconClose className="icon close-modal" onClick={this.props.onRequestClose} size="24px" />
        </div>
        <form onSubmit={this.createBan}>
          <h3>Ban User</h3>
          <p className="error">{this.state.error}</p>
          <fieldset>
            <div>
              <p className="title">User name *</p>
              <input type="text" name="username" value={this.props.targetBanUser.name} autoFocus autoComplete="off" readOnly disabled/>
            </div>
            <div className="md-t-20">
              <p className="title">Ban Type *</p>
              <select value={this.state.room_name} onChange={this.handleChangeRoom}>
                <option value="all">All Room</option>
                <option value={this.props.activeRoom}>This Room</option>
              </select>
            </div>
            <div className="md-t-20">
              <div style={{width: '50%', float: 'left'}}>
                <label style={{cursor: 'pointer'}}><input type="radio" name="ban_type" value="ip" checked={this.state.ban_type === 'ip'} style={{width: '20px', cursor: 'pointer'}} onChange={this.handleChangeBanType} />
                  &nbsp;Ip</label>
              </div>
              <div style={{width: '50%', float: 'left'}}>
                <label style={{cursor: 'pointer'}} ><input type="radio" name="ban_type" value="range" checked={this.state.ban_type === 'range'} style={{width: '20px', cursor: 'pointer'}} onChange={this.handleChangeBanType} />
                  &nbsp;Range</label>
              </div>
            </div>
            {this.state.ban_type === 'ip' && <div className="md-t-20">
              <input type="number" max="255" min="0" className="ip-input" value={this.state.ip4} onChange={(e) => this.onChangeIp('ip4', e)} />
              <input type="number" max="255" min="0" className="ip-input" value={this.state.ip3} onChange={(e) => this.onChangeIp('ip3', e)} />
              <input type="number" max="255" min="0" className="ip-input" value={this.state.ip2} onChange={(e) => this.onChangeIp('ip2', e)} />
              <input type="number" max="255" min="1" className="ip-input" value={this.state.ip1} onChange={(e) => this.onChangeIp('ip1', e)} />
            </div>}
            {this.state.ban_type === 'range' && <div>
              <div className="md-t-20">
                <label>From</label>
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_from_4} onChange={(e) => this.onChangeIp('ip_from_4', e)} />
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_from_3} onChange={(e) => this.onChangeIp('ip_from_3', e)} />
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_from_2} onChange={(e) => this.onChangeIp('ip_from_2', e)} />
                <input type="number" max="255" min="1" className="ip-input" value={this.state.ip_from_1} onChange={(e) => this.onChangeIp('ip_from_1', e)} />
              </div>
              <div className="md-t-10">
                <label>To</label>
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_to_4} onChange={(e) => this.onChangeIp('ip_to_4', e)} />
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_to_3} onChange={(e) => this.onChangeIp('ip_to_3', e)} />
                <input type="number" max="255" min="0" className="ip-input" value={this.state.ip_to_2} onChange={(e) => this.onChangeIp('ip_to_2', e)} />
                <input type="number" max="255" min="1" className="ip-input" value={this.state.ip_to_1} onChange={(e) => this.onChangeIp('ip_to_1', e)} />
              </div>
            </div>}
            
          </fieldset>
          
          <button type="submit" className="button-text">Ban</button>
        </form>
      </Modal>
    );
  }
}

BanModal.propTypes = {
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
  targetBanUser: PropTypes.shape({
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
  activeRoom: PropTypes.string.isRequired,
  onRequestClose: PropTypes.func.isRequired,
};

export default BanModal;
