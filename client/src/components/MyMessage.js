import React from 'react';
import PropTypes from 'prop-types';
import JSEMOJI from 'emoji-js';
import renderHTML from 'react-render-html';
import IconImg from 'react-icons/lib/md/image';
var parseHTML = require('parsehtml');
const moment = require('moment');
var randomstring = require("randomstring");

// new instance
let jsemoji = new JSEMOJI();
jsemoji.img_set = 'emojione';
jsemoji.img_sets.emojione.path = '/dist/emoji-data/img-emojione-64/';

// for (var i in jsemoji.img_sets){
// 	jsemoji.img_sets[i].path = 'https://unicodey.com//js-emoji/build/emoji-data/img-'+i+'-64/';
//   jsemoji.img_sets[i].sheet = 'https://unicodey.com//js-emoji/build/emoji-data/sheet_'+i+'_64.png';
// }

jsemoji.use_sheet = true;
jsemoji.init_env();

class MyMessage extends React.Component {
  constructor() {
    super();

    this.urlify = this.urlify.bind(this);
    this.sanitarize = this.sanitarize.bind(this);
    this.convertHTML = this.convertHTML.bind(this);
  }
  urlify(text) {
    let urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
  }

  // 

  emojiConverter(text) {
    jsemoji.supports_css = false;
    jsemoji.allow_native = false;
    jsemoji.replace_mode = 'img';// 'unified';
    jsemoji.use_sheet = true;


    return jsemoji.replace_unified(text);
  }

  convertHTML(text) {
    // console.log(text) 
    text = text.split('\" />').join('\">')
    // console.log(text)
    let result = []
    var html = parseHTML(text)
    // console.log(text)
    // console.log(html)
    // console.log(html.length)
    if(html.children.length > 0) {
      for(let k = 0; k < html.children.length; k ++) {
        let temp = text.split(html.children[k].outerHTML)
        // console.log(text)
        // console.log(temp)
        let key = randomstring.generate(8)
        result.push(<span key={key}>{this.desanitarize(temp[0])}</span>)
        if (html.children[k].tagName == "IMG") {
          key = randomstring.generate(8)
          result.push(<img key={key} src={html.children[k].attributes[0].nodeValue} className={html.children[k].attributes[1].nodeValue} data-codepoints={html.children[k].attributes[2].nodeValue} />)
        }
        if ( html.children[k].tagName == "A" ) {
          key = randomstring.generate(8)
          let url = html.children[k].href
          let host = html.children[k].host
          result.push(<span key={key} className="url_underline" onClick={() => this.props.onActionOnMessage("show_link", url, host, 0)}>{url}</span>)
        }
        if (temp[1] !== undefined) {
          if(k == html.children.length){
            let key = randomstring.generate(8)
            result.push(<span key={key}>{this.desanitarize(temp[1])}</span>)
          }else{
            text = temp[1]
          }
        }
      }
    }else if(html.tagName !== undefined && html.tagName != ""){
      // only one tag
      let temp = text.split(html.outerHTML)
      // console.log(temp)
      let key = randomstring.generate(8)
      result.push(<span key={key}>{this.desanitarize(temp[0])}</span>)
      if (html.tagName == "IMG") {
        key = randomstring.generate(8)
        result.push(<img key={key} src={html.attributes[0].nodeValue} className={html.attributes[1].nodeValue} data-codepoints={html.attributes[2].nodeValue} />)
      }
      if ( html.tagName == "A" ) {
        key = randomstring.generate(8)
        let url = html.href
        let host = html.host
        // console.log(url)
        // console.log(host)
        result.push(<span key={key} className="url_underline" onClick={() => this.props.onActionOnMessage("show_link", url, host, 0)}>{url}</span>)
      }
      if (temp[1] !== undefined) {
        let key = randomstring.generate(8)
        // console.log(temp[1])
        // console.log(this.desanitarize(temp[1]))
        result.push(<span key={key}>{this.desanitarize(temp[1])}</span>)
      }
    }else {
      // only text
      let key = randomstring.generate(8)
      result.push(<span key={key}>{this.desanitarize(text)}</span>)
    }
    return result
  }

  sanitarize(string) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    const reg = /[&<>"']/ig;
    return string.replace(reg, match => (map[match]));
  }

  desanitarize(string) {
    string = string.replace(/&amp;/ig, '&')
    string = string.replace(/&lt;/ig, '<')
    string = string.replace(/&gt;/ig, '>')
    string = string.replace(/&quot;/ig, '"')
    string = string.replace(/&#x27;/ig, "'")
    return string
  }

  render() {
    const {message, font_size} = this.props;
    // console.log(message)

    if(message.message_type == "image") {
      return (
        <div className="message">
          <div className="message-content">
            <p className={`font-${message.color}`}>
              <span className="sender"><strong>{message.sender.name}</strong>:&nbsp;</span>
              <span className={`text size-${font_size}`}>
              { !message.is_check ? <a href="javascript:void(0)"><strong onClick={() => this.props.onActionOnMessage("show_image", message.sender.name, message.id, message.type)} style={{cursor:"pointer"}} >click to view</strong></a> :
                <img src={message.text} className="photo" />}
              </span>
              <span className="time">{moment(message.time).format('HH:mm')}</span>
            </p>
          </div>
        </div>
      );
    }else if(message.message_type == "bold"){
      return (
        <div className="message">
          <div className="message-content">
            <p className={`font-${message.color}`}>
              <span className="sender"><strong>{message.sender.name}:</strong>&nbsp;</span>
              <span className={`text size-${font_size}  ${message.message_type}`}> {this.convertHTML(this.emojiConverter(this.urlify(this.sanitarize(message.text))))}</span>
              <span className="time">{moment(message.time).format('HH:mm')}</span>
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="message">
        <div className="message-content">
        <p className={`font-${message.color}`}>
            <span className="sender"><strong>{message.sender.name}</strong>:&nbsp;</span>
            <span className={`text size-${font_size}`}>{this.convertHTML(this.emojiConverter(this.urlify(this.sanitarize(message.text))))}</span>
            <span className="time">{moment(message.time).format('HH:mm')}</span>
          </p>
        </div>
      </div>
    );
    
  }
}

MyMessage.propTypes = {
  message: PropTypes.shape({
    sender: PropTypes.shape.isRequired,
    text: PropTypes.string.isRequired,
    message_type: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    time: PropTypes.number.isRequired,
  }).isRequired,
  onActionOnMessage: PropTypes.func.isRequired,
  font_size: PropTypes.number.isRequired,
};

export default MyMessage;
