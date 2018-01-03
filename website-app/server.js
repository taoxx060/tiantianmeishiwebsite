const express = require('express')
const app = express()

const bodyParser = require('body-parser');


var crypto = require('crypto');
var date = new Date();

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

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'transactions',
  port: '3306'
});
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
  connection.query("CREATE SCHEMA IF NOT EXISTS transactions");
  connection.query("CREATE TABLE IF NOT EXISTS `transactions`.`orders` ( `id` INT(128) UNSIGNED NOT NULL AUTO_INCREMENT , \
    `pickupLocation` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `description`\
     VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
     `nickname` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , `phone` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
     `timestamp` VARCHAR(256) NOT NULL , `cardholderName` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , \
     `amount` FLOAT(32) UNSIGNED NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs')


app.get('/', function (req, res) {
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
  res.render('index', {login: login, sequence: sequence, timeStamp: timeStamp, amount:amount, currency: currency, hash:hash, date: date});
})

app.post('/transactions', function (req, res) {
  var dateString = new Date().toUTCString();

  console.log(req);
  if (req.body.x_response_code == '2') {
    res.render('retry');
  } else if (req.body.x_response_code == '1') {
    var description = req.body.x_description;
    var ship_to_address = req.body.x_ship_to_address;
    var cust_id = req.body.x_cust_id;
    var dollarAmount = req.body.DollarAmount;
    var phone = req.body.x_phone;
    var cardHolderName = req.body.CardHoldersName;
    // var note = req.body.x_note;


    connection.query("INSERT INTO orders (nickname, phone, description, cardHolderName, timestamp, pickupLocation, amount) VALUES ('"+ cust_id + "', '" + phone + "', '" + description + "', '" + cardHolderName + "', '" + dateString + "', '" + ship_to_address + "', '" + dollarAmount  + "');", function(err, rows, fields) {
    if (!err) {
      console.log('The solution is: ', rows);
    }
    else {
      console.log('Error while performing Query.', err);
    }
   });
   res.render('thankyou');
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
    
    // var rows1 = [];
    // var fields1 = [];
    connection.query('SELECT pickupLocation, description, nickname, phone, cardHolderName, amount FROM orders ORDER BY pickupLocation, description ASC;', function(err, rows, fields) {
      if (!err) {
         var rows1 = rows;
         var fields1 = fields;
         console.log(rows1);
         console.log(fields1);
         res.render('control', {rows1: rows, fields1:fields});
      }
      else {
        console.log('Error while performing Query 1.', err);
      }
     });

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

    // <!--              <article id="printOrderStat" class="printable-article">
    //             <h2 class="major">今日订单统计 For <% tomorrowDate %></h2>
    //             <section>
    //               <div class="printable-table-wrapper">
    //                 <table class="alt">
    //                   <thread>
    //                     <tr>
    //                         <% for(var k=0; k<fields2.length; k++) { %>
    //                         <td><%=fields2[k].name %></td>
    //                       <% } %>
    //                     </tr>
    //                   </thread>
    //                   <tbody>
    //                     <% for(var i=0; i<rows2.length; i++) { %>
    //                       <tr>
    //                         <% for(var j=0; j<fields2.length; j++) { %>
    //                         <td><%=rows2[i][fields2[j].name] %></td>
    //                       <% } %>
    //                     </tr>
    //                     <% } %>
    //                   </tbody>
    //                 </table>
    //               </div>
    //             </section>
    //           </article> -->
   
})

app.listen(443, function () {
  console.log('Example app listening on port 443!')
})
