import '!style-loader!css-loader!rc-slider/assets/index.css';
import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import IconVolumeOn from 'react-icons/lib/md/volume-up';
import IconVolumeOff from 'react-icons/lib/md/volume-off';

const wrapperStyle = { width: 80 };

class CustomSlider extends React.Component {
    constructor() {
        super();
    
        this.state = {
          error: null,
        };

        this.onChangeSlider = this.onChangeSlider.bind(this);
        this.onClickMute = this.onClickMute.bind(this);
    }


    onChangeSlider(value) {
        this.props.onActionOnSlider("remote_video_action", { roomId: this.props.roomId, type:"value", value});
    }

    onClickMute(value) {
        this.props.onActionOnSlider("remote_video_action", { roomId: this.props.roomId, type:"mute", value});
    }

    render () {
        // console.log("current mute :", this.props.mute)
        if(this.props.mute) {
            return (
                <div className="custom-slider-area">
                    <Slider 
                        className="custom-slider" 
                        min={this.props.min} 
                        max={this.props.max} 
                        value={0} 
                        allowCross={true} 
                        onChange={this.onChangeSlider} 
                        activeDotStyle={{color: "black", cursor: "pointer"}}
                        trackStyle={{background: "white"}}
                        handleStyle={{borderColor: "white"}}
                        railStyle={{background: "#888888"}}
                    />
                    <div className="mute-audio">
                        <IconVolumeOff className="icon" onClick={() => this.onClickMute(false)} size="24px" />
                    </div>
                </div>
            )
        }else {
            return (
                <div className="custom-slider-area">
                    <Slider 
                        className="custom-slider" 
                        min={this.props.min} 
                        max={this.props.max} 
                        value={this.props.value} 
                        allowCross={false} 
                        onChange={this.onChangeSlider} 
                        activeDotStyle={{color: "white", cursor: "pointer"}}
                        trackStyle={{background: "white"}}
                        handleStyle={{borderColor: "white"}}
                        railStyle={{background: "#888888"}}
                    />
                    <div className="mute-audio">
                        <IconVolumeOn className="icon" onClick={() => this.onClickMute(true)} size="24px" />
                    </div>
                </div>
            )
        }
    }
}

CustomSlider.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    mute: PropTypes.bool.isRequired,
    roomId: PropTypes.string.isRequired,
    onActionOnSlider: PropTypes.func.isRequired
  };

export default CustomSlider;