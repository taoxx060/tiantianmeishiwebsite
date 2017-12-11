const express = require('express')
const app = express()

const bodyParser = require('body-parser');


var crypto = require('crypto');
var date = new Date();

var login = "WSP-TIANT-OiH9EgCeJA";
var transactionKey = "4clN6hgIsfVzwB9DnId6";
var sequence = "1513833273410678711";
var timeStamp = String(Math.floor(date.getTime()/1000));
var amount = String(0);
var currency = "USD";
var showForm = "PAYMENT_FORM";


var checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
var hmac = crypto.createHmac("md5", transactionKey);
var hash = hmac.update(checksum).digest("hex");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs')


app.get('/', function (req, res) {
  date = new Date();
  var timeStamp = String(Math.floor(date.getTime()/1000));
  hmac = crypto.createHmac("md5", transactionKey);
  checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
  console.log(checksum);
  hash = hmac.update(checksum).digest("hex");
  console.log(hash);
  res.render('index', {login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash});
})

app.get('/getHash', function (req, res) {
  amount = req.query.price;
  console.log(amount);
  date = new Date();
  var timeStamp = String(Math.floor(date.getTime()/1000));
  hmac = crypto.createHmac("md5", transactionKey);
  checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
  console.log(checksum);
  hash = hmac.update(checksum).digest("hex");
  console.log(hash);
  // res.send(JSON.stringify({ hash: hash }));
  res.send({login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash, showForm:showForm});

})

app.listen(443, function () {
  console.log('Example app listening on port 443!')
})
