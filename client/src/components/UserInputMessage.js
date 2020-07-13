import React from 'react';
import PropTypes from 'prop-types';
import Config from '../components/config/config';
import { withAlert } from "react-alert";
import { socketEmit,getSocket } from '../helpers/socketEvents';
import Send from 'react-icons/lib/md/send';
import IconUpload from 'react-icons/lib/md/file-upload';
import { withTranslation } from 'react-i18next';
import axios from 'axios';

const color_panels = [
    { name: 'color1', color: '#212121' },
    { name: 'color2', color: '#656565' },
    { name: 'color3', color: '#800080' },
    { name: 'color4', color: '#6f4341' },
    { name: 'color5', color: '#990703' },
    { name: 'color6', color: '#ca226b' },
    { name: 'color7', color: '#f778a1' },
    { name: 'color8', color: '#f32f2f' },
    { name: 'color9', color: '#FF6600' },
    { name: 'color10', color: '#FF9900' },
    { name: 'color11', color: '#f1c85e' },
    { name: 'color12', color: '#006666' },
    { name: 'color13', color: '#2F4F4F' },
    { name: 'color14', color: '#6633CC' },
    { name: 'color15', color: '#47b617' },
    { name: 'color16', color: '#5cd87e' },
    { name: 'color17', color: '#6db4e9' },
    { name: 'color18', color: '#CC0066' },
    { name: 'color19', color: '#077104' }, 
    { name: 'color20', color: '#0a40f5' },
    { name: 'color21', color: '#1a61e3' },
    { name: 'color22', color: '#800080' },
    { name: 'color23', color: '#993399' },
    { name: 'color24', color: '#009900' },
    { name: 'color25', color: '#33CC66' },
    { name: 'color26', color: '#660000' },
    { name: 'color27', color: '#6666FF' },
    { name: 'color28', color: '#2f0c21' },
  ];

var keyPressTimer;
var numberOfKeys = 0;

class UserInputMessage extends React.Component {
    constructor() {
      super();

      this.state = {
          // message
          error: "",
          color_panel: false,               // user message text color
          message_text: '',
          show_emoji_picker: false,
          message_text_type: false
      };

      this.message_sending_time = 0;
      this.sendMessage = this.sendMessage.bind(this);
      this.openColorArea = this.openColorArea.bind(this);
      this.onSelectColor = this.onSelectColor.bind(this);
      this.onClickTextBold = this.onClickTextBold.bind(this);
      this.handleChangeMessage = this.handleChangeMessage.bind(this);
  
    }

  _handleKeyUp = (e) => {
    var code = e.keyCode || e.which;
      switch( code ) {
          case 13:
            // console.log("enter click")
            $('#btn-chat-message').click();
              break;
          default: 
              break;
      }
  }

  componentDidMount(){
    this.initEmojiOneArea(); // test
    this.message_sending_time = new Date().getTime();
    document.addEventListener("keyup", this._handleKeyUp);
  }

  initEmojiOneArea(){
    var that = this;
    $("#txt-chat-message").emojioneArea({
      placeholder: this.props.t("ChatApp.message_placeholder"),
      tones: false,
      autocomplete: true,
      inline: true,
      hidePickerOnBlur: true,
      events: {
        focus: function() {
            $('.emojionearea-category').unbind('click').bind('click', function() {
                $('.emojionearea-button-close').click();
            });
        },
        keyup: function(e) {
            // console.log()
            var chatMessage = $('.emojionearea-editor').html();
            if (!chatMessage || !chatMessage.replace(/ /g, '').length) {
              // console.log("here1")
                // connection.send({
                //     typing: false
                // });
            }
            // console.log("here ..", chatMessage)
            that.handleChangeMessage();

            // clearTimeout(keyPressTimer);
            // numberOfKeys++;

            // if (numberOfKeys % 3 === 0) {
            //   console.log("here2 typing true")
            // }

            // keyPressTimer = setTimeout(function() {
            //   console.log("here2 typing false")
            // }, 1200);
        },
        blur: function() {
            // $('#btn-chat-message').click();
            // console.log("here3 typing false")
        },
        emojibtn_click: function (button, event) {
          // console.log('event:emojibtn.click, emoji=' + button.children().data("name"));
          that.handleChangeMessage();
          // console.log(button);
          // console.log(event);
        }
      }
    });
  }

  sendMessage(e) {
    e.preventDefault();
    // var cur_socket = getSocket();
    // console.log(cur_socket) // socket id
    const {admin_setting} = this.props;
    const text = this.state.message_text.trim();
    const message_type = this.state.message_text_type ? "bold" : "";
    if (!text || !text.replace(/ /g, '').length) return;
    let now = new Date().getTime();
    if(text.length > admin_setting.max_message_size) {
      // cant send messsage : max_message_size
      this.props.alert.show(this.props.t("ChatApp.error_max_message_size", {count: admin_setting.max_message_size}));
      return;
    }

    if((now - this.message_sending_time) < admin_setting.message_time_interval) {
      // cant send messsage : message_time_interval
      this.props.alert.show(this.props.t("ChatApp.error_message_time_interval", {count: admin_setting.message_time_interval}));
      return;
    }

    // console.log("curren text time :", this.message_sending_time)
    // console.log("curren text length :", text.length)
    // console.log("curren text :", text)
    $('.emojionearea-editor').html('');
    this.message_sending_time = now;
    const {current_room_type, current_room_available, current_room_name, user_color, is_available} = this.props;
    if (text) {
      if(current_room_type == "private") {
        if(is_available) { // target user is available
          var that = this;
          socketEmit.clientPrivateMessage(text, current_room_name, user_color, "private", message_type, (err) => {
            if(err) {
              that.props.onActionUserInputMessage("newPrivateMessage", {text, message_type});
            }
          });
        }else if(current_room_available){
          // end room loggedOutAPrivateUser
          this.props.onActionUserInputMessage("loggedOutAPrivateUser", {});
        }
        
      }else {
        socketEmit.clientMessage(text, current_room_name, user_color, current_room_type, message_type, (err) => {
          // console.log("sent message ",err);
        });
      }
      
      this.setState({message_text: ''});
    }
  }

