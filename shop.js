const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShopSchema = new Schema(
  {
    id: Number,
    name: String,
    url: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shop', ShopSchema);
