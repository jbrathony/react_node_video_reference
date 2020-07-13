import React from 'react';
import PropTypes from 'prop-types';
import { socketEmit } from '../helpers/socketEvents';
import { withTranslation } from 'react-i18next';



class PokeMessage extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
    };
    this.handleSongFinishedPlaying = this.handleSongFinishedPlaying.bind(this);
  }

  handleSongFinishedPlaying(sender_id) {
    socketEmit.clientMessage(sender_id, this.props.activeRoom, this.props.user.color, 'poke_check', "", (err) => {
      // console.log(err);
    });
  }

  render() {
    if(this.props.message.sender.name == this.props.user.name){
      return (
        <div className="message">
          <div className="message-content">
          <p className={`font-${this.props.message.color}`}>
              <small className="text">{this.props.t("PokeMessage.you_have_poked", {username: this.props.message.receiver.name})}</small>
            </p>
          </div>
        </div>
      );
    }else if(this.props.user.name == this.props.message.receiver.name){
      return (
        <div className="message">
          <div className="message-content">
            <p className={`font-${this.props.message.color}`}>
              <small className="text">{this.props.t("PokeMessage.have_poked_you", {username: this.props.message.sender.name})}</small>
            </p>
          </div>
        </div>
      );  
    }else{
      // console.log("poke sender side message");
      return null;
    }
  }
}

PokeMessage.propTypes = {
  message: PropTypes.shape({
    sender: PropTypes.shape.isRequired,
    receiver: PropTypes.shape.isRequired,
    text: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    time: PropTypes.number.isRequired,
    consecutive: PropTypes.bool,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  activeRoom: PropTypes.string,
};

export default withTranslation()(PokeMessage);
