import React from 'react';
import PropTypes from 'prop-types';
import IconClose from 'react-icons/lib/md/close';
import IconWatermark from 'react-icons/lib/md/verified-user';
import IconView from 'react-icons/lib/md/visibility';
import IconCamera from 'react-icons/lib/md/videocam';
import IconLock from 'react-icons/lib/md/lock';
import IconCompress from 'react-icons/lib/fa/compress';
import IconExpand from 'react-icons/lib/fa/expand';
import { withAlert } from "react-alert";
import { withTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip'
import { HashLoader } from 'react-spinners';
import CustomSlider from './../video/CustomSlider'
import Config from '../config/config';

var publicRoomIdentifier = 'video-conference-dashboard1';
var maxRelayLimitPerUser = 10;
var socketURL = Config.BROADCAST_SOCKET_URL;

const override = {
    display: 'block !important',
    marginTop: 15,
    marginRight: 'auto',
    marginBottom: 0,
    marginLeft: 'auto',
};

class Broadcast extends React.Component {
  constructor() {
    super();
    
    this.state = {
      muted: true,
    };

    this.connections = [];
    this.connection = null;
    this.broadcastId = "";
    this.myIp = "";
    

    this.onClickBroadcast = this.onClickBroadcast.bind(this);
    this.onClickCamera = this.onClickCamera.bind(this);
    this.stopBroadcasting = this.stopBroadcasting.bind(this);
    this.onNumberOfBroadcastViewersUpdated = this.onNumberOfBroadcastViewersUpdated.bind(this);
    this.onClickRemoteVideo = this.onClickRemoteVideo.bind(this);
    this.showRemoteVideo = this.showRemoteVideo.bind(this);
    this.showLocalVideo = this.showLocalVideo.bind(this);
    this.getIp = this.getIp.bind(this);
    this.onstream = this.onstream.bind(this);
    this.remoteVideoZoom = this.remoteVideoZoom.bind(this);
    this.showLocalVideoOverlay = this.showLocalVideoOverlay.bind(this);
    
}

  componentDidMount() {
    this.getIp();
    // this.manageConnection.connectSocket(this.connectSocket);
    // console.log("** mount connections size *** ", this.connections)

  }

  componentWillUnmount() {
    // console.log("** unmount connections size *** ", this.connections)
  }

  componentDidUpdate(prevProps, prevState) {
      if (prevProps.isLocalBroadcastingStop === false && this.props.isLocalBroadcastingStop === true) {
        var existConnection = this.connections.find(connection => connection.extra.owner === this.props.user_name);
        var broadcastId = existConnection.extra.broadcastId;
        this.stopBroadcasting(broadcastId);
      }

      // update volume and mute
      var that = this
      this.props.user_broadcast_rooms.forEach( function(room){
        var video =  document.getElementById(room.roomId);
        
        video.volume = parseFloat(room.volume / 100);
        video.muted = room.mute;
        
    });
  }

  connectSocket = (socket) => {
    
    socket.on('disconnect', function() {
        console.log("manage connection disconnected");
        console.log("connection disconnected socket", socket);
        // location.reload();
    });
 
    // console.log("connectSocket : ", so   cket)
    // console.log("connectSocket : ", this.connections)
    // const connection = this.connections.find(connection => connection.socket.id == socket.id);
    // console.log("connect socket : ", connection)

    socket.on('logs', function(log) {
      console.log("socket log : ", log)
        // document.querySelector('h1').innerHTML = log.replace(/</g, '----').replace(/>/g, '___').replace(/----/g, '(<span style="color:red;">').replace(/___/g, '</span>)');
    });

    var that = this;
    // this event is emitted when a broadcast is already created.
    socket.on('join-broadcaster', function(hintsToJoinBroadcast) {
        console.log('join-broadcaster', hintsToJoinBroadcast);
    });

    socket.on('rejoin-broadcast', function(broadcastId) {
        console.log('rejoin-broadcast : ', broadcastId);
        /*
        that.connection.attachStreams = [];
        socket.emit('check-broadcast-presence', broadcastId, function(isBroadcastExists) {
            if (!isBroadcastExists) {
                // the first person (i.e. real-broadcaster) MUST set his user-id
                that.connection.userid = broadcastId;
            }

            socket.emit('join-broadcast', {
                broadcastId: broadcastId,
                userid: that.connection.userid,
                typeOfStreams: that.connection.session
            });
        });
        */
    });

    socket.on('broadcast-stopped', function(broadcastId) {
        // alert('Broadcast has been stopped.');
        // location.reload();
        console.error('broadcast-stopped', broadcastId);
        alert('This broadcast has been stopped.');
    });

    // this event is emitted when a broadcast is absent.
    socket.on('start-broadcasting', function(typeOfStreams) {
        console.log('start-broadcasting', typeOfStreams);

    });
  }

  onstream = (event) => {

    // console.log("onstream : ", event)
    var connection = this.connections.find(connection => connection.extra.broadcastId == event.extra.broadcastId);
    if(connection){
        // console.log("onstream current connection", connection)
        if (connection.isInitiator && event.type == "local") {
            // own broadcast video
            connection.isUpperUserLeft = false;
            var video =  document.getElementById('localVideo');
            video.srcObject = event.stream;
            // video.userid = event.userid;
            video.volume = 0;
            try {
                video.setAttributeNode(document.createAttribute('muted'));
            } catch (e) {
                video.setAttribute('muted', true);
            }
            connection.socket.on('disconnect', function() {
                // if broadcast owner stream closed, notice to all participants
                console.log("all participants : ", connection.getAllParticipants())
            });
        }else if(connection.isInitiator && event.type == "remote") {
            // this.props.onActionOnBroadcast("join_room_user", {broadcastId: broadcastId, username: event.extra.username})
        }else if(event.userid != connection.userid &&  event.type == "remote") {
            // show remote video
            var broadcastId = event.extra.broadcastId;
            // this.props.onActionOnBroadcast("get_remote_stream", {broadcastId, streamid: event.streamid})
            var video =  document.getElementById(broadcastId);
            video.srcObject = event.stream;
            video.userid = event.extra.broadcastId;
            video.volume = 1;
            
            // document.getElementsByClassName("video-conference-area").appendChild(event.mediaElement.outerHTML)
            var owner =  document.getElementById("owner_"+broadcastId);
            owner.innerHTML = event.extra.owner;
            if(event.extra.watermark) {
                document.getElementById("watermark_ip_"+broadcastId).innerHTML = this.myIp;
                document.getElementById("watermark_date_"+ broadcastId).innerHTML = connection.extra.cur_date;
            }

            setTimeout(()=> {
                // play video
                // try {
                //     video.setAttributeNode(document.createAttribute('autoplay'));
                //     video.setAttributeNode(document.createAttribute('playsinline'));
                // } catch (e) {
                //     video.setAttribute('autoplay', true);
                //     video.setAttribute('playsinline', true);
                // }
                video.autoplay = true;
                video.load(); 
                // hide loading gif
                document.getElementById("loading_"+broadcastId).style.display = "none";
            }, 3000);
            
        }else {
            console.log("stream temp : *******************************");
        }
    }else{
        // this.connections = this.connections.filter(connection => connection.userid != event.userid);
        console.log("onstream there is no connection ******************************************************")
        return;
    }

  }

  createNewConnection () {
    var connection = new RTCMultiConnection();
    connection.maxRelayLimitPerUser = maxRelayLimitPerUser;
    connection.autoCloseEntireSession = true; 
    connection.publicRoomIdentifier = publicRoomIdentifier;
    
    //   connection.socketURL = '/';
    // comment-out below line if you do not have your own socket.io server
    connection.socketURL = socketURL;//'https://rtcmulticonnection.herokuapp.com:443/';
    connection.iceServers = [{
            'urls': [
                'turn:webrtcweb.com:4455?transport=udp', // restund udp
            ],
            'username': 'muazkh',
            'credential': 'muazkh'
        },
        {
            'urls': [
                'stun:stun.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        }
    ];
    connection.socketMessageEvent = 'individual-connection';//'scalable-media-broadcast-demo';
    connection.autoCreateMediaElement = false;
    connection.bandwidth = {
        audio: 100,  // 50 kbps
        video: 150, // 256 kbps
    };
   
    return connection
  }
    // ask node.js server to look for a broadcast
  // if broadcast is available, simply join it. i.e. "join-broadcaster" event should be emitted.
  // if broadcast is absent, simply create it. i.e. "start-broadcasting" event should be fired.
  onClickBroadcast() {
    var connection = this.createNewConnection();
    var broadcastId = connection.token();
    connection.extra.broadcastId = broadcastId;
    // connection.session = {
    //     audio: true,//{ deviceId: {exact: this.props.audioInputSelect} },
    //     video: true,//{ deviceId: {exact: this.props.videoInputSelect} },
    //     oneway: true
    // };
    connection.mediaConstraints = {
        audio: {
            echoCancellation: true, // disabling audio processing
            googAutoGainControl: true,
            googNoiseSuppression: true,
            googHighpassFilter: true,
            googTypingNoiseDetection: true,
            facingMode: 'application', // or "application" for back camera,
            deviceId: this.props.audioInputSelect
        },
        video: {
            minFrameRate: 3,
            maxFrameRate: 15,
            facingMode: 'application', // or "application" for back camera,
            deviceId: this.props.videoInputSelect
        }
    };
    
    connection.session = {
        audio: {
            deviceId: this.props.audioInputSelect ? {
                exact: this.props.audioInputSelect
            } : void 0
        },
        video: {
            deviceId: this.props.videoInputSelect ? {
                exact: this.props.videoInputSelect
            } : void 0
        },
        // broadcast: true,
        oneway: true
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: false
    };
    
    // this.manageConnection.sessionid = broadcastId; // room_id
    connection.isInitiator = true;
    connection.extra.username = this.props.user_name;
    connection.extra.owner = this.props.user_name;
    connection.extra.watermark = this.props.watermark;
    connection.extra.broadcastId = broadcastId;
    connection.socketCustomEvent = 'closed_remote_video';

    var that = this;
    connection.open(broadcastId, function(isRoomOpened, roomid, error) { // broadcastId is room_id
        if (error) {
            if (error === connection.errors.ROOM_NOT_AVAILABLE) {
                console.log('Someone already created this room. Please either join or create a separate room.');
            }
            that.props.onActionOnBroadcast("stop_broadcasting", {})
        }
        connection.socket.on('disconnect', function() {
            console.log("room owner stop broadcast room_id : ", roomid);
            that.props.onActionOnBroadcast("stop_broadcasting", {})
        });
    });

    // connection.connectSocket(this.connectSocket);
    connection.onstream = this.onstream;
    // connection.onleave = this.onleave; // when remote user left room
    connection.onstreamended = this.onstreamended;
    // this.connection.onNumberOfBroadcastViewersUpdated = this.onNumberOfBroadcastViewersUpdated;
    // console.log("start_broadcasting broadcastId :", broadcastId)
    this.props.onActionOnBroadcast("start_broadcasting", {broadcastId: broadcastId, is_private_broadcast: this.props.privateBroadcast, watermark: this.props.watermark})
    this.connections.push(connection);
    return broadcastId;
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

  onClickRemoteVideo(broadcastId, username) {

    var connection = this.createNewConnection();
    connection.session = {
        audio: false,
        video: false,
        oneway: true
    };

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };

    let now = new Date();
    // var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; //now.getMonth()
    let cur_date = now.getFullYear()+"-"+(now.getMonth() +1)+"-"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+ " "+ "UTC"+now.getTimezoneOffset()/60;
    connection.extra.username = username;
    connection.extra.broadcastId = broadcastId;
    connection.extra.cur_date = cur_date;
        
    connection.onstream = this.onstream;
    // connection.onleave = this.onleave; // when remote user left room
    connection.onstreamended = this.onstreamended;
    
    this.connections.push(connection);

    var that = this;
    connection.join(broadcastId, function(isRoomJoined, roomid, error) {
        if (error) {
            that.connections = that.connections.filter( (connection) => connection.extra.broadcastId == broadcastId);
            if (error === connection.errors.ROOM_NOT_AVAILABLE) {
                // alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                that.props.onActionOnBroadcast("join_room_error", { broadcastId: broadcastId, error: "You can't access this user streaming video, please try again." })
                return;
            }
            if (error === connection.errors.ROOM_FULL) {
                // alert('Room is full.');
                that.props.onActionOnBroadcast("join_room_error", {broadcastId: broadcastId, error: "You can't access this user streaming video, error bandwidth full."})
                return;
            }
            if (error === connection.errors.INVALID_PASSWORD) {
                connection.password = prompt('Please enter room password.') || '';
                if (!connection.password.length) {
                    alert('Invalid password.');
                    return;
                }
                connection.join(broadcastId, function(isRoomJoined, roomid, error) {
                    if (error) {
                        alert(error);
                    }
                });
                return;
            }
            that.props.onActionOnBroadcast("join_room_error", {broadcastId: broadcastId, error})
        }
        that.props.onActionOnBroadcast("join_room_user", {broadcastId, username})
        connection.socket.on('disconnect', function() {
            // alert("connection disconnected : ", connection.token());
            // location.reload();
            that.props.onActionOnBroadcast("join_room_error", {broadcastId: broadcastId, error: "your remote session is expired."})
        });
    });
    return true;
  }

  stopBroadcasting( broadcastId , type = "general") {
    // console.log("stop broadcast : ", broadcastId)
    // console.log("stop broadcast : ", this.connections)
    const connection = this.connections.find(connection => connection.extra.broadcastId == broadcastId);
    // console.log("stop broadcast : ", connection);
    if(connection) {
        this.connections  = this.connections.filter(connection => connection.extra.broadcastId != broadcastId);
        if( connection.extra.owner === this.props.user_name) {
            // broadcast owner closed broadcast
            var firstStreamEvent = connection.streamEvents.selectFirst({
                local: true
            });
            if(firstStreamEvent){
                firstStreamEvent.stream.getVideoTracks().forEach(function(track) {
                    track.stop();
                    // console.log("local devices ", track)
                });
            }
            var firstLocalMicrophone = connection.streamEvents.selectFirst({
                local: true,
                isAudio: true
            });
            if(firstLocalMicrophone) {
                firstLocalMicrophone.stream.getTracks().forEach(function(track) {
                    track.stop();
                    // console.log("local audio devices ", track)
                });
            }
            
            connection.close();
            
            this.props.onActionOnBroadcast("stop_broadcasting", {broadcastId});
            return null;
        }else if(connection.extra.username === this.props.user_name) {
            // remote video track stop
            var firstRemoteMicrophone = connection.streamEvents.selectFirst({
                remote: true,
                isAudio: true,
                userid: connection.userid
            });
            if(firstRemoteMicrophone) {
                var firstRemoteMicrophoneStream = firstRemoteMicrophone.stream;
                firstRemoteMicrophoneStream.getTracks().forEach(function(track) {
                    track.stop();
                    // console.log("remove audio devices ", track)
                });
            }
            connection.close();
            this.props.onActionOnBroadcast("closed_remote_video", {broadcastId: broadcastId, type: type})
        }else {
            console.log("remotestream connection end :: ", connection)    
        }
        
    }else{
        console.log("remotestream end :: ", broadcastId)
    }
  }

  onClickCamera( broadcastId ) {
      console.log("video end :: ", broadcastId)
  }

  onstreamended = (event) => {
    //   console.log("onstreamended event: ", event);
    //   console.log("onstreamended connections: ", this.connections);
    var connection = this.connections.find(connection => connection.sessionid == event.extra.broadcastId);
    if(connection) {
        this.connections = this.connections.filter( (connection) => connection.sessionid == event.extra.broadcastId);
        if(connection.isInitiator) {
            console.log("onstreamended : owner");
        }else{
            // console.log("onstreamended : remote");
            var message = this.props.t("Broadcast.owner_closed_broadcast", {owner: event.extra.username});
            this.props.alert.show(message);

            // remote video track stop
            var firstRemoteMicrophone = connection.streamEvents.selectFirst({
                remote: true,
                isAudio: true,
                userid: connection.userid
            });
            if(firstRemoteMicrophone) {
                var firstRemoteMicrophoneStream = firstRemoteMicrophone.stream;
                firstRemoteMicrophoneStream.getTracks().forEach(function(track) {
                    track.stop();
                    // console.log("remove audio devices ", track)
                });
            }

            this.props.onActionOnBroadcast("closed_remote_video", {broadcastId: event.extra.broadcastId, type: "general"})
        }
    }else {
        console.log("onstreamended : no connection");
    }
  }
    
  onleave = (event) => {
    console.log("onleave event: ", event);
    console.log("onleave connections: ", this.connections);
    const connection = this.connections.find(connection => connection.userid == event.userid && connection.extra.broadcastId == event.extra.broadcastId);
    if (connection === undefined) return;
    this.connections = this.connections.filter( (connection) => connection.extra.broadcastId == event.extra.broadcastId);
    var that = this;
    if(connection.isInitiator){
        connection.getSocket( function(socket) {
            socket.emit('can-not-relay-broadcast');
    
            connection.isUpperUserLeft = true;
            console.log("stream owner closed");
            that.stopBroadcasting(connection.extra.broadcastId, "owner");
        });
    }else {
        // owner broadcasting stopped, so remote view remove
        console.log("owner broadcasting stopped, so remote view remove")
        var message = this.props.t("Broadcast.owner_closed_broadcast", {owner: event.extra.username});
        this.props.alert.show(message);

        // remote video track stop
        var firstRemoteMicrophone = connection.streamEvents.selectFirst({
            remote: true,
            isAudio: true,
            userid: connection.userid
        });
        if(firstRemoteMicrophone) {
            var firstRemoteMicrophoneStream = firstRemoteMicrophone.stream;
            firstRemoteMicrophoneStream.getTracks().forEach(function(track) {
                track.stop();
                console.log("remove audio devices ", track)
            });
        }

        this.props.onActionOnBroadcast("closed_remote_video", {broadcastId: event.extra.broadcastId, type: "general"})
    }
  }

  onNumberOfBroadcastViewersUpdated = (event) => {
    if (!this.connection.isInitiator) return;
    console.log('Number of broadcast viewers:', event.numberOfBroadcastViewers);
  }

  remoteVideoZoom(roomId, zoom) {
      console.log("click zoom :", zoom)
    this.props.onActionOnBroadcast("remote_video_action", { roomId, type:"zoom", value: zoom});
  }

  individualRemoteVideoArea = (room, key) => {
    return (
        <div id={`remote_room_${room.roomId}`} key={key} className={`remote-room ${room.zoom ? 'zoom' : ''}`}>
            <video id={room.roomId} className="video-container my-video video-container-overlay" ></video>
            <div className="owner-overlay">
                <div id={`owner_${room.roomId}`} className="owner-name"></div>
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
                        <IconClose onClick={() =>this.stopBroadcasting(room.roomId)} className="icon cur-pointer icon-video-close" size="20px" />
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

  showRemoteVideo() {
      if(!this.props.isRemoteBroadcasting) {
          return null;
      }else {
          const {user_broadcast_rooms} = this.props;
          const remote_area1 = [];
          const remote_area2 = [];
          const remote_area3 = [];
          const remote_area4 = [];
          for(var i in this.props.user_broadcast_rooms) {
            var connection = this.connections.find(connection => connection.extra.broadcastId == user_broadcast_rooms[i].roomId);
            if(connection === undefined) {
                this.onClickRemoteVideo(user_broadcast_rooms[i].roomId, this.props.user_name);    
            }

            if(i % 4 == 0) {
                remote_area1.push(this.individualRemoteVideoArea(user_broadcast_rooms[i], i))    
            }else if(i % 4 == 1) {
                remote_area2.push(this.individualRemoteVideoArea(user_broadcast_rooms[i], i))    
            }else if(i % 4 == 2) {
                remote_area3.push(this.individualRemoteVideoArea(user_broadcast_rooms[i], i))    
            }else if(i % 4 == 3) {
                remote_area4.push(this.individualRemoteVideoArea(user_broadcast_rooms[i], i))    
            }
          }
          return (
            <div id="remote_area" className={`remote-area ${ this.props.isRemoteBroadcasting ? '' : 'hidden'}`}>
                <div className="remote-room-area">
                    {remote_area1.length > 0 && remote_area1}
                </div>
                <div className="remote-room-area">
                    {remote_area2.length > 0 && remote_area2}
                </div>
                <div className="remote-room-area">
                    {remote_area3.length > 0 && remote_area3}
                </div>
                <div className="remote-room-area">
                    {remote_area4.length > 0 && remote_area4}
                </div>
            </div>
          )
      }
      /*
    if(this.props.isRemoteBroadcasting) {
        // console.log("remote rooms : ", this.props.user_broadcast_rooms)
        return this.props.user_broadcast_rooms.map( (room, key) => {
            // console.log("remote roomid :" , room.roomId)
            const connection = this.connections.find(connection => connection.extra.broadcastId == room.roomId);
            // console.log("remote connection :" , connection)
            if(connection === undefined) {
                this.onClickRemoteVideo(room.roomId, this.props.user_name);    
            }
            return (
                <div id={`remote_room_${room.roomId}`} key={key} className={`remote-room ${room.zoom ? 'zoom' : ''}`}>
                    <video id={room.roomId} className="video-container my-video video-container-overlay" ></video>
                    <div className="owner-overlay">
                        <div id={`owner_${room.roomId}`} className="owner-name"></div>
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
                                <IconClose onClick={() =>this.stopBroadcasting(room.roomId)} className="icon cur-pointer icon-video-close" size="20px" />
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
            );
        });
        
    }
    */
  }

  showLocalVideoOverlay() {
    //   console.log("this.props.broadcasting_viwers : ", this.props.broadcasting_viwers)
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

  showLocalVideo() {
    const existConnection = this.connections.find(connection => connection.extra.owner === this.props.user_name);
    var broadcastId = "";
    if( existConnection === undefined) {
        if(this.props.isLocalBroadcasting) 
            broadcastId = this.onClickBroadcast();
        else
            return null;
    }else{
        broadcastId = existConnection.extra.broadcastId;
    }
    return (
        <div className={`local-area ${broadcastId == "" ? 'hidden' : ''}`}>
            <video id="localVideo" className="video-container my-video video-container-overlay" autoPlay={true}></video>
            <div className="ecp-overlay">
                <div className="overlayBtm">
                    <div className="icon-base">
                        <IconClose onClick={() =>this.stopBroadcasting(broadcastId)} className="icon cur-pointer icon-video-close"size="20px" />
                    </div>
                    <div className="icon-base">
                        <IconCamera onClick={() =>this.onClickCamera(broadcastId)} className="icon cur-pointer icon-pauseVideo" size="20px" />
                    </div>
                </div>
            </div>
            {this.showLocalVideoOverlay()}
            
        </div>
    );
  }

  render() {
    if(navigator.connection &&
        navigator.connection.type === 'cellular' &&
        navigator.connection.downlinkMax <= 0.115) {
       alert('2G is not supported. Please use a better internet service.');
    }

    return (
      <div className="video-conference-area">
        {this.showLocalVideo()}
        {this.showRemoteVideo()}
      </div>
    )
  }
}

Broadcast.propTypes = {
    user_name: PropTypes.string.isRequired,
    audioInputSelect: PropTypes.string,
    videoInputSelect: PropTypes.string,
    privateBroadcast: PropTypes.bool,
    isLocalBroadcasting: PropTypes.bool.isRequired,
    isLocalBroadcastingStop: PropTypes.bool.isRequired,
    isRemoteBroadcasting: PropTypes.bool.isRequired,
    watermark: PropTypes.bool,
    user_broadcast_rooms: PropTypes.arrayOf(PropTypes.object).isRequired,
    broadcasting_viwers: PropTypes.array.isRequired,
    onActionOnBroadcast: PropTypes.func.isRequired
};

export default withTranslation()(withAlert()(Broadcast));