  onSelectColor(sel_color){
      this.props.onActionUserInputMessage("change_color", {sel_color});
  }

  handleChangeMessage(e) {
    var text = $("#txt-chat-message")[0].emojioneArea.getText(); // test
    // console.log(e.target.value)
    // var text = e.target.value;
    this.setState({ message_text: text })
  }

  openColorArea(){
    this.setState({ color_panel: !this.state.color_panel });
  }

  onClickTextBold() {
    this.setState({message_text_type: !this.state.message_text_type});
  }

  handleChangeFile = (file) => {
    const data = new FormData();
    // const inputfile = document.getElementById('inputfile');

    data.append('file_icon', file[0]);
    // data.append('file_icon', inputfile.files[0]);

    axios.post('/api/file_upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      if(response.data.code == 300){
        console.log(response.data.message)
        this.props.alert.show(this.props.t("ChatApp.error_file_upload2"));
      }else{
        // send img message
        var photo_url = response.data.data.photo_url;
        // console.log({photo_url})
        $('.emojionearea-editor').html('');
        this.message_sending_time = new Date().getTime();
        const {current_room_type, current_room_available, current_room_name, user_color, is_available} = this.props;
        var text = Config.CHAT_SERVER_URL + photo_url;
        
        if (text) {
          if(current_room_type == "private") {
            if(is_available) { // target user is available
              var that = this;
              socketEmit.clientPrivateMessage(text, current_room_name, user_color, "private", "image", (err) => {
                if(err) {
                  that.props.onActionUserInputMessage("newPrivateMessage", {text, message_type: "image"});
                }
              });
            }else if(current_room_available){
              // end room loggedOutAPrivateUser
              this.props.onActionUserInputMessage("loggedOutAPrivateUser", {});
            }
            
          }else{
            socketEmit.clientMessage(text, current_room_name, user_color, current_room_type, "image", (err) => {
              // console.log(err);
            });
          }
          
          this.setState({message_text: ''});
        }
      }
    })
    .catch(() => {
      this.props.alert.show(this.props.t("ChatApp.error_file_upload1"));
    });
  }

  
  render() {
    const {message_text_type} = this.state
    const {user_color, user_type} = this.props
    
    return (
      <div className="user-input-message">
          {user_type != "guest" && <div className="file-upload-area" onClick={this.onClickFileUpload}>
            <input id="upload_file" type="file" onChange={ (e) => this.handleChangeFile(e.target.files) } />
            <label htmlFor="upload_file" ><IconUpload className="icon" size="24px" /></label>
            {/* <IconUpload htmlFor="upload_file" className="icon" size="24px" /> */}
          </div>}
          <div className="bold-area" onClick={this.onClickTextBold}>
            <div className={`text-bold ${message_text_type ? 'active' : ''}`}>B</div>
          </div>
          <div className="color-area" onClick={this.openColorArea}>
            <div className={`user-color ${user_color}`}>&nbsp;</div>
              {this.state.color_panel && <div className="color-panel">
                  {color_panels.map((color, key) => {
                  return (
                      <div className={`color-snap ${ user_color == color.name ? color.name + ' active' : color.name}`} key={key} onClick={() => this.onSelectColor(color.name)}>
                      </div>
                      );
                  })}
              </div>}
          </div>
          <form onSubmit={e => this.sendMessage(e)} style={{position: "relative"}} className={`${message_text_type ? 'message-bold' : ''}`}>
              <input type="text" id="txt-chat-message" name="text" placeholder={this.props.t('ChatApp.message_placeholder')} spellCheck="false" ref='emojioneArea' value={this.state.message_text} onChange={e=>this.handleChangeMessage(e)} autoFocus autoComplete="off" />
              <button type="submit" id="btn-chat-message">
                  <Send className="send-icon" size="24px" />
              </button>
          </form>
      </div>
    );
  }
}

UserInputMessage.propTypes = {
    user_type: PropTypes.string.isRequired,
    user_color: PropTypes.string.isRequired,
    current_room_type: PropTypes.string.isRequired,
    current_room_available: PropTypes.bool.isRequired,
    current_room_name: PropTypes.string.isRequired,
    is_available: PropTypes.bool,
    admin_setting: PropTypes.object,
    onActionUserInputMessage: PropTypes.func.isRequired
};
  
  export default withTranslation()(withAlert()(UserInputMessage));