require('dotenv').load();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const Shop = require('./shop');
const Order = require('./order');
const UserInfo = require('./userInfo')

const API_PORT = 3001;
const app = express();
const router = express.Router();

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

/*
 *
 * DB ACCESS
 *
 * user info
 *
 */

router.get("/addUserInfo", (req, res) => {
  let userInfo = new UserInfo();
  userInfo.name = 'bo';
  userInfo.address = 'asdf';
  userInfo.cellNumber = 'asdfiojsf';
  userInfo.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.get('/getUserInfo', (req, res) => {
  UserInfo.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.post("/updateUserInfo", (req, res) => {
  const { update } = req.body;
  UserInfo.findOneAndUpdate({}, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

/*
 *
 * DB ACCESS
 *
 * shops
 *
 */

router.get('/getShops', (req, res) => {
  Shop.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.delete("/deleteShop", (req, res) => {
  const { id } = req.body;
  Shop.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/addShop", (req, res) => {
  let shop = new Shop();

  const { name, url } = req.body;

  if (!name || !url) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  shop.name = name;
  shop.url = url;
  shop.save(err => {
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

app.use("/api", router);

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
