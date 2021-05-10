var express = require('express');
var router = express.Router();
var fs = require('fs')
var AdmZip = require('adm-zip')
var mime = require('mime')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

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
      if (file.mimetype.split('/')[0] != 'image') {
        req.fileValidationError = 'Uploaded file is not an image';
        return cb(null, false, new Error('Uploaded file is not an image please try again'));
      }
      cb(null, true);
    }})

var uploadZip = multer({
  storage: storage,
  fileFilter (req, file, cb) {
    // If file is not a zip return fileValidation error
    if (file.mimetype != 'application/zip') {
      req.fileValidationError = 'Uploaded file is not a zip';
      return cb(null, false, new Error('Uploaded file is not a zip please try again'));
    }
    cb(null, true);
}})


// POST image to server
router.post('/upload/imageraw',upload.single('file'),function(req, res, next) {
  console.log(req.file);
  if(req.fileValidationError) {
    console.log("Non image file recieved")
    res.status(400);
    return res.end(req.fileValidationError);
  }
  if(!req.file) {
    res.status(500);
    return next;
  } else {
  res.status(200);
  res.json({ fileUrl: 'http://localhost:3000/images/' + req.file.filename }); // localhost used as placeholder
  }
})

// POST Zip to server
router.post('/upload/imagezip', uploadZip.single('file'), function (req, res) {
  console.log(req.file);
  if(req.fileValidationError) {
    console.log("Non zip file recieved")
    res.status(400)
    return res.end(req.fileValidationError);
  }
  if(!req.file) {
    res.status(500);
    return next;
  } else {
    var zip = new AdmZip(req.file.path);
    var links = []

    var zipEntries = zip.getEntries();
    zipEntries.forEach(function(zipEntry) {
    console.log(zipEntry.toString()); // outputs zip entries information
    const filename = zipEntry.entryName
      if (filename.includes('.jpg') || filename.includes('.JPG') || filename.includes('.jpeg') || 
          filename.includes('.gif')|| filename.includes('.png')) {
          zip.extractEntryTo(zipEntry.entryName, 'public/images/', false, true);
          links.push({fileUrl: 'http://localhost:3000/images/' + zipEntry.entryName})
      }
    });

    fs.unlinkSync(req.file.path);
    res.status(200);
    res.json(links);  
  }
});

// GET image from server
router.get('/')

module.exports = router;
