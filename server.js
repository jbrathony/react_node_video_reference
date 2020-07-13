// const http = require('http');
const https = require("https");
const fs = require("fs");
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
var Config = require('./server/config/config');
var fileUpload = require('express-fileupload')
var bodyParser = require('body-parser')

const options = {
  key: fs.readFileSync(Config.ssl_key),
  cert: fs.readFileSync(Config.ssl_cert)
 };

const app = express();
// const server = http.createServer(app);
const server = https.createServer(options, app);
const io = socketIO(server);
const publicPath = path.join(__dirname, 'client', 'public');
const port = process.env.PORT || Config.serverPort;


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static(publicPath));
app.use(fileUpload({limits: { fileSize: 50 * 1024 * 1024, preserveExtension: true }}));

const api = require('./server/routes/api');

app.use('/api', api);

io.on('connection', require('./server/socket/socket')(io));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

console.log('Listening port ' + port + ' ....');
server.listen(port);
