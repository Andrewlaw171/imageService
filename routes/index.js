var express = require('express');
var router = express.Router();
var fs = require('fs')
var AdmZip = require('adm-zip')
var mime = require('mime')
var sizeOf = require('image-size');
var sharp = require('sharp')
var path = require('path')

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
  
  sizeOf(req.file.path, function (err, dimensions) {
    if (dimensions.width > 128 || dimensions.height > 128) {
      try {
          const th64 = './public/images/thumbs/'+'th64'+req.file.filename
          sharp(req.file.path, { failOnError: false })
            .resize({width: 64})
            .toFile(th64)

          const th32 = './public/images/thumbs/'+'th32'+req.file.filename
          sharp(req.file.path, { failOnError: false })
            .resize({width: 32})
            .toFile(th32)
          
          res.json([{ thumb64Url: 'http://localhost:3000/images/thumbs' + 'th64'+ req.file.filename },
                    { thumb32Url: 'http://localhost:3000/images/thumbs' + 'th32'+ req.file.filename },
                    { fileUrl: 'http://localhost:3000/images/' + req.file.filename }  ])
          
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error!');
      }
    } else {
      res.status(200);
      res.json({ fileUrl: 'http://localhost:3000/images/' + req.file.filename }); // localhost used as placeholder
    }
  });
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
      // If file with image filetype then extract and filepath to links
      if (filename.includes('.jpg') || filename.includes('.JPG') || filename.includes('.jpeg') || 
          filename.includes('.gif')|| filename.includes('.png')) {
          zip.extractEntryTo(zipEntry.entryName, 'public/images/', false, true);

          sizeOf('./public/images/'+zipEntry.entryName, function (err, dimensions) {
            if (dimensions.width > 128 || dimensions.height > 128) {
              try {
                  const th64 = './public/images/thumbs/'+'th64'+zipEntry.entryName
                  sharp('./public/images/'+ zipEntry.entryName, { failOnError: false })
                    .resize({width: 64})
                    .toFile(th64)
        
                  const th32 = './public/images/thumbs/'+'th32'+zipEntry.entryName
                  sharp('./public/images/'+ zipEntry.entryName, { failOnError: false })
                    .resize({width: 32})
                    .toFile(th32)

              } catch (err) {
                  console.error(err.message);
                  res.status(500).send('Server Error!');
              }
            }
          })

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
