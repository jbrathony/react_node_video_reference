import React from 'react';
import { socketEmit, socketOn } from '../helpers/socketEvents';
import '!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css';
import {  Collapse,  Navbar,  NavbarToggler,  NavbarBrand,  Nav,  NavItem,  NavLink,
  FormGroup, Input,
  Container, Row, Col, Card, CardImg, CardText, CardBody, CardLink,
  CardTitle, CardSubtitle, Spinner, Button, Label  } from 'reactstrap';
  import { withTranslation } from 'react-i18next';

import IconUsers from 'react-icons/lib/md/people';
import axios from 'axios';

const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};

class LandingPage extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      show_empty_room: false,
      users: [],
      rooms: [],
    };

    this.handleCheckBox = this.handleCheckBox.bind(this);
    this.gotoChatRoom = this.gotoChatRoom.bind(this);

  }

  componentDidMount() {
    socketEmit.getPublicRooms( (response) => {
      this.setState({users: response.users, rooms: response.rooms});
    });
    // axios.get('/api/get_rooms', {
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //   },
    // })
    //   .then((response) => {
    //     console.log("rooms : ", response.data.data.rooms)
    //     this.setState({rooms: response.data.data.rooms})
    //   })
    //   .catch((error) => {
    //     this.setState({ error});
    //   });
  }

  handleCheckBox(e) {
    this.setState({
      show_empty_room: !this.state.show_empty_room
    });
  }

  gotoChatRoom(room_id) { 
    var serverAutoLogin = false;
    var sUser = "";
    var sPass = "";
    var route_param = this.props.match.params;
    var add_params = "";
    if(route_param.username !== undefined) {
      sUser = route_param.username
    }
    if(route_param.password !== undefined) {
      sPass = route_param.password
    }
    if(sUser != "" && sPass != "") {
      serverAutoLogin = true;
      add_params = "/server_auto_login/" + sUser + "/" + sPass;
    }
    let url = "/chat/" + room_id + add_params;
    window.open(url,'_self');
  }

  render() {
    return (
      <div className="landing-page">
        <div className="full-row color1">
          <Container>
            <Navbar light expand="md">
              <NavbarBrand href="/"><img src={'/img/logo_chat_trand_small_6.png'} alt="logo" /></NavbarBrand>
            </Navbar>
          </Container>
        </div>
        <div className="full-row">
          <Container className="md-t-20">
            <Row className="">
              <Col xs="12" className="text-right">
                  <label style={{cursor: "pointer"}}><input type="checkbox" id="show_empty_room" checked={this.state.show_empty_room} style={{width: "20px", cursor: "pointer"}} onChange={this.handleCheckBox} />
                    &nbsp;{this.props.t('LandingPage.show_empty_room')}</label>
              </Col>
            </Row>
            <Row>
              { this.state.rooms.length > 0 && this.state.rooms.map((room, key) => {
                
                  if(room.type != "private") {
                     if(this.state.show_empty_room || room.users.length != 0) {
                       {/* if(room.users.length == 0) {
                         return null;
                       } */}
                      return (
                        <Col md="3" sm="6" xs="12" key={key} className="md-t-20">
                          <Card body className="text-right" style={{padding: '0.85rem'}}>
                            <CardImg className="room-cover" top width="100%" src={room.cover_photo === '' ? '/img/public_chat.png' : '/img/rooms/'+room.cover_photo} alt="Card image cap" />
                            <CardBody style={{padding: '0.15rem'}}>
                              <CardTitle className="room-title"><strong>{room.name}</strong></CardTitle>
                              <CardSubtitle></CardSubtitle>
                              <div className="room-descr">{room.description.length > 22 ? room.description.substring(0,22) + ' ...' : room.description}</div>
                              <CardText>
                                <label><strong>אדמין : </strong></label>
                                <label>{room.owner}</label>
                              </CardText>
                              <div className="d-flex f-direction-r" style={{alignItems: 'center',justifyContent: 'center'}}>
                                <Button  onClick={() =>this.gotoChatRoom(room.id)} style={{marginLeft: '10px'}}>התחברות לחדר</Button>
                                <CardText>
                                  <small className="text-muted">
                                    <IconUsers className={`icon icon-comment`} size="20px" />
                                    {room.users.length}
                                  </small>
                                </CardText>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                        )
                     }
                  }else {
                    return null;
                  }
              }) }
            </Row>
          </Container>
        </div>
        
      </div>
      
    );
  }
}


export default withTranslation()(LandingPage);
