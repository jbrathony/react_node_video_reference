const db = require('../config/database');
const moment = require('moment');

class Settings {
  constructor() {
    this.settings = {};
    var that = this;
    var sql = 'SELECT a.* FROM _settings a';
    db.query( sql, function(err, data) {
      if (err) {
        return reject(err);
      }else{
        that.settings =data[0];
      }
    })

  }

  getSettings() {
    return this.settings;
  }

  updateLanguage(sel_lang) {
    this.settings.language = sel_lang;
  }

  updateGuestPrivate(sel_private) {
    this.settings.guest_private = parseInt(sel_private);
  }

  updateGuestBroadcast(sel_broadcast) {
    this.settings.guest_broadcast = parseInt(sel_broadcast);
  }

  updateMaxMessageSize(sel_max_message_size) {
    this.settings.max_message_size = parseInt(sel_max_message_size);
  }

  updateMessageTimeInterval(sel_message_time_interval) {
    this.settings.message_time_interval = parseInt(sel_message_time_interval);
  }
  
}

module.exports = { Settings };
