import mongoose from 'mongoose'
import { createModel } from '@procube/mongoose-gridfs';
import clamav from 'clamav.js'
import FileModel from './File.js'

const url = process.env.DATABASE_URL ? process.env.DATABASE_URL : "mongodb://localhost:27017/files_db"

const clamavContainerName = process.env.CLAMAV_CONTAINER_NAME ? process.env.CLAMAV_CONTAINER_NAME : "clamav"
const clamavContainerPort = process.env.CLAMAV_CONTAINER_PORT ? Number(process.env.CLAMAV_CONTAINER_PORT) : 3310

try {
  mongoose.connect(url, {
    user: process.env.MONGO_INITDB_ROOT_USERNAME,
    pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
  }).then((connection: any) => {
    console.log(`Connected to Mongo database "${connection.connections[0].name}"`)
  });
} catch (e) {
  console.error(e);
}

clamav.ping(clamavContainerPort, clamavContainerName, 1000, function (err: any) {
  if (err) {
    console.log(`${clamavContainerName}:${clamavContainerPort} is not available[${err}]`);
  }
  else {
    console.log(`${clamavContainerName}:${clamavContainerPort} is alive`);
  }
});

FileModel.files.watch().on('change', (data: any) => {
  console.log("data received");
  console.log(data)
  if (data.operationType === "insert") {
    const Attachment = createModel();
    const options = { _id: data.fullDocument._id };
    const readStream = Attachment.read(options);
    clamav.ping(clamavContainerPort, clamavContainerName, 1000, function (err: any) {
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
        clamav.createScanner(clamavContainerPort, clamavContainerName).scan(readStream, function (err: any, object: any, malicious: any) {
          if (err) {
            console.log("error")
            console.log(err);
          }
          else if (malicious) {
            console.log(malicious + ' FOUND');
            FileModel.files.findOneAndUpdate(
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
              }
            );
          }
          else {
            FileModel.files.findOneAndUpdate(
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
              }
            );
          }
        });
      }
    });
  }

});