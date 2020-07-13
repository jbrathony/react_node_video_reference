import React from 'react';
import ReactDOM from 'react-dom';
import LandingPage from './components/LandingPage';
import ChatApp from './components/ChatApp';
import ProfilePage from './components/account/Profile';
import MyProfilePage from './components/account/MyProfile';
import RoomSetting from './components/account/RoomSetting';
// import IconClose from 'react-icons/lib/go/x';
import IconClose from 'react-icons/lib/md/close';
import IconInfo from 'react-icons/lib/fa/info-circle';
import IconSuccess from 'react-icons/lib/ti/thumbs-up';
import IconError from 'react-icons/lib/md/error-outline';
import { positions, Provider as AlertProvider } from "react-alert";
// import AlertTemplate from "react-alert-template-basic";
import { BrowserRouter as Router, Route, Link, Redirect } from "react-router-dom";

import './styles/index.scss';
import './styles/themes/violet.scss';
import './styles/themes/light.scss';
import './styles/themes/dark.scss';
import './styles/themes/pink.scss';
import './styles/themes/green.scss';

import './i18n';

  const options = {
    timeout: 20000,
    position: positions.TOP_CENTER,
  };

  const AlertTemplate = ({ message, options, close }) => {
    return (
    <div className="react-alert-area">
      {options.type === 'info' && <IconInfo className="icon"size="20px" style={{color: "rgb(46, 154, 254)"}} />}
      {options.type === 'success' && <IconSuccess className="icon"size="20px" style={{color: "rgb(49, 180, 4)"}} />}
      {options.type === 'error' && <IconError className="icon"size="20px" style={{color: "rgb(255, 0, 64)"}} />}
      <span style={{maxWidth: "82%"}}>{message}</span>
      <IconClose onClick={close} className="icon icon-alert-close"size="20px" style={{color: "white"}} />
    </div>
  )}

  const App = () => (
    <AlertProvider template={AlertTemplate} {...options}>
      <Router>
        <Route exact path="/" component={LandingPage} />
        <Route exact path="/server_auto_login/:username/:password" component={LandingPage} />
        <Route exact path="/chat/:roomId" component={ChatApp} />
        <Route exact path="/chat/:roomId/server_auto_login/:username/:password" component={ChatApp} />
        <Route exact path="/chat" component={ChatApp} />
        <Route exact path="/profile" component={MyProfilePage} />
        <Route path="/profile/:username" component={ProfilePage} />
        <Route path="/room/:roomId" component={RoomSetting} />
      </Router>
    </AlertProvider>
  );

ReactDOM.render(<App />, document.getElementById('app_root'));
