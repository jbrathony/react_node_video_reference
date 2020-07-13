import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { socketEmit } from '../../helpers/socketEvents';
import {  Collapse,  Navbar,  NavbarToggler,  NavbarBrand,  Nav,  NavItem,  NavLink,
  UncontrolledDropdown,  DropdownToggle,  DropdownMenu,  DropdownItem,
  Container, Row, Col, Card, CardImg, CardText, CardBody, CardLink,
  CardTitle, CardSubtitle, Spinner, Button, Label  } from 'reactstrap';
import '!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css';
import IconProfile from 'react-icons/lib/md/person';
import IconMessage from 'react-icons/lib/ti/messages';
import IconCalendar from 'react-icons/lib/ti/calender';
import IconBookmark from 'react-icons/lib/io/bookmark';
import Config from '../config/config';

const override = {
  display: 'block !important',
  marginTop: 15,
  marginRight: 'auto',
  marginBottom: 0,
  marginLeft: 'auto',
};

class ProfilePage extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      user: null,
    };

    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    this.isMount = true;
    // socketEmit.getUser(this.props.match.params.username, (err) => {
    //   this.setState({ error: err });
    // });
    
    var url = '/api/getUser';
    console.log("username :", this.props.match.params.username);
    axios.post( url, { username: this.props.match.params.username })
      .then((response) => {
        if(response.data.code == 300){
          this.setState({ error: response.data.message });
        }else{
          this.setState({ user: response.data.data });  
        }
      })
      .catch((err) => {
        this.setState({ error: 'Somgthing error' });
      });
   
  }
  componentWillUnmount() {
    this.isMount = false;
  } 

  toggle() {
    
  }

  render() {
    console.log(this.state.user)
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
              <Label className="font-color6 md-auto">{this.state.error}</Label>
            </Row>
          </Container>
        </div>}
        <div className="full-row">
          <Container className="md-t-20">
            <Row>
              <Col md="3" sm="6" xs="12">
                <Card>
                  <CardBody className="text-center">
                  {!this.state.user ? <Spinner style={{ width: '1rem', height: '1rem' }} color="secondary" /> : 
                    <img className="rounded-circle" width="100px" src={this.state.user.thumb === '' ? '/img/avatars/default_avatar.png' : Config.MAIN_SITE_URL + this.state.user.thumb } alt="Card image cap" /> }
                    <CardTitle className="md-t-10"><strong>{this.props.match.params.username}</strong></CardTitle>
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
              <Col md="6" sm="6" xs="12">
                <Card>
                  <CardTitle className="text-right" style={{ borderBottom: "1px solid #e3e3e3", padding: "10px 25px"}}><strong>{this.props.match.params.username}</strong></CardTitle>
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
              </Col>
              <Col md="3" sm="6" xs="12">
                <Card>
                  <CardBody className="text-left">
                    <Row className="hidden">
                      <Col xs="12">
                        <Button className="color1 full-width"><IconMessage className="icon" size="24px" style={{verticalAlign:"top"}} />&nbsp;ChatRooms</Button>
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


ProfilePage.propTypes = {
    match: PropTypes.object.isRequired,
};

export default ProfilePage;
