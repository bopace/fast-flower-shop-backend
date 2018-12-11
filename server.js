require('dotenv').load();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const twilio = require('twilio');
const Driver = require('./driver');
const Order = require('./order');
const Offer = require('./offer');

const API_PORT = 3331;
const app = express();
const router = express.Router();

const accountSid = process.env.twilioAccountSid;
const authToken = process.env.twilioAuthToken;
const twilioClient = new twilio(accountSid, authToken);

const dbRoute = process.env.mongoUri;

mongoose.connect(
  dbRoute,
  { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());
app.options('*', cors());

/*
 *
 * DB ACCESS
 *
 * drivers
 *
 */

router.get('/getDrivers', (req, res) => {
  Driver.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.delete("/deleteDriver", (req, res) => {
  const { id } = req.body;
  Driver.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/addDriver", (req, res) => {
  let driver = new Driver();

  const { name, cellNumber } = req.body;

  if (!name || !cellNumber) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  driver.name = name;
  driver.cellNumber = cellNumber;
  driver.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});


/*
 *
 * DB ACCESS
 *
 * orders
 *
 */

router.get('/getOrders', (req, res) => {
  Order.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.delete("/deleteOrder", (req, res) => {
  const { id } = req.body;
  Shop.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/addOrder", (req, res) => {
  let order = new Order();

  const {
    id, state, items, specialInstructions,
    shopId, shopName, shopUrl
  } = req.body.order;

  order.id = id;
  order.state = state;
  order.items = items;
  order.specialInstructions = specialInstructions;
  order.shopId = shopId;
  order.shopName = shopName;
  order.shopUrl = shopUrl;

  order.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/updateOrder", (req, res) => {
  const { id, update } = req.body;
  Order.findOneAndUpdate({id: id}, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});



/*
 *
 * DB ACCESS
 *
 * offers
 *
 */

router.get('/getOffers/:id', (req, res) => {
  const orderId = req.params.id
  Offer.find({ orderId: orderId }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});



/*
 *
 *
 * event handling
 *
 */

router.post("/events", (req, res) => {
  const { event } = req.body;

  if (event.domain === 'order') {
    delete event.attrs.order._id
    Order.findOneAndUpdate({ id: event.attrs.order.id }, { $set: event.attrs.order }, { upsert: true, new: true }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    })
  }

  if (event.domain === 'offer') {
    // offer placed
    // send text to driver

    // offer revoked
    // send text to driver

    // offer confirmed
    // send text to driver

    delete event.attrs.offer._id
    Offer.findOneAndUpdate({ id: event.attrs.offer.id }, { $set: event.attrs.offer }, { upsert: true, new: true }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    })
  }

  if (event.domain === 'delivery') {
    // logic goes here

    // delivery prepared
    // send a text to driver

    // delivery picked up
    // send a text to customer

    // delivery 5 minutes away
    // send a text to customer
  }
});

app.use("/api", router);

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
