import React from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import IconClose from 'react-icons/lib/md/close';
import IconBack from 'react-icons/lib/md/arrow-back';
import IconProfile from 'react-icons/lib/md/person';
import IconTranslate from 'react-icons/lib/md/translate';
import IconMessage from 'react-icons/lib/fa/comments';
import IconNext from 'react-icons/lib/md/navigate-next';
import IconBlock from 'react-icons/lib/md/not-interested';
import IconBroadcast from 'react-icons/lib/md/camera-alt';
import IconNoti from 'react-icons/lib/md/notifications-active';
import Toggle from 'react-toggle'
import { withTranslation } from 'react-i18next';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider'
import { SliderRail, Handle, Track } from './SliderComponent'

const customStyles = {
  overlay : {
    overflowY           : 'scroll'
  }
};
const sliderStyle = {  // Give the slider some width
    position: 'relative',
    width: '80%',
    height: '15px',
    marginRight: '10%',
    marginTop: '25px',
}
const domain = [9, 40];
const defaultValues = [16];

class SettingModal extends React.Component {
  constructor() {
    super();

    this.state = {
      error: null,
      isParent: true,
      isLayout: false,
      isTranslate: false,
      isMessages: false,
      isNotifications: false,
      isBlocked: false,
      isHelp: false,
      isSendFeedback: false,
      values: defaultValues.slice(),
      update: defaultValues.slice(),
      language: 'en'
    };

    this.onClickBack = this.onClickBack.bind(this);
    this.onClickCheckboxChange = this.onClickCheckboxChange.bind(this);
    this.handleTofuChange = this.handleTofuChange.bind(this);
    this.handleAutoBroadcasting = this.handleAutoBroadcasting.bind(this);
    this.onClickRemoveBlockUser = this.onClickRemoveBlockUser.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.onCloseModal = this.onCloseModal.bind(this);
    
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }

  handleTofuChange() {
    this.props.onActionUpdateSetting("join_leave_message", '');
  }

  handleAutoBroadcasting() {
    this.props.onActionUpdateSetting("auto_broadcasting", '');
  }

  onClickCheckboxChange(event) {
      console.log(event);
    if(event == "new_message") {
        console.log("event new message sent");
        this.props.onActionUpdateSetting("sound_new_message", '');
    }else if(event == "poke") {
        this.props.onActionUpdateSetting("sound_poke", '');
    }else if(event == "broadcast_req") {
        this.props.onActionUpdateSetting("sound_view_broadcast_req", '');
    }
  }

  onClickRemoveBlockUser(username) {
      this.props.onActionUpdateSetting("remove_blocked_user", username);
  }

  onUpdate = update => {
    this.props.onActionUpdateSetting("font_size", update[0]);
    this.setState({ update })
  }

  onChange = values => {
    this.setState({ values })
  }

  onClickSetting(param) {
    switch(param) {
        case "profile":
            let url = "/profile";
            window.open(url,'_blank');
            break;
        case "message":
            this.setState({isParent: false, isMessages: true});
            break;
        case "translate":
            this.setState({isParent: false, isTranslate: true});
            break;
        case "notification":
            this.setState({isParent: false, isNotifications: true});
            break;
        case "block":
            this.setState({isParent: false, isBlocked: true});
            break;
        case "help":
            this.setState({isParent: false, isHelp: true});
            break;

    }
  }

  onClickBack() {
      this.setState({
        isParent: true,
        isLayout: false,
        isTranslate: false,
        isMessages: false,
        isNotifications: false,
        isBlocked: false,
        isHelp: false,
        isSendFeedback: false,
      });
  }

  handleOptionChange(e) {
    this.props.onActionUpdateSetting("language", e.target.value);
  }

  onCloseModal() {
    this.onClickBack();
    this.props.onRequestClose();
  }
  
