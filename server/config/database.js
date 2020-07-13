var config = require('../config/config')
var mysql = require('mysql');

// db connect
var con = mysql.createConnection({
    host: config.db_host,
    user: config.db_user,
    password: config.db_pass,
    database: config.db_name,
    charset: 'utf8mb4'
});

con.connect(function(err) {
    if (err) throw err;
});

module.exports = con;