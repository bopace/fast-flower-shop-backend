require('dotenv').load();
const mongoose = require('mongoose');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const Driver = require('./driver');
const Order = require('./order');
const Offer = require('./offer');
const Delivery = require('./delivery');
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.googleMapsApiKey,
  Promise: Promise
});

const API_PORT = 3331;
const app = express();
const router = express.Router();

const accountSid = process.env.twilioAccountSid;
const authToken = process.env.twilioAuthToken;
const twilioNumber = process.env.twilioNumber;
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

router.post("/deleteOffers", (req, res) => {
  const { orderId } = req.body;
  Offer.deleteMany({ orderId: orderId }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});



/*
 *
 * DB ACCESS
 *
 * deliverys
 *
 */

router.get('/getDelivery/:id', (req, res) => {
  const orderId = req.params.id
  Delivery.findOne({ orderId: orderId }, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.post("/deleteOffers", (req, res) => {
  const { orderId } = req.body;
  Offer.deleteMany({ orderId: orderId }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});


/*
*
*
* event handling
*
*/

getDeliveryTimeEstimate = (shopAddress, customerAddress) => {
  return googleMapsClient.distanceMatrix({
    origins: [shopAddress],
    destinations: [customerAddress],
  }).asPromise().then(response => {
    return Promise.resolve(response.json.rows[0].elements[0].duration.text)
  }).catch(err => {
    console.log('error', err)
  })
}

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
    delete event.attrs.offer._id
    Offer.findOneAndUpdate({ id: event.attrs.offer.id }, { $set: event.attrs.offer }, { upsert: true, new: true }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });

      if (event.attrs.offer.state === 'OFFER_PLACED') {
        twilioClient.messages
          .create({
            body: `A new delivery job is available from ${event.attrs.offer.shopName}! Text 'accept' or 'reject' to respond to the offer.`,
            from: twilioNumber,
            to: event.attrs.offer.driverCellNumber
          })
          .done();
        return res.json({ success: true });
      }

      if (event.attrs.offer.state === 'OFFER_REVOKED') {
        twilioClient.messages
          .create({
            body: 'Sorry, that offer is no longer available.',
            from: twilioNumber,
            to: event.attrs.offer.driverCellNumber
          })
          .done();
        return res.json({ success: true });
      }

      if (event.attrs.offer.state === 'OFFER_CONFIRMED') {
        twilioClient.messages
          .create({
            body: 'Congrats, you have been chosen for the job! We\'ll let you know when the order is ready for pickup.',
            from: twilioNumber,
            to: event.attrs.offer.driverCellNumber
          })
          .done();
        return res.json({ success: true });
      }
    })
  }

  if (event.domain === 'delivery') {
    delete event.attrs.delivery._id
    Delivery.findOneAndUpdate({ id: event.attrs.delivery.id }, { $set: event.attrs.delivery }, { upsert: true, new: true }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });

      if (event.attrs.delivery.state === 'DELIVERY_PREPARED') {
        twilioClient.messages
          .create({
            body: `The order is ready for pick up! Please head over to ${event.attrs.delivery.shopName}.`,
            from: twilioNumber,
            to: event.attrs.delivery.driverCellNumber
          })
          .done();
        return res.json({ success: true });
      }

      if (event.attrs.delivery.state === 'DELIVERY_PICKED_UP') {
        getDeliveryTimeEstimate(event.attrs.delivery.shopAddress, event.attrs.delivery.customerAddress).then(duration => {
          twilioClient.messages
            .create({
              body: `Your flower delivery is on its way! It should arrive in ${duration}`,
              from: twilioNumber,
              to: event.attrs.delivery.customerCellNumber
            })
            .done();
          return res.json({ success: true });
        })
      }

      if (event.attrs.delivery.state === 'DELIVERY_FIVE_MINUTES_AWAY') {
        twilioClient.messages
          .create({
            body: 'Your flower delivery is five minutes away!',
            from: twilioNumber,
            to: event.attrs.delivery.customerCellNumber
          })
          .done();
        return res.json({ success: true });
      }

      if (event.attrs.delivery.state === 'DELIVERY_ARRIVED') {
        twilioClient.messages
          .create({
            body: 'The delivery has arrived! Enjoy your flowers!',
            from: twilioNumber,
            to: event.attrs.delivery.customerCellNumber
          })
          .done();
        return res.json({ success: true });
      }

      if (event.attrs.delivery.state === 'DELIVERY_COMPLETED') {
        twilioClient.messages
          .create({
            body: 'Congratulations on the successful delivery!',
            from: twilioNumber,
            to: event.attrs.delivery.driverCellNumber
          })
          .done();
        return res.json({ success: true });
      }
    })
  }
});




/*
 *
 *
 * sms handling
 *
 */

router.post("/sms", (req, res) => {
  const messageBody = req.body.Body;

  const twiml = new MessagingResponse();

  if (messageBody === 'accept') {
    Offer.findOneAndUpdate({ driverCellNumber: req.body.From, state: 'OFFER_PLACED' }, { $set: { state: 'OFFER_ACCEPTED'} }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });
      twiml.message('Thanks! We\'ll let you know when the order is confirmed.');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    })
  }

  if (messageBody === 'reject') {
    Offer.findOneAndUpdate({ driverCellNumber: req.body.From, state: 'OFFER_PLACED' }, { $set: { state: 'OFFER_REJECTED'} }, (err, doc) => {
      if (err) return res.json({ success: false, error: err });
      twiml.message('Thanks for getting back to us. We\'ll let you know if another job comes up you might be interested in.')
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    })
  }
})



app.use("/api", router);

app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