  render() {
    const {
        state: { values, update },
      } = this
    return (
      <Modal
        className="setting-modal"
        isOpen={this.props.isOpen}
        onRequestClose={this.onCloseModal}
        style={customStyles}
      >
        {this.state.isParent && <div className="setting-parent d-flex f-direction-c">
            <div className="s-p-header d-flex f-direction-r md-t-10">
                <div className="f-auto"><span>{this.props.t('SettingModal.settings')}</span></div>
                <div className="md-close" style={{width:"30px"}}>
                    <IconClose className="icon close-modal" onClick={this.props.onRequestClose} size="24px" />
                </div>
            </div>
            <div className="s-p-body">
                {this.props.user.type != "guest" && <div className="s-p-row d-flex f-direction-r" onClick={() => this.onClickSetting("profile")}>
                    <div className="icon-area">
                        <IconProfile className="icon" size="24px" />
                    </div>
                    <div className="f-auto">
                        {this.props.t('SettingModal.my_profile')}
                    </div>
                </div>}
                {/* <div className="s-p-row d-flex f-direction-r" onClick={() => this.onClickSetting("translate")}>
                    <div className="icon-area">
                        <IconTranslate className="icon" size="24px" />
                    </div>
                    <div className="f-auto">
                        {this.props.t('SettingModal.languages')}
                    </div>
                    <div className="nav-area">
                        <IconNext className="icon" onClick={this.props.onRequestClose} size="24px" />
                    </div>
                </div> */}
                <div className="s-p-row d-flex f-direction-r" onClick={() => this.onClickSetting("message")}>
                    <div className="icon-area">
                        <IconMessage className="icon" size="24px" />
                    </div>
                    <div className="f-auto">
                        {this.props.t('SettingModal.messages')}
                    </div>
                    <div className="nav-area">
                        <IconNext className="icon" onClick={this.props.onRequestClose} size="24px" />
                    </div>
                </div>
                <div className="s-p-row d-flex f-direction-r" onClick={() => this.onClickSetting("notification")}>
                    <div className="icon-area">
                        <IconNoti className="icon" size="24px" />
                    </div>
                    <div className="f-auto">
                        {this.props.t('SettingModal.notifications')}
                    </div>
                    <div className="nav-area">
                        <IconNext className="icon" onClick={this.props.onRequestClose} size="24px" />
                    </div>
                </div>
                <div className="s-p-row d-flex f-direction-r disable">
                    <div className="icon-area">
                        <IconBroadcast className="icon" size="24px" />
                    </div>
                    <div className="f-auto">
                        {this.props.t('SettingModal.auto_broadcasting')}
                    </div>
                    <div className="nav-area">
                        <Toggle
                            defaultChecked={this.props.setting.auto_broadcasting}
                            icons={false}
                            onChange={this.handleAutoBroadcasting} />
                    </div>
                </div>
            </div>
        </div>}
        {this.state.isTranslate && <div className="setting-translate d-flex f-direction-c">
            <div className="s-header d-flex f-direction-r md-t-10">
                <div className="f-auto"><span>{this.props.t('SettingModal.languages')}</span></div>
                <div className="md-back" style={{width:"30px"}}>
                    <IconBack className="icon" onClick={this.onClickBack} size="24px" />
                </div>
            </div>
            <div className="s-body d-flex f-direction-c">
                <div className="s-body-r">
                    <div className="sounds-area d-flex f-direction-c">
                        <div className="s-sound-row d-flex f-direction-r md-t-10">
                            <div className="f-auto">
                                {this.props.t('SettingModal.english')}
                            </div>
                            <div className="nav-area">
                                <input type="radio" className="icon" name="language" value="en" checked={this.props.setting.language === "en"}  onChange={this.handleOptionChange} size="24px" />
                            </div>
                        </div>
                        <div className="s-sound-row d-flex f-direction-r md-t-10">
                            <div className="f-auto">
                                {this.props.t('SettingModal.hebrew')}   
                            </div>
                            <div className="nav-area">
                                <input type="radio" className="icon" name="language" value="iw" checked={this.props.setting.language === "iw"}  onChange={this.handleOptionChange} size="24px" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>}
        {this.state.isMessages && <div className="setting-message d-flex f-direction-c">
            <div className="s-header d-flex f-direction-r md-t-10">
                <div className="f-auto"><span>{this.props.t('SettingModal.messages')}</span></div>
                <div className="md-back" style={{width:"30px"}}>
                    <IconBack className="icon" onClick={this.onClickBack} size="24px" />
                </div>
            </div>
            <div className="s-body d-flex f-direction-c">
                <div className="s-body-r">{this.props.t('SettingModal.size_descr')}</div>
                <div className="s-body-r">
                    <div>{this.props.t('SettingModal.text_size')}</div>
                    <div className="slider">
                        <Slider
                            mode={1}
                            step={1}
                            domain={domain}
                            rootStyle={sliderStyle}
                            onUpdate={this.onUpdate}
                            onChange={this.onChange}
                            values={values}
                            >
                            <Rail>
                                {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
                            </Rail>
                            <Handles>
                                {({ handles, getHandleProps }) => (
                                <div className="slider-handles">
                                    {handles.map(handle => (
                                    <Handle
                                        key={handle.id}
                                        handle={handle}
                                        domain={domain}
                                        getHandleProps={getHandleProps}
                                    />
                                    ))}
                                </div>
                                )}
                            </Handles>
                            <Tracks right={false}>
                                {({ tracks, getTrackProps }) => (
                                <div className="slider-tracks">
                                    {tracks.map(({ id, source, target }) => (
                                    <Track
                                        key={id}
                                        source={source}
                                        target={target}
                                        getTrackProps={getTrackProps}
                                    />
                                    ))}
                                </div>
                                )}
                            </Tracks>
                        </Slider>
                    </div>
                </div>
            </div>
        </div>}
        {this.state.isNotifications && <div className="setting-notification d-flex f-direction-c">
            <div className="s-header d-flex f-direction-r md-t-10">
                <div className="f-auto"><span>{this.props.t('SettingModal.notifications')}</span></div>
                <div className="md-back" style={{width:"30px"}}>
                    <IconBack className="icon" onClick={this.onClickBack} size="24px" />
                </div>
            </div>
            <div className="s-body d-flex f-direction-c">
                <div className="s-body-r">
                    <div>{this.props.t('SettingModal.sounds')}</div>
                    <div className="sounds-area d-flex f-direction-c">
                        <div className="s-sound-row d-flex f-direction-r md-t-10">
                            <div className="f-auto">
                                {this.props.t('SettingModal.new_message')}
                            </div>
                            <div className="nav-area">
                                <input type="checkbox" className="icon" checked={this.props.setting.noti_sound_new_message} onChange={() => this.onClickCheckboxChange("new_message")} size="24px" />
                            </div>
                        </div>
                        <div className="s-sound-row d-flex f-direction-r md-t-10">
                            <div className="f-auto">
                                {this.props.t('SettingModal.poke')}
                            </div>
                            <div className="nav-area">
                                <input type="checkbox" className="icon" checked={this.props.setting.noti_sound_poke} onChange={() => this.onClickCheckboxChange("poke")} size="24px" />
                            </div>
                        </div>
                        <div className="s-sound-row d-flex f-direction-r md-t-10">
                            <div className="f-auto">
                                {this.props.t('SettingModal.view_broadcast_request')}
                            </div>
                            <div className="nav-area">
                                <input type="checkbox" className="icon" checked={this.props.setting.noti_sound_view_broadcast_req} onChange={() => this.onClickCheckboxChange("broadcast_req")} size="24px" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="s-body-r" style={{marginTop: "20px"}}></div>
                <div className="s-body-r">
                    <div className="sounds-area d-flex f-direction-r">
                        <div className="f-auto">
                            {this.props.t('SettingModal.join_leave_messages')}
                        </div>
                        <div className="nav-area">
                            <Toggle
                                defaultChecked={this.props.setting.noti_join_leave_message}
                                icons={false}
                                onChange={this.handleTofuChange} />
                        </div>
                    </div>
                </div>
                {/* <div className="s-body-r">
                    <div className="sounds-area d-flex f-direction-r">
                        <div className="f-auto">
                            {this.props.t('SettingModal.auto_broadcasting')}
                        </div>
                        <div className="nav-area">
                            <Toggle
                                defaultChecked={this.props.setting.auto_broadcasting}
                                icons={false}
                                onChange={this.handleAutoBroadcasting} />
                        </div>
                    </div>
                </div> */}
            </div>
        </div>}
        {this.state.isBlocked && <div className="setting-block d-flex f-direction-c">
            <div className="s-header d-flex f-direction-r md-t-10">
                <div className="f-auto"><span>{this.props.t('SettingModal.blocked')}</span></div>
                <div className="md-back" style={{width:"30px"}}>
                    <IconBack className="icon" onClick={this.onClickBack} size="24px" />
                </div>
            </div>
            <div className="s-body d-flex f-direction-c">
                <div className="s-body-r">
                    <div className="sounds-area d-flex f-direction-c">
                    {/* newUserRooms.push({ name: item.name, active: 0, missing_m_ct: item.missing_m_ct, block_users: item.block_users}); */}
                        {this.props.block_users.length > 0 && this.props.block_users.map( (username, key) => {
                            return (<div className="s-sound-row d-flex f-direction-r" key={key}>
                                        <div className="f-auto">
                                            {username}
                                        </div>
                                        <div className="nav-area">
                                            <button className="button-text" onClick={() => this.onClickRemoveBlockUser(username)} >{this.props.t('SettingModal.remove')}</button>
                                        </div>
                                    </div>);
                        })

                        }
                        
                    </div>
                </div>
                <div className="s-body-r">
                    <small>{this.props.t('SettingModal.blocked_descr')}Blocked guests will be removed from this list at the end of the current session.</small>
                </div>
            </div>
        </div>}
        
        
      </Modal>
    );
  }
}

SettingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
    user_id: PropTypes.number,
    name: PropTypes.string,
    gender: PropTypes.string,
    type: PropTypes.string,
    avatar: PropTypes.string,
    rooms: PropTypes.array,
  }).isRequired,
  block_users: PropTypes.array.isRequired,
  setting:PropTypes.object.isRequired,
  onActionUpdateSetting: PropTypes.func.isRequired,
  onRequestClose: PropTypes.func.isRequired,
};

export default withTranslation()(SettingModal);
