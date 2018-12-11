const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OfferSchema = new Schema(
  {
    id: String,
    state: String,
    shopName: String,
    shopAddress: String,
    orderId: String,
    driverName: String,
    driverCellNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', OfferSchema);
