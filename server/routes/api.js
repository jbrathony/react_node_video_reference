const multer = require('multer');
var express = require('express');
var router = express.Router();
var roomController = require('../controllers/room');
var userController = require('../controllers/user');
var messageController = require('../controllers/message');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './client/public/img/avatars');
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + file.originalname);
    },
  });
  
  const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  };
  
  const upload = multer({
    storage,
    limits: {
      fileSize: 1024 * 1024 * 25,
    },
    fileFilter,
  });
    
  router.post('/avatar', upload.single('avatar'), (req, res) => {
    users.updateAvatar(req.body.id, req.file.filename);
  
    res.send(req.file);
  });
  router.get('/test', (req, res) => {
    console.log("here  is :: test route.")
    res.send("test");
  });
  router.post('/create_temp_room', roomController.create_temp_room);
  router.post('/update_room', roomController.update_room);
  router.get('/get_rooms', roomController.get_rooms);
  router.post('/getUser', userController.getUser);
  router.post('/myProfile', userController.myProfile);
  router.post('/room_setting', roomController.setting);
  router.post('/file_upload', messageController.upload_image);
  // router.post('/file_upload', (req, res) => {
  //   console.log("here  is :: test route.")
  //   res.send("test");
  // });

module.exports = router;