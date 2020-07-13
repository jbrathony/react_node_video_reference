import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { socketEmit } from '../../helpers/socketEvents';
import {  Collapse,  Navbar,  NavbarToggler,  NavbarBrand,  Nav,  NavItem,  NavLink,
  UncontrolledDropdown,  DropdownToggle,  DropdownMenu,  DropdownItem,
  Container, Row, Col, Card, CardImg, CardText, CardBody, CardLink,
  CardTitle, CardSubtitle, Spinner, Button, Label  } from 'reactstrap';
import '!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css';
import { withAlert } from "react-alert";
import jwt from 'jwt-simple';
import IconProfile from 'react-icons/lib/md/person';
import IconMessage from 'react-icons/lib/ti/messages';
import IconCalendar from 'react-icons/lib/ti/calender';
import IconBookmark from 'react-icons/lib/io/bookmark';
import IconSetting from 'react-icons/lib/fa/cog';
import Config from '../config/config';


const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};

class MyProfilePage extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      user: null,
      room: null,
    };

    this.onClickSettingRoom = this.onClickSettingRoom.bind(this);
    this.showRoom = this.showRoom.bind(this);

  }

  onClickSettingRoom() {
    let url = "/room/"+this.state.room.id;
    window.open(url,'_blank');
  }

  componentDidMount() {
    this.isMount = true;
    // socketEmit.getUser(this.props.match.params.username, (err) => {
    //   this.setState({ error: err });
    // });
    
    var token = localStorage.getItem("token");
    if(token) {
      var user = jwt.decode(token, 'webRTCVideoConference');
      console.log("user : ", user);
      if(user.type != "guest" && this.isMount) {
        var url = '/api/myProfile';
        axios.post( url, { username: user.name })
          .then((response) => {
            if(response.data.code == 300){
              this.setState({ error: response.data.message });
            }else{
              if(response.data.data.rooms.length > 0) {
                var room = response.data.data.rooms[0];
              }else {
                var room = {};
              }
              this.setState({ user: response.data.data.user, room: room });  
            }
          })
          .catch((err) => {
            this.setState({ error: 'Somgthing error' });
          });
      }else {
        let message = "Member type is guest. You don't have a profile.";
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
  componentWillUnmount() {
    this.isMount = false;
  } 

  showRoom() {
    
    if(!this.state.room) {
      return <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" />
    }else {
      if(this.state.room.name === undefined) {
        return <div>There is not room</div>
      }else{
        return (<div>
          <Row>
            <Col xs="8">
              <strong>{this.state.room.name}</strong>
            </Col>
            <Col xs="4" className="text-left">
              <Button outline size="sm" className="full-width" onClick={this.onClickSettingRoom}>
                <IconSetting className="icon" size="24px" style={{verticalAlign:"top"}} />&nbsp;Setting
              </Button>
            </Col>
          </Row>  
          </div>
        )
      }
    }
  }

  render() {
    console.log(this.state)
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
          <Container className="md-t-20">
            <Row>
              <Col md="3" sm="12" xs="12">
                <Card>
                  <CardBody className="text-center">
                    {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : 
                    <img className="rounded-circle" width="100px" src={this.state.user.thumb === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.state.user.thumb } alt="Card image cap" /> }
                    <CardTitle className="md-t-10">
                      {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.user.username }
                    </CardTitle>
                  </CardBody>
                </Card>
                <Card className="md-t-20">
                  <CardBody className="text-right">
                    <CardTitle className="md-t-10"><strong>About</strong></CardTitle>
                    <Row>
                      <Col xs="12">
                        <IconProfile className="icon" size="24px" />
                        {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.user.gender }
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
              <Col md="6" sm="12" xs="12">
                <Card>
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}>
                    <h3>{!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.user.username }</h3>
                  </CardTitle>
                  <CardBody className="text-right">
                    <Row>
                      <Col xs="12">
                        <IconBookmark className="icon" size="24px" />&nbsp; <strong>Badges</strong>
                      </Col>
                      <Col xs="12">
                        {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : <img className="rounded-circle" width="25px" src='/img/avatars/member.png' alt="user-type" /> }

                      </Col>
                    </Row>
                    <Row>
                      <Col xs="12">
                        <IconCalendar className="icon" size="24px" />&nbsp; <strong>Joined</strong> 
                      </Col>
                      <Col xs="12">
                        {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : this.state.user.registerDate }
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
                <Card className="md-t-20">
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}><strong>Room</strong></CardTitle>
                  <CardBody className="text-right">
                    {this.showRoom()}
                  </CardBody>
                </Card>
              </Col>
              <Col md="3" sm="12" xs="12">
                <Card>
                  <CardBody className="text-left">
                    <Row className="hidden">
                      <Col xs="12">
                        <Button outline className="color1 full-width"><IconMessage className="icon" size="18px" style={{verticalAlign:"top"}} />setting</Button>
                      </Col>
                    </Row>
                    <CardTitle className="md-t-10">&copy;2019 Trand Chat Ltd </CardTitle>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
        
      </div>
      
    );
  }
}

export default withAlert()(MyProfilePage);