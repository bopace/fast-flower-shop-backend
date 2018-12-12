const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeliverySchema = new Schema(
  {
    id: String,
    state: String,
    shopName: String,
    shopAddress: String,
    orderId: String,
    driverName: String,
    driverCellNumber: String,
    customerCellNumber: String,
    customerAddress: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', DeliverySchema);
