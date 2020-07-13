import React from 'react';
import PropTypes from 'prop-types';
import IconClose from 'react-icons/lib/md/close';
import IconWatermark from 'react-icons/lib/md/verified-user';
import IconView from 'react-icons/lib/md/visibility';
import IconCamera from 'react-icons/lib/md/videocam';
import IconMic from 'react-icons/lib/md/mic';
import IconMicMute from 'react-icons/lib/md/mic-off';
import IconLock from 'react-icons/lib/md/lock';
import IconCompress from 'react-icons/lib/fa/compress';
import IconExpand from 'react-icons/lib/fa/expand';
import { withAlert } from "react-alert";
import { withTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip'
import { HashLoader } from 'react-spinners';
import CustomSlider from './CustomSlider'
import Config from '../config/config';
// import kurentoUtils from 'kurento-utils';

var socketURL = Config.BROADCAST_SOCKET_URL;

const override = {
    display: 'block !important',
    marginTop: 0,
    marginRight: 'auto',
    marginBottom: 0,
    marginLeft: 'auto',
};

class BroadcastAuto extends React.Component {
  constructor() {
    super();
    
    this.state = {
      local_video_on : true,
      local_audio_on : true,
      connections : {}
    };

    this.connection = null;
    this.broadcastId = "";
    this.myIp = "";
    
    this.ws = null;
    this.volume_meter = null;
    
    this.onClickBroadcast = this.onClickBroadcast.bind(this);
    this.onClickCamera = this.onClickCamera.bind(this);
    this.onClickAudio = this.onClickAudio.bind(this);
    this.stopBroadcasting = this.stopBroadcasting.bind(this);
    this.onClickRemoteVideo = this.onClickRemoteVideo.bind(this);
    this.showRemoteVideo = this.showRemoteVideo.bind(this);
    this.showLocalVideo = this.showLocalVideo.bind(this);
    this.getIp = this.getIp.bind(this);
    this.remoteVideoZoom = this.remoteVideoZoom.bind(this);
    this.showLocalVideoOverlay = this.showLocalVideoOverlay.bind(this);

    this.sendMessage = this.sendMessage.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.dispose = this.dispose.bind(this);
    this.hideSpinner = this.hideSpinner.bind(this);
    this.onmessage = this.onmessage.bind(this);
    this.presenterResponse = this.presenterResponse.bind(this);
    this.viewerResponse = this.viewerResponse.bind(this);
    this.onUnload = this.onUnload.bind(this);
    this.onVolumeChange = this.onVolumeChange.bind(this);
    
  }

  onUnload(event) { // the method that will be used for both add and remove event
    const {connections} = this.state;
    Object.values(connections).forEach(obj => {
        var message = {
            id : 'stop',
            room_id: obj.room_id,
        };
        this.sendMessage(message);
    });
  }

  componentDidMount() {
    this.getIp();
    this.ws = new WebSocket('wss://' + Config.BROADCAST_SOCKET_URL + '/one2many');
    this.ws.onmessage = this.onmessage;
    window.addEventListener("beforeunload", this.onUnload)
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.isLocalBroadcastingStop === false && this.props.isLocalBroadcastingStop === true) {
        this.stopBroadcasting(this.props.socket_id, 'local');
    }
    // update volume and mute
    var that = this
    this.props.user_broadcast_rooms.forEach( function(room){

        if(room.type == "remote" && that.state.connections[room.roomId]) {
            var video =  document.getElementById(room.roomId);
            if(video) {
                video.volume = parseFloat(room.volume / 100);
                video.muted = room.mute;
            }
        }
    });

    // update broadcast rooms
    
    if (prevProps.user_broadcast_rooms != this.props.user_broadcast_rooms) {
        const {connections} = this.state;
        const {user_broadcast_rooms} = this.props;
        // console.log("hhhhhhhhhhere")
        var that = this;
        Object.values(connections).forEach(obj => {
            // console.log({obj})
            // console.log({user_broadcast_rooms})
            const sel_room = user_broadcast_rooms.find(room => room.roomId == obj.room_id)
            if(!sel_room) {
                // console.log(obj.room_id + " not same room , close remote video")
                if (connections[obj.room_id].webRtcPeer) {
                    let type = obj.type == "local" ? "local" : "not_same_room";
                    var message = {
                        id : 'stop',
                        room_id: obj.room_id,
                        type,
                        socket_id: that.props.socket_id
                    }
                    that.sendMessage(message);
                    that.dispose(obj.room_id, type);
                }
            }
            
        });
    }
    
  }

  onVolumeChange(e) {
    console.log({e});
  }

  waitForConnection = (callback, interval) => {
    if (this.ws.readyState === 1) {
        callback();
    } else {
        var that = this;
        // optional: implement backoff for interval here
        setTimeout(function () {
            that.waitForConnection(callback, interval);
        }, interval);
    }
  }

  onmessage(message) {
    var parsedMessage = JSON.parse(message.data);
        // console.info('Received message: ' + message.data);
    switch (parsedMessage.id) {
        case 'presenterResponse':
            // var that = this;
            // setTimeout( () => that.presenterResponse(parsedMessage), 50000)
            this.presenterResponse(parsedMessage);
            break;
        case 'viewerResponse':
            // var that = this;
            // setTimeout( () => that.viewerResponse(parsedMessage), 50000)
            this.viewerResponse(parsedMessage);
            break;
        case 'stopCommunication':
            this.dispose(parsedMessage.room_id, parsedMessage.type);
            break;
        case 'iceCandidate':
            const {connections} = this.state;
            if(connections[parsedMessage.room_id]){
                connections[parsedMessage.room_id].webRtcPeer.addIceCandidate(parsedMessage.candidate)
            }
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
  }

  sendMessage(message, callback) {
    var that = this;
    this.waitForConnection(function () {
        var jsonMessage = JSON.stringify(message);
        // console.log('Senging message: ' + jsonMessage);
        that.ws.send(jsonMessage);
        if (typeof callback !== 'undefined') {
          callback();
        }
    }, 1000);
  }

  onIceCandidate(candidate) {
	//    console.log('Local candidate' + JSON.stringify(candidate));
	   var message = {
	      id : 'onIceCandidate',
          candidate : candidate,
          room_id : this.props.socket_id,
          socket_id : this.props.socket_id
	   }
	   this.sendMessage(message);
  }

  hideSpinner(room_id, type = "local") {
    if(type == "local") {
        var video = document.getElementById("loading_localVideo");
        if(video){
            video.style.display = "none";
        }
    }else{
        var video = document.getElementById("loading_"+room_id);
        if(video){
            video.style.display = "none";
        }
    }
  }

  loggy = (connections) => {
    Object.values(connections).forEach(obj => {
        obj.video = document.getElementById(obj.room_id);
    });
    const conns = Object.values(connections).map(con => {
        return { room_id: con.room_id, webRtcPeer: con.webRtcPeer, video: con.video.id }
    })
    console.log('connections = ', JSON.stringify(conns, null, 2));
  }

  dispose(room_id, type = "local") {

    const {connections} = this.state;
    if(connections[room_id]) {
        if (connections[room_id].webRtcPeer) {
            connections[room_id].webRtcPeer.dispose();
            connections[room_id].webRtcPeer = null;
        }
        delete connections[room_id];
        this.setState({connections});
        if(type == "local"){
            this.props.onActionOnBroadcast("stop_broadcasting", {room_id});
        }else{
            // console.log("close remote video : ", room_id + " :: " + type );
            this.props.onActionOnBroadcast("closed_remote_video", {room_id, type})
        }
        // this.hideSpinner(room_id, type);
    }
  }

  presenterResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.log('Call not accepted for the following reason: ' + errorMsg);
		this.dispose(this.props.socket_id, 'local');
	} else {
		// console.log("room_id : ", message.room_id)
        // console.log("room created.");
        
        const {connections} = this.state;
        
        if(connections[message.room_id]) {
            const {user_broadcast_rooms} = this.props;
            let current_room = user_broadcast_rooms.find(room => room.roomId == message.room_id)
            // console.log({current_room})
            let video = document.getElementById("localVideo");
            if(video) {
                video.volume = 0;
            }
            // connections[message.room_id].video.volume = 0;
            this.hideSpinner(message.room_id, 'local');
            this.props.onActionOnBroadcast("start_broadcasting", {broadcastId: message.room_id, is_private_broadcast: current_room.private, watermark: current_room.watermark})
            connections[message.room_id].webRtcPeer.processAnswer(message.sdpAnswer);
            this.setState({connections});
        }
	}
  }

  viewerResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		// console.warn('Call not accepted for the following reason: ' + errorMsg);
        console.log("room_id  : ", message)
        this.dispose(message.room_id, "remote");
        // this.props.onActionOnBroadcast("closed_remote_video", {room_id : message.room_id, type: "remote"})
	} else {
        var that = this;
        setTimeout(function(){
            that.hideSpinner(message.room_id, 'remote');
            const current_room = that.props.user_broadcast_rooms.find(room => room.roomId == message.room_id);
            if(current_room && current_room.watermark) {
                let now = new Date();
                let cur_date = now.getFullYear()+"-"+(now.getMonth() +1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+ " "+ "UTC"+now.getTimezoneOffset()/60;
                document.getElementById("watermark_ip_"+message.room_id).innerHTML = that.myIp;
                document.getElementById("watermark_date_"+ message.room_id).innerHTML = cur_date;
            }
            
        }, 3000);
        
        const {connections} = this.state;
        if(connections[message.room_id]){
            this.props.onActionOnBroadcast("join_room_user", {room_id: message.room_id})
            connections[message.room_id].webRtcPeer.processAnswer(message.sdpAnswer);
            this.setState({connections});
        }
	}
  }

  onClickBroadcast() {
    var room_id = this.props.socket_id;
    var video = document.getElementById("localVideo");
// console.log({video})
    const {connections} = this.state;
    const that = this
    
    if(connections[room_id] === undefined) {
        const current_room = that.props.user_broadcast_rooms.find(room => room.roomId == room_id);
        // console.log("selected video : ", current_room.videoInputSelect)
        var onOfferPresenter = (error, offerSdp) => {
            if(error){
                that.stopBroadcasting(room_id, "local", error);
            }
        
            var message = {
                id : 'presenter',
                sdpOffer : offerSdp,
                room_id,
                socket_id : this.props.socket_id
            };
            this.sendMessage(message);
        }
        var c = {
            audio: {
                deviceId: current_room.audioInputSelect
            },
            video: {
                deviceId: current_room.videoInputSelect,
                width: {
                    min: 240,
                    max: 360
                },
                height: {
                    min: 180,
                    max: 270
                },
                // frameRate: {
                //     max: 20
                // }
            }
        };
        "safari" == adapter.browserDetails.browser && (delete c.video.height, delete c.video.width);
		var options = {
            localVideo: video,
            mediaConstraints: c,
			onicecandidate : this.onIceCandidate
        }

        const webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
			if(error){
                console.log("local broadcasting error")
                console.log(error)
                that.stopBroadcasting(room_id, "local", error);
            }

            this.generateOffer(onOfferPresenter);
            /*
            connections[room_id].volume_meter = kurentoUtils.WebRtcPeer.hark(connections[room_id].webRtcPeer.getLocalStream());
            connections[room_id].volume_meter.on("volume_change", function(a) {
                // $("#volBroadcastBar").height(a + 100 + "%")
                console.log("volume status : ", a)
            })
            */
            that.volume_meter = kurentoUtils.WebRtcPeer.hark(connections[room_id].webRtcPeer.getLocalStream());
            // that.volume_meter.on("volume_change", that.onVolumeChange)

        });
        
        connections[room_id] = {
            room_id,
            webRtcPeer,
            video,
            type : 'local',
            video_on : true,
            audio_on : true,
            volume_meter: null
        }
        this.setState({ connections })
    }
  }

  getIp() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;  
	var pc = new RTCPeerConnection({iceServers:[]}), 
	noop = function(){}; 
     
   	pc.createDataChannel("");  
    pc.createOffer(pc.setLocalDescription.bind(pc), noop);   
    var that = this;
    pc.onicecandidate = function(ice){ 
       	if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
        var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
        // console.log('my IP: ', myIP); 
        that.myIp = myIP;
        pc.onicecandidate = noop;
        return myIP;
    }; 
  }

  onClickRemoteVideo(room_id, username) {
    var video = document.getElementById(room_id);
    const connections = this.state.connections
    const that = this;
    if(connections[room_id] === undefined) {
        var onOfferViewer = (error, offerSdp) => {
            if(error){
                that.stopBroadcasting(room_id, "remote", error);
            }
        
            var message = {
                id : 'viewer',
                sdpOffer : offerSdp,
                room_id,
                socket_id : that.props.socket_id
            };
            that.sendMessage(message);
        }
		var options = {
			remoteVideo: video,
			onicecandidate : function(b) {
                var message = {
                    id : 'onIceCandidate',
                    candidate : b,
                    room_id,
                    socket_id : that.props.socket_id
                }
                that.sendMessage(message);
            }
        }
        // console.log({options})

		const webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
			if(error){
                that.stopBroadcasting(room_id, "remote", error);
            }
			this.generateOffer(onOfferViewer);
        });
        connections[room_id] = {
            room_id,
            webRtcPeer,
            video,
            type : 'remote',
        }
        this.setState({ connections })
    }
    
  }

  stopBroadcasting( room_id , type = "local", error = "") {
    // console.log("stop broadcast : room :"+room_id + ", type : "+type, error)
    const {connections} = this.state;
    // console.log("stop broadcasting connection : ", connections[room_id])
    if(connections[room_id]) {
        if (connections[room_id].webRtcPeer) {
            var message = {
                id : 'stop',
                room_id,
                type,
                socket_id: this.props.socket_id
            }
            this.sendMessage(message);
            this.dispose(room_id, type);
        }
    }else{
        this.props.onActionOnBroadcast("closed_remote_video", {room_id, type})
        console.log("remotestream end :: ", room_id)
    }
  }

  onClickCamera( room_id ) {
    // console.log("video end :: ", room_id)
    const {connections} = this.state;
    if(connections[room_id]) {
        connections[room_id].video_on = !connections[room_id].video_on;
        connections[room_id].webRtcPeer.videoEnabled = connections[room_id].video_on;
        this.setState({local_video_on: connections[room_id].video_on, connections});
    }
  }

  onClickAudio( room_id ) {
    // console.log("audio end :: ", room_id)
    const {connections} = this.state;
    if(connections[room_id]) {
        connections[room_id].audio_on = !connections[room_id].audio_on;
        connections[room_id].webRtcPeer.audioEnabled = connections[room_id].audio_on;
        this.setState({local_audio_on: connections[room_id].audio_on, connections});
    }
  }

  remoteVideoZoom(roomId, zoom) {
    //   console.log("click zoom :", zoom)
    this.props.onActionOnBroadcast("remote_video_action", { roomId, type:"zoom", value: zoom});
  }

  individualVideoArea = (room, key, width_class) => {
    //   console.log({room})
      if(room.type == "local") {
        return this.showLocalVideo(room, key, width_class);
      }else{
        return this.individualRemoteVideoArea(room, key, width_class);
      }

  }

  individualRemoteVideoArea = (room, key, width_class) => {
      var video = document.getElementById(room.roomId);
    //   console.log("individualRemoteVideoArea: current room : ", room, ", found video = ", video);
    //   this.loggy(this.state.connections);
    return (
        <div id={`remote_room_${room.roomId}`} key={room.roomId} className={`remote-room ${width_class} ${room.zoom ? 'zoom' : ''}`}>
            <video id={room.roomId} className="video-container my-video video-container-overlay" autoPlay playsInline style={{backgroundColor: 'black'}}></video>
            <div className="owner-overlay">
                <div id={`owner_${room.roomId}`} className="owner-name">{room.owner}</div>
            </div>
            <div className="watermark-overlay">
                <div className="watermark">
                    <div id={`watermark_ip_${room.roomId}`}></div>
                    <div id={`watermark_date_${room.roomId}`}></div>
                </div>
            </div>
            <div id={`loading_${room.roomId}`} className="loading-overlay">
                <HashLoader
                    css={override}
                    sizeUnit={"px"}
                    size={50}
                    color={'#c5c5c5'}
                    loading={true}
                />
            </div>
            <div className="ecp-overlay">
                <div className="overlayCenter">
                    <div className="icon-base">
                        <IconClose onClick={() => this.stopBroadcasting(room.roomId, 'remote')} className="icon cur-pointer icon-video-close" size="20px" />
                    </div>
                </div>
                <div className="overlayBtm">
                    <div className="icon-base">
                        
                        {room.zoom ? <div className="icon-zoom"><IconCompress onClick={() =>this.remoteVideoZoom(room.roomId, false)} className="icon" size="20px" /></div> :
                        <div className="icon-zoom"><IconExpand onClick={() =>this.remoteVideoZoom(room.roomId, true)} className="icon icon-video-zoom" size="20px" /></div> }
                        <CustomSlider 
                            min={0}
                            max={100}
                            value={room.volume}
                            mute={room.mute}
                            roomId={room.roomId}
                            onActionOnSlider={this.props.onActionOnBroadcast} 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
  }

  getVideoWidth = (index) => {
    const {user_broadcast_rooms} = this.props;
    let counts = user_broadcast_rooms.length;
    let current_room = user_broadcast_rooms[index];
    var class_width100 = "width100";
    var class_width50 = "width50";
    var class_width33 = "width33";
    if(current_room.zoom) {
        return class_width100;
    }else {
        let has_zoom = user_broadcast_rooms.find(r => r.zoom == true);
        let class_width = class_width100;
        if(has_zoom) {
            switch(counts) {
                case 1: case 2:
                    class_width = class_width100
                    break;
                case 3: case 4: case 5: case 6: case 7:
                    class_width = class_width50
                    break;
                case 8: case 9: case 10: case 11: case 12:
                    class_width = class_width33
                    break;
            }
        }else {
            switch(counts) {
                case 1: case 2:
                    class_width = class_width100
                    break;
                case 3: case 4: case 5: case 6: case 7: case 8:
                    class_width = class_width50
                    break;
                case 9: case 10: case 11: case 12:
                    class_width = class_width33
                    break;
            }
        }
        
        return class_width;
    }
  }

  sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

  create_connection = (index) => {
    const {user_broadcast_rooms} = this.props;
    var that = this;
    // console.log("remote video ", index + " -- : "+user_broadcast_rooms[index].roomId+ " ... "+ new Date().getTime())
    setTimeout(() => {
        // console.log({index})
        // console.log("loading this video room : ",user_broadcast_rooms[index].roomId + " owner : "+ that.props.user_name)
        that.onClickRemoteVideo(user_broadcast_rooms[index].roomId, that.props.user_name);  
    }, index * 400);
  }

  showRemoteVideo() {
    const {connections} = this.state;
    const {user_broadcast_rooms} = this.props;
    
    if(!this.props.isRemoteBroadcasting) {
        return null;
    }else {
        const remote_area1 = [];
        const remote_area2 = [];
        const remote_area3 = [];
        const remote_area4 = [];
        // console.log({user_broadcast_rooms})
        for(var i in user_broadcast_rooms) {
          var room_id = user_broadcast_rooms[i].roomId;
        //   console.log("index : ", i)
        //   console.log({room_id})
        //   console.log(connections[room_id])
          if(connections[room_id] === undefined) {
              var that = this;
            //   console.log("room type : ", user_broadcast_rooms[i].type)
              if(user_broadcast_rooms[i].type == "local") {
                setTimeout(function(){
                    that.onClickBroadcast();
                }, 300);
              }else {
                  let temp_area = document.getElementById(room_id);
                  if(!temp_area) {
                      this.create_connection(i)
                  }
              }
          }

        }
        let counts = user_broadcast_rooms.length;
        return (
            <div id="remote_area" className={`remote-area ${ this.props.isRemoteBroadcasting ? '' : 'hidden'}`}>
                {user_broadcast_rooms.map((room, i) => {
                    let width_class = this.getVideoWidth(i);
                    if (i < 13) return this.individualVideoArea(room, i, width_class);
                    return null;
                })}
            </div>
        )
    }
    
  }

  showLocalVideoOverlay() {
    return (
        <div className="overlay">
            <div className="overlayTop">
                { (this.props.privateBroadcast || this.props.watermark) && <div className="left-icon">
                    <div className="base-area">
                        {this.props.watermark && <div className="pull-left"><IconWatermark className="icon cur-pointer icon-watermark-video" data-tip='watermark' data-place='bottom' data-for='icon_watermark' size="16px" style={{color: "#2dea34"}} />
                        <ReactTooltip id='icon_watermark' /></div>}
                        {this.props.privateBroadcast && <div className="pull-left"><IconLock className="icon cur-pointer icon-private-video" size="16px" data-tip='private' data-place='bottom' data-for='icon_private' style={{color: "#e3e800"}} />
                        <ReactTooltip id='icon_private' /></div>}
                    </div>
                </div>}

                <div className="left-icon" style={{color: "white"}}>
                    <div className="base-area" style={{float: "left"}}>
                        <IconView className="icon cur-pointer icon-viewer" size="16px" />
                        <small>&nbsp;{this.props.broadcasting_viwers.length}</small>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  showLocalVideo(room, key, width_class) {
    let video_on = this.state.local_video_on;
    let audio_on = this.state.local_audio_on;
    // console.log("show local video : ", room)
    return (
        <div className={`local-area ${width_class} `} key={room.roomId}>
            <video id="localVideo" className="video-container my-video video-container-overlay" autoPlay={true}></video>
            <div id="loading_localVideo" className="loading-overlay">
                <HashLoader
                    css={override}
                    sizeUnit={"px"}
                    size={50}
                    color={'#c5c5c5'}
                    loading={true}
                />
            </div>
            <div className="ecp-overlay">
                <div className="overlayBtm">
                    <div className="icon-base">
                        <IconClose onClick={() =>this.stopBroadcasting(room.roomId)} className="icon cur-pointer icon-video-close"size="20px" />
                    </div>
                    <div className="icon-base">
                        {room.zoom ? <div className="icon-zoom"><IconCompress onClick={() =>this.remoteVideoZoom(room.roomId, false)} className="icon cur-pointer icon-local-video-zoom" size="20px" /></div> :
                        <div className="icon-zoom"><IconExpand onClick={() =>this.remoteVideoZoom(room.roomId, true)} className="icon cur-pointer icon-local-video-zoom" size="20px" /></div> }
                    </div>
                    <div className="icon-base">
                        {video_on ? 
                            <IconCamera onClick={() =>this.onClickCamera(room.roomId)} className="icon cur-pointer icon-pauseVideo" size="20px" /> :
                            <IconCamera onClick={() =>this.onClickCamera(room.roomId)} className="icon cur-pointer icon-pauseVideo disabled" size="20px" />
                        }
                    </div>
                    <div className="icon-base">
                        {audio_on ? 
                            <IconMic onClick={() =>this.onClickAudio(room.roomId)} className="icon cur-pointer icon-pauseVideo" size="20px" /> :
                            <IconMicMute onClick={() =>this.onClickAudio(room.roomId)} className="icon cur-pointer icon-pauseVideo disabled" size="20px" />
                        }
                    </div>
                </div>
            </div>
            <div className="overlay">
                <div className="overlayTop">
                    { (room.private || room.watermark) && <div className="left-icon">
                        <div className="base-area">
                            {room.watermark && <div className="pull-left"><IconWatermark className="icon cur-pointer icon-watermark-video" data-tip='watermark' data-place='bottom' data-for='icon_watermark' size="16px" style={{color: "#2dea34"}} />
                            <ReactTooltip id='icon_watermark' /></div>}
                            {room.private && <div className="pull-left"><IconLock className="icon cur-pointer icon-private-video" size="16px" data-tip='private' data-place='bottom' data-for='icon_private' style={{color: "#e3e800"}} />
                            <ReactTooltip id='icon_private' /></div>}
                        </div>
                    </div>}

                    <div className="left-icon" style={{color: "white"}}>
                        <div className="base-area" style={{float: "left"}}>
                            <IconView className="icon cur-pointer icon-viewer" size="16px" />
                            <small>&nbsp;{this.props.broadcasting_viwers.length}</small>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
  }

  render() {
    // this.loggy(this.state.connections)

    return (
      <div className="video-conference-area-auto">
        {this.showRemoteVideo()}
      </div>
    )
  }
}

BroadcastAuto.propTypes = {
    socket_id: PropTypes.string.isRequired,
    user_name: PropTypes.string.isRequired,
    privateBroadcast: PropTypes.bool,
    isRemoteBroadcasting: PropTypes.bool.isRequired,
    watermark: PropTypes.bool,
    user_broadcast_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
    broadcasting_viwers: PropTypes.array.isRequired,
    onActionOnBroadcast: PropTypes.func.isRequired
};

export default withTranslation()(withAlert()(BroadcastAuto));