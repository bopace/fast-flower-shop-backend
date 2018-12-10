const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserInfoSchema = new Schema(
  {
    name: String,
    address: String,
    cellNumber: String,
    eventConsumer: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserInfo', UserInfoSchema);
