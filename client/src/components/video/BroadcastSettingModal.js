import React from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import IconClose from 'react-icons/lib/md/close';
import { withAlert } from "react-alert";
import ReactPlayer from 'react-player'
import { Progress } from 'reactstrap';
import { socketEmit } from '../../helpers/socketEvents';
import { withTranslation } from 'react-i18next';


var localPreviewVideo;
class BroadcastSettingModal extends React.Component {
  constructor() {
    super();

    this.state = {
      onlyOne: 0,
      error: "",
      audioInputSelect: null, 
      videoInputSelect: null,
      audioDevices: [],
      videoDevices: [],
      broadcastSelectors: [],
      muted: false,
      privateBroadcast: false,
      watermark: false,
      blockedList: null,
      broadcastReqPerm: false,
    };

   

    this.handleChangeVideo = this.handleChangeVideo.bind(this);
    this.modalContentArea = this.modalContentArea.bind(this);
    this.startPreview = this.startPreview.bind(this);
    this.gotStream = this.gotStream.bind(this);
    this.gotDevices = this.gotDevices.bind(this);
    this.complete = this.complete.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleChangeVideo = this.handleChangeVideo.bind(this);
    this.handleChangeAudio = this.handleChangeAudio.bind(this);
    this.handleChangePrivate = this.handleChangePrivate.bind(this);
    this.handleChangeWatermark = this.handleChangeWatermark.bind(this);
    this.startBroadcasting = this.startBroadcasting.bind(this);
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.audioInputSelect !== this.state.audioInputSelect || prevState.videoInputSelect !== this.state.videoInputSelect) {
      this.startPreview()
    }
  }

  handleCloseModal() {
    window.stream &&  window.stream.getTracks().forEach(function(a) {
      a.stop()
      console.log("stop all devices")
    });
    this.props.onRequestClose();
  }

  startBroadcasting() {
    // console.log("selected video from modal: ", this.state.videoInputSelect)
    var data = {
      audioInputSelect: this.state.audioInputSelect, 
      videoInputSelect: this.state.videoInputSelect,
      audioDevices: this.state.audioDevices,
      videoDevices: this.state.videoDevices,
      privateBroadcast: this.state.privateBroadcast,
      watermark: this.state.watermark
    }
    this.handleCloseModal();
    this.props.onActionStartBroadcast(data);
  }

  handleChangeVideo(event) {
    this.setState({videoInputSelect: event.target.value});
    // this.startPreview();
  }

  handleChangeAudio(event) {
    this.setState({audioInputSelect: event.target.value});
    // this.startPreview();
  }

  handleChangeWatermark(event) {
    this.setState({watermark: !this.state.watermark});
  }

  handleChangePrivate(event) {
    this.setState({privateBroadcast: !this.state.privateBroadcast});
  }

  gotDevices(a) {
      if(this.state.videoDevices.length > 0)
        return true;
      var videoDevices = [];
      var audioDevices = [];
      if(a.length > 0) {
          for(var i = 0; i < a.length; i ++) {
            var temp = a[i];
            if(temp.deviceId != "default" && temp.deviceId != "communications"){
              if(temp.kind == "audioinput"){
                audioDevices.push({deviceId: temp.deviceId, label: temp.label, groupId: temp.groupId});
              }else if(temp.kind == "videoinput"){
                videoDevices.push({deviceId: temp.deviceId, label: temp.label, groupId: temp.groupId});
              }
            } 
          }
      }
      
      if(videoDevices.length > 0){
        this.setState({videoInputSelect: videoDevices[0].deviceId, videoDevices: videoDevices});
      }

      if(audioDevices.length > 0){
        this.setState({audioInputSelect: audioDevices[0].deviceId, audioDevices: audioDevices});
      }

        
  }

  complete() {
    // show setting form
    if(!this.state.broadcastReqPerm)
      this.setState({broadcastReqPerm: true, onlyOne: 1});
    
    return true;
  }

  handleError = (a) => {
    var b = "";
    console.log("navigator.getUserMedia error: " + a);
    if (a.name == "NotFoundError") b = "Camera device not found";
    if (a.name == "NotReadableError") b = "Could not start video source";
    if ("NotAllowedError" == a.name || "PermissionDeniedError" == a.name) b = "Camera access denied. You need to allow the use of your camera and microphone in order to broadcast";
    if ("OverconstrainedError" == a.name || "DevicesNotFoundError" == a.name) b = 'ERROR: One of your currently selected audio/video devices could not be found!. Please select another device';
    if("PermissionDismissedError" == a.name) b = 'Try again to allow the use of your camera and microphone in order to broadcast';

    // close dialog
    this.setState({error: b, onlyOne: 1});
    console.log("error :" , b);
  }
  
  gotStream(a) {
    window.stream = a;
    document.getElementById('localPreviewVideo').srcObject = a;
    return navigator.mediaDevices.enumerateDevices()
  }

  startPreview() {
    window.stream &&  window.stream.getTracks().forEach(function(a) {
        a.stop()
    });
    
    // console.log("vide_device : ", this.state.videoInputSelect)
    navigator.getUserMedia = ( navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);
    navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: this.state.audioInputSelect ? {
                exact: this.state.audioInputSelect
            } : void 0
        },
        video: {
            deviceId: this.state.videoInputSelect ? {
                exact: this.state.videoInputSelect
            } : void 0
        }
    }).then(this.gotStream).then(this.gotDevices).then(this.complete)["catch"](this.handleError)
  }

  modalContentArea() {
    if(this.state.onlyOne == 0){
      this.startPreview();
    }
    return (
        <div className="modal-content">
          { this.state.error != "" ?  <div className="error-area">{this.state.error}</div>
          :
          <div>
            <div className={`setting-preview ${ !this.state.broadcastReqPerm ? '' : 'hidden'}`}>
              <h4>Select "Allow" to broadcast</h4>
              <div className="md-lr20">
                <p>To broadcast your webcam or microphone we need permission to use them, approve by selecting “Allow”. </p>
              </div>
              <div className="progress-bar-area">
                <small>Requesting permission...</small>
                <Progress animated color="success" value="100" />
              </div>
            </div>
            <div id="broadcastSettingsForm" className={` ${ this.state.broadcastReqPerm ? '' : 'hidden'}`} >
              <div className="row">
                  <div className="col-sm-6">
                      <div className="text-muted md-t-10"><strong>Select your camera:</strong></div>
                      <select id="videoSource" value={this.state.videoInputSelect ? this.state.videoInputSelect : ''} onChange={this.handleChangeVideo}>
                        { this.state.videoDevices.length > 0 && this.state.videoDevices.map(function(videoDevice, key) {
                            return <option value={videoDevice.deviceId} key={key}>{videoDevice.label}</option>;
                          })
                        }
                      </select>
                      <div className="text-muted md-t-10"><strong>Select your microphone:</strong></div>
                      <select id="audioSource" value={this.state.audioInputSelect ? this.state.audioInputSelect : ''} onChange={this.handleChangeAudio}>
                        { this.state.audioDevices.length > 0 && this.state.audioDevices.map(function(audioDevice, key) {
                            return <option value={audioDevice.deviceId} key={key}>{audioDevice.label}</option>;
                          })
                        }
                      </select>
                      
                  </div>
                  <div className="col-sm-6 text-right">
                    <video id="localPreviewVideo" autoPlay muted style={{width:"100%"}}></video>
                  </div>
                  
              </div>
              <div className="row">
                <div className="col-sm-6 text-right">
                  <button type="button" id="broadcastSettingsSave" data-dismiss="modal" className="button-text" onClick={this.startBroadcasting}>Broadcast</button>
                </div>
                <div className="col-sm-6 text-right">
                  <div className="custom-checkbox text-left">
                    <label>Add watermark<input type="checkbox" id="watermark" onChange={this.handleChangeWatermark} defaultChecked={this.state.watermark} /></label>
                  </div>
                  <div className="custom-checkbox text-left">
                    <label>Private broadcast<input type="checkbox" id="privateBroadcast" onChange={this.handleChangePrivate} defaultChecked={this.state.privateBroadcast} /></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          }
        </div>
    );
  }

  render() {
    navigator.getUserMedia = ( navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        return;
    }
          
    return (
        <Modal
            className="broadcast-setting-modal"
            isOpen={this.props.isOpen}
            onRequestClose={this.handleCloseModal}
        >
            <div className="broadcast-setting-area">
                <div className="md-header">
                    <div className="header-left">
                    <h3>{this.props.t("BroadcastSettingModal.broadcast_setting")}</h3>
                    </div>
                    <IconClose className="icon close-modal" onClick={this.handleCloseModal} size="24px" />
                </div>
                <div className="md-content">
                    {this.modalContentArea()}
                </div>
            </div>
        </Modal>
    );
    
  }
}

BroadcastSettingModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    user_id: PropTypes.number,
    name: PropTypes.string,
    gender: PropTypes.string,
    type: PropTypes.string,
    avatar: PropTypes.string,
    rooms: PropTypes.array,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  onActionStartBroadcast: PropTypes.func.isRequired,
};

export default withTranslation()(withAlert()(BroadcastSettingModal));
