import React from 'react';
import PropTypes from 'prop-types';
import { createSocket, socketEmit } from '../helpers/socketEvents';
import jwt from 'jwt-simple';
import { ClipLoader } from 'react-spinners';
import { withAlert } from "react-alert";
import { withTranslation } from 'react-i18next';
import Config from './config/config';

var secret = 'webRTCVideoConference';

const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};



class LoginPage extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      login_type: null,
      gender: "male"
    };

    this.loginGuestUser = this.loginGuestUser.bind(this);
    this.loginUser = this.loginUser.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    // this.selectLoginType = this.selectLoginType.bind(this);
  }

  componentDidMount() {
    this.isMount = true;
  }
  componentWillUnmount() {
    this.isMount = false;
  } 

  loginGuestUser(e) {
    e.preventDefault();
    const userName = e.target.elements.userName.value.trim();
    if (!userName) {
      return this.setState({ error: this.props.t('LoginPage.error_username') });
    }

    var that = this;
    let gender = this.state.gender;
    var param = {
      userName,
      password: "",
      gender: gender,
      roomIds: [parseInt(this.props.roomId)],
      type: 'general',
      user_type: 'guest',
      version: Config.VERSION
    }
    // createSocket(param);
    this.props.onActionLogin("create_socket", param);
    socketEmit.joinGuestUser(userName, gender, this.props.roomId, Config.VERSION, (err) => {
      if(that.isMount) {
        var error = "";
        if(err == "Please use new version") {
          error = this.props.t('LoginPage.error_version', {version: Config.VERSION})
        }else if(err == "Please select room") {
          error = this.props.t('LoginPage.error_missing_room')
        }else if(err == "You banned by admin") {
          error = this.props.t('LoginPage.error_ban')
        }else {
          error = err
        }
        if(error != "")
          this.setState({ error });
      }
    });
    e.target.elements.userName.value = '';
  }

  loginUser(e) {
    e.preventDefault();

    const userName = e.target.elements.userName.value.trim();
    const password = e.target.elements.password.value.trim();
    if (!userName) {
      return this.setState({ error: this.props.t('LoginPage.error_username') });
    }
    if (!password) {
      return this.setState({ error: this.props.t('LoginPage.error_password') });
    }

    var temp_token = jwt.encode({userName, password}, secret);
    localStorage.setItem('temp_token', temp_token);
    var param = {
      userName,
      password,
      gender: "male",
      roomIds: [parseInt(this.props.roomId)],
      type: 'general',
      user_type: 'member',
      version: Config.VERSION
    }
    // createSocket(param);
    this.props.onActionLogin("create_socket", param);
    socketEmit.joinUser(userName, password, 'general', this.props.roomId, Config.VERSION, (err) => {
      console.log(err);
      if(this.isMount)
        var error = "";
        if(err == "Please use new version") {
          error = this.props.t('LoginPage.error_version', {version: Config.VERSION})
        }else if(err == "Please select room") {
          error = this.props.t('LoginPage.error_missing_room')
        }else if(err == "You banned by admin") {
          error = this.props.t('LoginPage.error_ban')
        }else {
          error = err
        }
        if(error != "") {
          this.setState({ error });
          // localStorage.removeItem('temp_token');
        }
    });
  }

  selectLoginType(option){
    this.setState({ login_type: option, error: '' });
  }

  handleOptionChange(e) {
    this.setState({
      gender: e.target.value
    });
  }

  render() {
    const {roomId, serverAutoLogin, sUser, sPass} = this.props;
    if(serverAutoLogin && !this.state.error) {
      if(!this.state.error) {
        var param = {
          userName: sUser,
          password: sPass,
          gender: "male",
          roomIds: [parseInt(this.props.roomId)],
          type: 'server_auto_login',
          user_type: 'member',
          version: Config.VERSION
        }
        // createSocket(param);
        this.props.onActionLogin("create_socket", param);
        socketEmit.joinUser(sUser, sPass, 'server_auto_login', roomId, Config.VERSION, (err) => {
          if(this.isMount) {
            var error = "";
            if(err == "Please use new version") {
              error = this.props.t('LoginPage.error_version', {version: Config.VERSION})
            }else if(err == "Please select room") {
              error = this.props.t('LoginPage.error_missing_room')
            }else if(err == "You banned by admin") {
              error = this.props.t('LoginPage.error_ban')
            }else {
              error = err
            }
            if(error != "")
              this.setState({ error });
          }
        });
        return (
          <div className="login-page">
            <div className="login-modal pd-tb-10">
              <ClipLoader
                css={override}
                sizeUnit={"px"}
                size={35}
                color={'#6c65ace0'}
                loading={this.state.loading}
              />
            </div>
          </div>
        );
      }
      
    }else {
      if(!this.state.error && this.props.autoLogin) {
        // auto login
  
        if(this.props.lastUser) {
          var lastUser = this.props.lastUser;
          if(lastUser.type == "guest"){
            var param = {
              userName: lastUser.name,
              password : "",
              gender: lastUser.gender,
              roomIds: [parseInt(this.props.roomId)],
              type: 'general',
              user_type: 'guest',
              version: Config.VERSION
            }
            // createSocket(param);
            this.props.onActionLogin("create_socket", param);
            socketEmit.joinGuestUser(lastUser.name, lastUser.gender, this.props.roomId, Config.VERSION, (err) => {
              if(this.isMount) {
                var error = "";
                if(err == "Please use new version") {
                  error = this.props.t('LoginPage.error_version', {version: Config.VERSION})
                }else if(err == "Please select room") {
                  error = this.props.t('LoginPage.error_missing_room')
                }else if(err == "You banned by admin") {
                  error = this.props.t('LoginPage.error_ban')
                }else {
                  error = err
                }
                if(error != ""){
                  this.setState({ error });
                }
              }
            });
          }else {
            var temp_token = localStorage.getItem("temp_token")
            if(!temp_token) {
              localStorage.removeItem('temp_token');
              this.setState({ error : "Your token was broken, please login again" });
            }else{
              var new_pass = jwt.decode(temp_token, secret);
              var param = {
                userName: lastUser.name,
                password: new_pass.password,
                gender: lastUser.gender,
                roomIds: [parseInt(this.props.roomId)],
                type: 'general',
                user_type: 'member',
                version: Config.VERSION
              }
              // createSocket(param);
              this.props.onActionLogin("create_socket", param);
              socketEmit.joinUser(lastUser.name, new_pass.password, 'general', this.props.roomId, Config.VERSION, (err) => {
                if(this.isMount) {
                  var error = "";
                  if(err == "Please use new version") {
                    error = this.props.t('LoginPage.error_version', {version: Config.VERSION})
                  }else if(err == "Please select room") {
                    error = this.props.t('LoginPage.error_missing_room')
                  }else if(err == "You banned by admin") {
                    error = this.props.t('LoginPage.error_ban')
                  }else {
                    error = err
                  }
                  if(error != "")
                    this.setState({ error });
                }
              });
            }
            
          } 
          
          return (
            <div className="login-page">
              <div className="login-modal pd-tb-10">
                <ClipLoader
                  css={override}
                  sizeUnit={"px"}
                  size={35}
                  color={'#6c65ace0'}
                  loading={this.state.loading}
                />
              </div>
            </div>
          );
        }else {
          let message = this.props.t('LoginPage.session_expired');
          this.props.alert.show(message);
          return (
            <div className="login-page">
              <div className="login-modal">
                <form onSubmit={this.loginUser}>
                  <h3>{this.props.t('LoginPage.user_login')}</h3>
                  <p className="error">{this.state.error != "success" && this.state.error}</p>
                  <p>{this.props.t('LoginPage.username')}</p>
                  <input type="text" name="userName" maxLength="20" autoFocus autoComplete="off" />
                  <p>{this.props.t('LoginPage.password')}</p>
                  <input type="password" name="password" maxLength="20" autoComplete="off" />
                  <button type="button" onClick={() => this.selectLoginType(null)} className="button-text mr-10">{this.props.t('LoginPage.back')}</button>
                  <button type="submit" className="button-text">{this.props.t('LoginPage.login')}</button>
                </form>
              </div>
            </div>
          );
        }
      }else {
        const login_type = this.state.login_type;
      
        if(login_type == 'login'){
          return (
            <div className="login-page">
              <div className="login-modal">
                <form onSubmit={this.loginUser}>
                  <h3>{this.props.t('LoginPage.user_login')}</h3>
                  <p className="error">{this.state.error != "success" && this.state.error}</p>
                  <p>{this.props.t('LoginPage.username')}</p>
                  <input type="text" name="userName" maxLength="20" autoFocus autoComplete="off" />
                  <p>{this.props.t('LoginPage.password')}</p>
                  <input type="password" name="password" maxLength="20" autoComplete="off" />
                  <button type="button" onClick={() => this.selectLoginType(null)} className="button-text mr-10">{this.props.t('LoginPage.back')}</button>
                  <button type="submit" className="button-text">{this.props.t('LoginPage.login')}</button>
                </form>
              </div>
            </div>
          );
        }else if(login_type == 'guest'){
          return (
            <div className="login-page">
              <div className="login-modal">
                <form onSubmit={this.loginGuestUser}>
                  <h3>{this.props.t('LoginPage.guest_join_chat')}</h3>
                  <p className="error">{this.state.error != "success" && this.state.error}</p>
                  <p>{this.props.t('LoginPage.guest')}</p>
                  <input type="text" name="userName" maxLength="20" autoFocus autoComplete="off" />
                  <div style={{width:"50%", float: "left"}}>
                  <label style={{cursor: "pointer"}}><input type="radio" id="male" name="gender" value="male" checked={this.state.gender === "male"} style={{width: "20px", cursor: "pointer"}} onChange={this.handleOptionChange} />
                    &nbsp;{this.props.t('LoginPage.male')}</label>
                  </div>
                  <div style={{width:"50%", float: "left"}}>
                  <label style={{cursor: "pointer"}} ><input type="radio" id="female" name="gender" value="female" checked={this.state.gender === "female"} style={{width: "20px", cursor: "pointer"}} onChange={this.handleOptionChange} />
                    &nbsp;{this.props.t('LoginPage.female')}</label>
                  </div>
                  <button type="button" onClick={() => this.selectLoginType(null)} className="button-text mr-10">{this.props.t('LoginPage.back')}</button>
                  <button type="submit" className="button-text">{this.props.t('LoginPage.join')}</button>
                </form>
              </div>
            </div>
          );
        }else{
          return (
            <div className="login-page">
              <div className="login-modal pd-tb-10">
                <form>
                  <p className="error">{this.state.error != "success" && this.state.error}</p>
                  <div><button onClick={() => this.selectLoginType('login')} className="button-text w-150">{this.props.t('LoginPage.login')}</button></div>
                  <div><button onClick={() => this.selectLoginType('guest')} className="button-text w-150">{this.props.t('LoginPage.guest')}</button></div>
                </form>
              </div>
            </div>
          );
        }
      } // no auto login
    }
    
  }
}

LoginPage.propTypes = {
  autoLogin: PropTypes.bool,
  roomId: PropTypes.string,
  lastUser: PropTypes.object,
  serverAutoLogin: PropTypes.bool,
  sUser: PropTypes.string,
  sPass: PropTypes.string,
  onActionLogin: PropTypes.func
};

export default withTranslation()(withAlert()(LoginPage));
