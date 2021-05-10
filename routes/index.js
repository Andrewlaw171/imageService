var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

var multer  = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './public/images');
    },
    filename: (req, file, cb) => {
      console.log(file);
      cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage,
    fileFilter (req, file, cb) {
      // If file is not an image return fileValidation error
      console.log(file.mimetype.split('/')[0])
      if (file.mimetype.split('/')[0] != 'image') {
        req.fileValidationError = 'Uploaded file is not an image';
        return cb(null, false, new Error('Uploaded file is not an image please try again'));
      }
      cb(null, true);
    }});

// POST image to server
router.post('/upload',upload.single('file'),function(req, res, next) {
  console.log(req.file);
  if(req.fileValidationError) {
    console.log("Non image file recieved")
    return res.end(req.fileValidationError);
  }
  if(!req.file) {
    res.status(500);
    return next;
  } else {
  res.status(200)
  res.json({ fileUrl: 'http://localhost:3000/images/' + req.file.filename }); // localhost used as placeholder
  }
})

// GET image from server
router.get('/')
