const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    id: String,
    state: String,
    items: Array,
    specialInstructions: String,
    shopId: String,
    shopName: String,
    shopUrl: String,
    userInfo: Object,
    userEventsUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
