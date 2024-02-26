import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const nameValidator = {
  validator: function (v: string) {
    return !v.includes('/')
  },
  message: 'filename must not include a slash'
}

const fileSchema = new Schema({
  filename: {
    type: String,
    required: true,
    validate: nameValidator
  },
  contentType: { type: String },
  length: { type: Number },
  chunkSize: { type: Number },
  uploadDate: { type: Date },
  metadata: {
    accessHistory: {
      type: [{
        Type: { type: String },
        Date: { type: Date },
        Protocol: { type: String },
        SourceIP: { type: String },
        Info: { type: String },
      }]
    },
    status: { type: String },
    parent_id: { type: String },
    fullpath: [{ type: String, }],
    unique: { type: String, unique: true, required: true },
  },
});

const chunkSchema = new Schema({
  files_id: { type: Types.ObjectId },
  n: { type: Number },
});

const DirSchema = new Schema({
  dirname: {
    type: String,
    required: true,
    validate: nameValidator
  },
  uploadDate: { type: Date },
  parent_id: { type: String },
  fullpath: [{ type: String }],
  unique: { type: String, unique: true, required: true },
});

export default {
  files: mongoose.model('fs.files', fileSchema),
  chunks: mongoose.model('fs.chunks', chunkSchema),
  dirs: mongoose.model('fs.dirs', DirSchema),
}