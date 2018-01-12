const express = require('express')
const app = express()

const bodyParser = require('body-parser');


var crypto = require('crypto');
var date = new Date();

var dishes = require('./public/dish.json');
var starters = require('./public/starter.json');
var sides = require('./public/side.json');
var locations = require('./public/location.json');

var selectedDishes = {};
var selectedStarters = {};
var selectedSides = {};
var selectedLocations = {};

// Prod
// var login = "WSP-TIANT-OiH9EgCeJA";
// var transactionKey = "4clN6hgIsfVzwB9DnId6";
// var sequence = "1513833273410678711";


//Test
var login = "HCO-TIANT-309";
var transactionKey = "uso7FRIM7obGC0F2vaFO";
var sequence = "15148556663137086792";

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


function connectToDB (table_name) {
    connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
    connection.query("CREATE SCHEMA IF NOT EXISTS transactions");
    connection.query("CREATE TABLE IF NOT EXISTS `transactions`.`"+ table_name +"` ( `id` INT(128) UNSIGNED NOT NULL AUTO_INCREMENT , \
      `pickupLocation` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `dish`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `starter`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `note`\
       VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,\
       `nickname` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `phone` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
       `timestamp` VARCHAR(256) NOT NULL , `cardholderName` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
       `amount` FLOAT(32) UNSIGNED NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB");
  });
}

function getCurrentTableName() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
  var table_name = "orders " + tomorrowDate;
  return table_name;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs')


app.get('/', function (req, res) {
  var today_date = (new Date()).toString().split(' ').splice(1,3).join(' ');
  // if (current_table==null || start_date==null || start_date != today_date) {
  //   res.render('infoPage', {head:"截单啦！", body: "想加单请微信联系"});
  // }
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
  var date = new Date();
  var timeStamp = String(Math.floor(date.getTime()/1000));
  hmac = crypto.createHmac("md5", transactionKey);
  checksum = login + "^" + sequence + "^" + timeStamp + "^" + amount + "^" + currency;
  console.log(checksum);
  hash = hmac.update(checksum).digest("hex");
  console.log(hash);
  res.render('index', {login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash, date: date, dishes: dishes, starters: starters, sides: sides, locations: locations});
})

app.post('/transactions', function (req, res) {
  var dateString = new Date().toUTCString();

  console.log(req);
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


    connection.query("INSERT INTO " + current_table + " (nickname, phone, dish, starter, note, cardHolderName, timestamp, pickupLocation, amount) VALUES ('"+ cust_id + "', '" + phone + "', '" + dish + "', '" + starter + "', '" + note + "', '" + cardHolderName + "', '" + dateString + "', '" + ship_to_address + "', '" + dollarAmount  + "');", function(err, rows, fields) {
    if (!err) {
      console.log('The solution is: ', rows);
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

app.get('/control', function (req, res) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
    
    connection.query('SELECT pickupLocation, dish, starter, note, nickname, phone, cardHolderName, amount FROM ' + current_table + ' ORDER BY pickupLocation, dish, starter ASC;', function(err, rows, fields) {
      if (!err) {
         var rows1 = rows;
         var fields1 = fields;
         console.log(rows1);
         console.log(fields1);
         res.render('control', {rows1: rows, fields1:fields, tomorrowDate: tomorrowDate, dishes, dishes, starers: starters, sides: sides, locations:locations });
      }
      else {
        console.log('Error while performing Query 1.', err);
      }
     });
})

app.post('/setMenuForTomorrow', function (req, res) {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var tomorrowDate = (tomorrow).toString().split(' ').splice(1,3).join(' ');
  current_table = "orders " + tomorrowDate;
  connectToDB(current_table);


})

    // var rows2 = [];
    // var fields2 = [];
    // connection.query('SELECT description, count(description) FROM orders GROUP by description', function(err, rows, fields) {
    //   if (!err) {
    //      rows2 = rows;
    //      fields2 = fields;
    //               console.log(rows2);
    //      console.log(fields2);
    //   }
    //   else {
    //     console.log('Error while performing Query 2.', err);
    //   }
    // });
    // res.render('control', {rows1: rows1, fields1:fields1, rows2: rows2, fields2: fields2, tomorrowDate: tomorrowDate});
//             <!-- Select Starters -->
// <!--              <article id="printOrderStat" class="printable-article">
//                 <h2 class="major">今日订单统计 For <% tomorrowDate %></h2>
//                 <section>
//                   <div class="printable-table-wrapper">
//                     <table class="alt">
//                       <thread>
//                         <tr>
//                             <% for(var k=0; k<fields2.length; k++) { %>
//                             <td><%=fields2[k].name %></td>
//                           <% } %>
//                         </tr>
//                       </thread>
//                       <tbody>
//                         <% for(var i=0; i<rows2.length; i++) { %>
//                           <tr>
//                             <% for(var j=0; j<fields2.length; j++) { %>
//                             <td><%=rows2[i][fields2[j].name] %></td>
//                           <% } %>
//                         </tr>
//                         <% } %>
//                       </tbody>
//                     </table>
//                   </div>
//                 </section>
//               </article> -->
   


app.listen(443, function () {
  console.log('Example app listening on port 443!')
})
