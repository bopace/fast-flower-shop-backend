const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DriverSchema = new Schema(
  {
    id: Number,
    name: String,
    cellNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', DriverSchema);
