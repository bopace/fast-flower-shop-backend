const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DeliverySchema = new Schema(
  {
    customerAddress: String,
    customerCellNumber: String,
    customerConfirmedDelivery: Boolean,
    driverCellNumber: String,
    driverConfirmedDelviery: Boolean,
    driverName: String,
    id: String,
    orderId: String,
    shopAddress: String,
    shopName: String,
    state: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', DeliverySchema);
