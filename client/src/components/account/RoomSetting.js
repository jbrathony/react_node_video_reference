import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { socketEmit } from '../../helpers/socketEvents';
import {  Collapse,  Navbar,  NavbarToggler,  NavbarBrand,  Nav,  NavItem,  NavLink,
  UncontrolledDropdown,  DropdownToggle,  DropdownMenu,  DropdownItem,
  Container, Row, Col, Card, CardImg, CardText, CardBody, CardLink,
  CardTitle, CardSubtitle, Spinner, Button, Label,
  Form, FormGroup, Input, FormText, Table  } from 'reactstrap';
import '!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css';
import { withAlert } from "react-alert";
import jwt from 'jwt-simple';
import IconProfile from 'react-icons/lib/md/person';
import IconAdd from 'react-icons/lib/fa/plus-circle';
import IconDelete from 'react-icons/lib/fa/trash-o';
import Config from '../config/config';

const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};

class RoomSetting extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      user: null,
      room: null,
      managers: [],
      banned_users: [],
      blocks: [],
      moderator: "",
      ban_user: "",
      is_permission: false,
    };

    this.onClickSettingRoom = this.onClickSettingRoom.bind(this);
    this.handleChangeCategory = this.handleChangeCategory.bind(this);
    this.handleChangeMaxUsers = this.handleChangeMaxUsers.bind(this);
    this.handleChangeWelcomMessage = this.handleChangeWelcomMessage.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleChangePassword = this.handleChangePassword.bind(this);
    this.handleChangeModerator = this.handleChangeModerator.bind(this);
    this.handleChangeBanUser = this.handleChangeBanUser.bind(this);
    this.removeModerator = this.removeModerator.bind(this);
    this.addModerator = this.addModerator.bind(this);
    this.removeBanUser = this.removeBanUser.bind(this);
    this.addBanUser = this.addBanUser.bind(this);
    this.updateRoom = this.updateRoom.bind(this);
    this.getRoomInfo = this.getRoomInfo.bind(this);

  }

  onClickSettingRoom() {
    let url = "/room/"+this.state.room.name + "/setting";
    window.open(url,'_blank');
  }
  
  handleChangeCategory(event) {
    let room = this.state.room;
    room.category = event.target.value;
    this.setState({room});
  }

  handleChangeMaxUsers(event) {
    let room = this.state.room;
    room.max_users = event.target.value;
    this.setState({room});
  }

  handleChangeDescription(event) {
    let room = this.state.room;
    room.description = event.target.value;
    this.setState({room});
  }

  handleChangePassword(event) {
    let room = this.state.room;
    room.password = event.target.value;
    this.setState({room});
  }

  handleChangeWelcomMessage(event) {
    let room = this.state.room;
    room.welcome_message = event.target.value;
    this.setState({room});
  }

  handleChangeModerator(event) {
    this.setState({moderator: event.target.value});
  }

  handleChangeBanUser(event) {
    this.setState({ban_user: event.target.value});
  }

  removeModerator(name) {
    let managers = this.state.managers;
    if(managers.find( (moderator) => moderator == name)) {
      managers = managers.filter((moderator) => moderator !== name);
    }
    this.setState({managers});
  }

  addModerator() {
    let managers = this.state.managers;
    if(this.state.moderator === "") {
      let message = "Please input moderator name";
      this.props.alert.show(message);
    }else if(this.state.moderator == this.state.user.name) {
      let message = "Please input another username";
      this.props.alert.show(message);
    }else{
      if(!managers.find( (moderator) => moderator == this.state.moderator)) {
        managers.push(this.state.moderator);
        this.setState({moderator: ''});
      }
      this.setState({managers});
    }
    
  }

  removeBanUser(ip) {
    let banned_users = this.state.banned_users;
    if(banned_users.find( (ban_user) => ban_user.ip == ip)) {
      banned_users = banned_users.filter(ban_user => ban_user.ip != ip);
    }
    this.setState({banned_users});
  }

  addBanUser() {
    let banned_users = this.state.banned_users;
    if(!banned_users.find( (ban_user) => ban_user === this.state.ban_user)) {
      banned_users = push(this.state.ban_user);
      this.setState({ban_user: ''});
    }
    this.setState({banned_users});
  }


  componentDidMount() {
    this.isMount = true;
    // socketEmit.getUser(this.props.match.params.username, (err) => {
    //   this.setState({ error: err });
    // });
    this.getRoomInfo("general");
  }

  componentWillUnmount() {
    this.isMount = false;
  } 

  getRoomInfo(type) {
    var token = localStorage.getItem("token");
    if(token) {
      var user = jwt.decode(token, 'webRTCVideoConference');
      this.setState({user});
      if(this.isMount) {
        var url = "/api/room_setting";
        axios.post( url, { username: user.name, roomId: this.props.match.params.roomId })
          .then((response) => {
            if(response.data.code == 300) {
              this.setState({ error: response.data.message });
            }else{

              console.log("response : ",response.data.data.rooms[0])
              var room = response.data.data.rooms[0];
              var managers = [];
              if(room.managers) {
                managers = JSON.parse(room.managers)
              }
              var banned_users = [];
              if(room.banned_users) {
                console.log("banned_users : ", room.banned_users);
                banned_users = JSON.parse(room.banned_users)
              }
              var blocks = [];
              if(room.blocks) {
                console.log("blocks : ", room.blocks);
                blocks = JSON.parse(room.blocks)
              }

              if(type == "updated") {
                // send update room info
                socketEmit.updateRoomByOwner(room, (err) => {
                  console.log(err);
                });
              }
              
              let is_permission = false;
              if(room.owner == user.name || managers.includes(user.name) ) {
                is_permission = true;
              }
              
              this.setState({ is_permission, room, managers, banned_users, blocks });  
            }
          })
          .catch((err) => {
            this.setState({ error: 'Somgthing error' });
          });
      }else {
        let message = "Member type is guest. You can't access this page.";
        this.props.alert.show(message);
        setTimeout( () => {
          let url = "/";
          window.open(url,'_blank');
        }, 2000);
      }
      
    } else {
      let message = "There is no user. Please login";
      this.props.alert.show(message);
      setTimeout( () => {
        let url = "/";
        window.open(url,'_blank');
      }, 2000);
    }
  }
  updateRoom(e) {
    e.preventDefault();
    const data = new FormData();

    // general
    let moderators = JSON.stringify(this.state.managers);
    let banned_users = JSON.stringify(this.state.banned_users);
    
    // media
    const file_icon = document.getElementById('icon');
    const file_cover_photo = document.getElementById('cover_photo');

    data.append('room_id', this.state.room.id);
    data.append('category', this.state.room.category);
    data.append('description', this.state.room.description ? this.state.room.description : '');
    data.append('welcome_message', this.state.room.welcome_message ? this.state.room.welcome_message : '');
    data.append('max_users', this.state.room.max_users);
    data.append('password', this.state.room.password);
    data.append('managers', moderators);
    data.append('banned_users', banned_users);

    data.append('file_icon', file_icon.files[0]);
    data.append('file_cover_photo', file_cover_photo.files[0]);

    axios.post('/api/update_room', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => {
        if(response.data.code == 300){
          this.setState({ error: response.data.message });
        }else{
          this.getRoomInfo("updated");
        }
      })
      .catch(() => {
        this.setState({ error: 'Somgthing error' });
      });
  }

  render() {
    return (
      <div className="ProfilePaage">
        <div className="full-row color1">
          <Container>
            <Navbar light expand="md">
              <NavbarBrand href="/"><img src={'/img/logo_chat_trand_small_6.png'} alt="logo" /></NavbarBrand>
            </Navbar>
          </Container>
        </div>
        {this.state.error && <div className="full-row">
          <Container className="md-t-20">
            <Row>
              <Label className="font-color6">{this.state.error}</Label>
            </Row>
          </Container>
        </div>}
        <div className="full-row">
          <Container className="md-t-20 md-b-20">
            <Form onSubmit={this.updateRoom}>
            <Row>
              <Col xs="3">
                <Card>
                  <CardBody className="text-center">
                  {!this.state.room ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : 
                    <img className="rounded-circle" width="100px" src={this.state.room.thumb === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.state.room.thumb } alt="Card image cap" /> }
                    <CardTitle className="md-t-10">
                      {!this.state.room ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.room.owner }
                    </CardTitle>
                  </CardBody>
                </Card>
                {/* <Card className="md-t-20">
                  <CardBody className="text-right">
                    <CardTitle className="md-t-10"><strong>About</strong></CardTitle>
                    <Row>
                      <Col xs="12">
                        <IconProfile className="icon" size="24px" />
                        {!this.state.room.owner ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.user.gender }
                      </Col>
                    </Row>
                  </CardBody>
                </Card> */}
              </Col>
              <Col xs="9">
                <Row className="">
                  <Col xs="12" className="text-right"><h3>Room - {!this.state.room ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.room.name }</h3></Col>
                </Row>
                <Card>
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}>
                    <strong>General</strong>
                  </CardTitle>
                  <CardBody className="text-right">
                    <Row>
                      <Col xs="12">
                        {!this.state.room ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> :
                        <div>
                          <FormGroup>
                            <Label for="category">Category</Label>
                            {this.state.is_permission && this.state.room.owner == this.state.user.name ? <Input type="select" name="category" value={this.state.room.category} id="category" onChange={this.handleChangeCategory}>
                              <option value="Comedy">Comedy</option>
                              <option value="Entertainment">Entertainment</option>
                              <option value="Gaming">Gaming</option>
                              <option value="Social">Social</option>
                              <option value="Technology">Technology</option>
                              <option value="Teen">Teen</option>
                              <option value="Other">Other</option>
                            </Input> : <FormText color="muted">
                            {this.state.room.category}
                            </FormText>}
                          </FormGroup>
                          <FormGroup>
                            <Label for="description">Description</Label>
                            {this.state.is_permission && this.state.room.owner == this.state.user.name ? 
                              <Input type="text" name="description" value={this.state.room.description} id="description" placeholder="description"  onChange={this.handleChangeDescription} /> :
                              <FormText color="muted">{this.state.room.description}</FormText>
                            }
                          </FormGroup>
                          <FormGroup>
                            <Label for="welcome_message">Welcome Message</Label>
                            {this.state.is_permission && this.state.room.owner == this.state.user.name ? 
                              <Input type="textarea" name="welcome_message" id="welcome_message" value={this.state.room.welcome_message}  onChange={this.handleChangeWelcomMessage} /> :
                              <FormText color="muted">{this.state.room.welcome_message}</FormText>
                            }
                          </FormGroup>
                          <FormGroup>
                            <Label for="max_users">Max users</Label>
                            {this.state.is_permission && this.state.room.owner == this.state.user.name ? 
                            <Input type="select" name="max_users" value={this.state.room.max_users} id="max_users" onChange={this.handleChangeMaxUsers}>
                              <option value="9999">- Unlimited -</option>
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="15">15</option>
                              <option value="25">25</option>
                              <option value="50">50</option>
                              <option value="100">100</option>
                              <option value="200">200</option>
                            </Input> :
                            <FormText color="muted">{this.state.room.max_users}</FormText>
                            }
                          </FormGroup>
                          <FormGroup>
                            <Label for="password">Password</Label>
                            {this.state.is_permission && this.state.room.owner == this.state.user.name ? 
                              <Input type="text" name="password" value={this.state.room.password} id="password" placeholder="password"  onChange={this.handleChangePassword} /> :
                              <FormText color="muted">***</FormText>
                            }
                          </FormGroup>
                        </div>}
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
                {/**************************** media ****************************/}
                <Card className="md-t-20">
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}>
                    <strong>Media</strong>
                  </CardTitle>
                  <CardBody className="text-right">
                    <Row>
                      <Col xs="12">
                        {!this.state.room ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> :
                        <div>
                          <FormGroup>
                            {this.state.room.icon !== ''  && <img className="rounded-circle" width="100px" height="100px" src={'/img/rooms/'+this.state.room.icon} alt="Card image cap" />}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <Label className="full-width" for="icon">Upload a room icon</Label>}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <Input type="file" name="icon" id="icon" />}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <FormText color="muted">
                              This icon will display on your chat room page and chat sidebar. <b>160x160 is the recommended size for this image</b>.
                            </FormText>}
                          </FormGroup>
                          <FormGroup className="md-t-10">
                            {this.state.room.cover_photo !== ''  && <img className="rounded-circle" width="100px" height="100px" src={'/img/rooms/'+this.state.room.cover_photo} alt="Card image cap" />}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <Label className="full-width" for="cover_photo">Upload a cover photo</Label>}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <Input type="file" name="cover_photo" id="cover_photo" />}
                            {this.state.is_permission && this.state.room.owner == this.state.user.name && <FormText color="muted">
                            This image will show up at the top of your chat room page. <b>800x200 is the recommended size for this image</b>.
                            </FormText>}
                          </FormGroup>
                        </div>
                        }
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
                {/**************************** Moderators ****************************/}
                {this.state.is_permission && this.state.room.owner == this.state.user.name && <Card className="md-t-20">
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}>
                    <strong>Moderators</strong>
                  </CardTitle>
                  <CardBody className="text-right">
                    <Row>
                      <Col xs="12">
                        <FormGroup>
                          <Label for="moderator">Add Moderator</Label>
                          <Input type="text" name="moderator" value={this.state.moderator} id="moderator" placeholder="moderator"  onChange={this.handleChangeModerator} />
                        </FormGroup>
                      </Col>
                      <Col xs="12">
                        <FormGroup>
                          <Button className="color1" onClick={this.addModerator}><IconAdd className="icon" size="24px" style={{verticalAlign:"top"}} />&nbsp;Add</Button>
                        </FormGroup>
                      </Col>
                      {this.state.managers.length > 0 && <Col xs="12">
                          <div style={{border: "1px solid #dee2e6"}}>
                            <Table hover>
                              <thead>
                                <tr>
                                  <th>Username</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.managers.length > 0 && this.state.managers.map( (moderator, key) => (
                                  <tr key={key}>
                                    <td>{moderator}</td>
                                    <td><Button className="color1" size="sm" onClick={() => this.removeModerator(moderator)}><IconDelete className="icon" size="24px" style={{verticalAlign:"top"}} />&nbsp;Remove</Button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                      </Col>}
                      
                    </Row>
                  </CardBody>
                </Card>}
                {/**************************** Banned Users ****************************/}
                {this.state.is_permission && <Card className="md-t-20">
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}>
                    <strong>Banned Users</strong>
                  </CardTitle>
                  <CardBody className="text-right">
                    <Row>
                      {this.state.banned_users.length > 0 && <Col xs="12">
                          <div style={{border: "1px solid #dee2e6"}}>
                            <Table hover>
                              <thead>
                                <tr>
                                  <th>Username</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {this.state.banned_users.length > 0 && this.state.banned_users.map( (user, key) => (
                                  <tr key={key}>
                                    <td>{user.name}</td>
                                    <td><Button className="color1" size="sm" onClick={() => this.removeBanUser(user.ip)}><IconDelete className="icon" size="24px" style={{verticalAlign:"top"}} />&nbsp;Remove</Button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                      </Col>}
                      
                    </Row>
                  </CardBody>
                </Card>}
                
              </Col>
              {this.state.is_permission && <Col xs="12" className="md-t-20">
                <FormGroup>
                  <Button type="submit" className="color1" >Save Changes</Button>
                </FormGroup>
              </Col>}
            </Row>
            </Form>
          </Container>
        </div>
        
      </div>
      
    );
  }
}


RoomSetting.propTypes = {
  match: PropTypes.object.isRequired,
};

export default withAlert()(RoomSetting);