const mongoose = require('mongoose');
const gridfs = require('mongoose-gridfs');
const clamav = require('clamav.js');
const FileModel = require('./File')
const { PassThrough, Duplex } = require("stream");
const tunnel = new PassThrough();
let amount = 0;
tunnel.on("data", (chunk:any) => {
  amount += chunk.length;
  console.log("bytes:", amount);
});

try {
  mongoose.connect('mongodb://mongo:27017/files_db?authSource=admin', {
    // mongoose.connect('mongodb://mongo:27017/files_db?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
  }).then((connection: any) => {
    console.log(`Connected to Mongo database "${connection.connections[0].name}"`)
  });
} catch (e) {
  console.error(e);
}

clamav.ping(3310, 'clamav', 1000, function (err: any) {
  if (err) {
    console.log('127.0.0.1:3310 is not available[' + err + ']');
  }
  else {
    console.log('127.0.0.1:3310 is alive');
  }
});

FileModel.files.watch().on('change', (data: any) => {
  console.log("data received");
  console.log(data)
  if (data.operationType === "insert") {
    const Attachment = gridfs.createModel();
    const options = { filename: data.fullDocument.filename };
    const readStream = Attachment.read(options);
    clamav.ping(3310, 'clamav', 1000, function (err: any) {
      if (err) {
        console.log('clamav is not available[' + err + ']');
        FileModel.files.updateOne(
          { _id: data.fullDocument._id },
          {
            "metadata.status": "CLAMAV_NOT_AVAILABLE"
          },
          function (err: any, result: any) { }
        );
      }
      else {
        console.log('clamav is alive');
        clamav.createScanner(3310, 'clamav').scan(readStream, function (err: any, object: any, malicious: any) {
          if (err) {
            console.log("error")
            console.log(err);
          }
          else if (malicious) {
            console.log(malicious + ' FOUND');
            FileModel.files.updateOne(
              { _id: data.fullDocument._id },
              {
                "metadata.status": "MALICIOUS",
                $push: {
                  "metadata.accessHistory": {
                    Type: "scan",
                    Date: new Date,
                    Protocol: "http",
                    Info: malicious
                  }
                }
              },
              function (err: any, result: any) { }
            );
          }
          else {
            console.log('OK');
            FileModel.files.updateOne(
              { _id: data.fullDocument._id },
              {
                "metadata.status": "COMPLETE",
                $push: {
                  "metadata.accessHistory": {
                    Type: "scan",
                    Date: new Date,
                    Protocol: "http",
                    Info: "ok"
                  }
                }
              },
              function (err: any, result: any) { }
            );
          }
        });
      }
    });
  }

});