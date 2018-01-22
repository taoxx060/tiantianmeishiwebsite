const express = require('express')
const app = express()

const bodyParser = require('body-parser');
const fs = require('fs');

var crypto = require('crypto');
var date = new Date();

var dishes = require('./public/dish.json');
var starters = require('./public/starter.json');
var sides = require('./public/side.json');
var locations = require('./public/location.json');

var selectedDishes = require('./public/selectedDishes.json');
var selectedStarters =  require('./public/selectedStarters.json');
var selectedSides = require('./public/selectedSides.json');
var selectedLocations = {};

// Prod
var login = "WSP-TIANT-OiH9EgCeJA";
var transactionKey = "4clN6hgIsfVzwB9DnId6";
var sequence = "1513833273410678711";


//Test
// var login = "HCO-TIANT-309";
// var transactionKey = "uso7FRIM7obGC0F2vaFO";
// var sequence = "15148556663137086792";

var timeStamp = String(Math.floor(date.getTime()/1000));
var amount = String(0);
var currency = "USD";
var showForm = "PAYMENT_FORM";


var checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
var hmac = crypto.createHmac("md5", transactionKey);
var hash = hmac.update(checksum).digest("hex");

var current_table = null;
var start_date = null;

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'transactions',
  port: '3306'
});


function connectToDB () {
    connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
  });
}

function createTable(table_name) {
    connection.query("CREATE SCHEMA IF NOT EXISTS transactions");
    connection.query("CREATE TABLE IF NOT EXISTS `transactions`.`"+ table_name +"` ( `id` INT(128) UNSIGNED NOT NULL AUTO_INCREMENT , \
      `pickupLocation` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `dish`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `starter`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `note`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,\
       `nickname` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `phone` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
       `timestamp` VARCHAR(256) NOT NULL , `cardholderName` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
       `amount` FLOAT(32) UNSIGNED NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB");
}

function updateTableAndTableName() {
  var new_table_name = getCurrentTableName();
  if (current_table != new_table_name) {
    current_table = new_table_name;
    createTable(current_table);
  }
}

function getCurrentTableName() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ').replace(/\W+/g, '_');
  var table_name = "orders_" + tomorrowDate;
  return table_name;
}

function ifNotInBusinessHour() {
  var today = new Date().getHours();
  if (today >= 0 && today <= 24) {
    return false;
  } else {
    return true;
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs')


app.get('/', function (req, res) {
  var today_date = (new Date()).toString().split(' ').splice(1,3).join(' ');
  if (ifNotInBusinessHour()) {
    res.render('infoPage', {head:"截单啦！", body: "想加单请微信联系"});
  }
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
  var date = new Date();
  var timeStamp = String(Math.floor(date.getTime()/1000));
  hmac = crypto.createHmac("md5", transactionKey);
  checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
  hash = hmac.update(checksum).digest("hex");
  res.render('index', {login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash, date: date, dishes: selectedDishes, starters: starters, sides: sides, locations: locations});
})

app.post('/transactions', function (req, res) {
  var today_date = (new Date()).toString().split(' ').splice(1,3).join(' ');
  if (req.body.x_response_code == '2') {
    res.render('infoPage', {head:'付款失败', body: '此次操作不会收取任何费用 请重试或联系我们'});
  } else if (req.body.x_response_code == '1') {
    var note = req.body.x_description;
    var ship_to_address = req.body.x_ship_to_address;
    var cust_id = req.body.x_cust_id;
    var dollarAmount = req.body.DollarAmount;
    var phone = req.body.x_phone;
    var cardHolderName = req.body.CardHoldersName;
    var dish = req.body.x_ship_to_first_name;
    var starter = req.body.x_ship_to_last_name;
    updateTableAndTableName();

    connection.query("INSERT INTO " + current_table + " (nickname, phone, dish, starter, note, cardHolderName, timestamp, pickupLocation, amount) VALUES ('"+ cust_id + "', '" + phone + "', '" + dish + "', '" + starter + "', '" + note + "', '" + cardHolderName + "', '" + today_date + "', '" + ship_to_address + "', '" + dollarAmount  + "');", function(err, rows, fields) {
    if (!err) {
      fs.appendFile('./public/logs/' + today_date, cust_id + "', '" + phone + "', '" + dish + "', '" + starter + "', '" + note + "', '" + cardHolderName + "', '" + today_date + "', '" + ship_to_address + "', '" + dollarAmount + "\n", 'utf8',  function(err) {
        if (err) throw err;
      });
    }
    else {
      console.log('Error while performing Query.', err);
    }
   });
   res.render('infoPage', {head:'感谢订餐', body:'送餐前会在微信群内通知 请准时取餐'});
  }

})

app.get('/getHash', function (req, res) {
  amount = req.query.price;
  date = new Date();
  var timeStamp = String(Math.floor(date.getTime()/1000));
  hmac = crypto.createHmac("md5", transactionKey);
  checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
  hash = hmac.update(checksum).digest("hex");
  res.send({login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash, showForm:showForm});

})

app.get('/control', function (req, res) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
    updateTableAndTableName();
    
    connection.query('SELECT pickupLocation, dish, starter, note, nickname, phone, cardHolderName, amount FROM ' + current_table + ' ORDER BY pickupLocation, dish, starter ASC;', function(err, rows, fields) {
      if (!err) {
         var rows1 = rows;
         var fields1 = fields;
         res.render('control', {rows1: rows, fields1:fields, tomorrowDate: tomorrowDate, dishes, selectedDishes, starters: starters, sides: sides, locations:locations });
      }
      else {
        console.log('Error while performing Query 1.', err);
      }
     });
})

app.post('/updateMenu', function (req, res) {
  selectedDishes = {};
  selectedStarters = {};
  selectedSides = {};

  for (var foodName in req.body) {
    if (foodName in dishes) {
      selectedDishes[foodName] = dishes[foodName];
    } else if (foodName in starters){
      selectedStarters[foodName] = starters[foodName];
    } else if (foodName in sides){
      selectedSides[foodName] = sides[foodName];
    }
  }

  fs.writeFile('./public/selectedDishes.json', JSON.stringify(selectedDishes), 'utf8',  function(err) {
    if (err) throw err;
  });
  fs.writeFile('./public/selectedStarters.json', JSON.stringify(selectedStarters), 'utf8',  function(err) {
    if (err) throw err;
  });
  fs.writeFile('./public/selectedSides.json', JSON.stringify(selectedSides), 'utf8',  function(err) {
    if (err) throw err;
  });
  res.render('infoPage', {head:'更新成功', body:'请回到主页检查'});
})


app.listen(443, function () {
  console.log('Example app listening on port 443!')
})
