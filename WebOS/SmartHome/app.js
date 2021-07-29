var pg = require('pg');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');

let db_request = require('./db/db_single_request.js');

/*
  Run this on the server-side
 */

var app = express();

var port = 8081; //port for local host connection

//limits the
const limiter = rateLimit({
  windowsMS: 15 * 60 * 1000,
  max: 100
});

app.use(express.static(path.join(__dirname, './web_source')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());
app.use(limiter);

app.listen(port);
console.log('server on ' + port);


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
});

app.get('/login_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
});

app.get('/register_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/register_page.html'));
});

app.get('/main_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
});

app.post('/add_account', function(req, res) {

  var query_values = [req.body.id, req.body.pw];
  var result;
  if (query_values[0] === undefined
     || query_values[1] === undefined ) {
    console.log("Undefined");
  } else {
    register_account(query_values, res); //pending result
  }
});

async function check_web_session() {

}

async function register_account(query_values, res) {
  //check if data exists
  //!injection attack prone code! must paramatize the value!
  var select_query = "SELECT EXISTS (SELECT * FROM accounts WHERE id='" +
  query_values[0] +"');";

  account_exists = await db_request.db_select(select_query, query_values);

  var result = await insert_account(account_exists, query_values);

  if (result === true) {
    //show account exists pop up
    res.send("Account already exists");
  } else {
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  }
}

async function insert_account(account_exists, query_values) {
  //if data does not exist, insert
  if (account_exists === false) {
    var insert_query = 'INSERT INTO accounts(id,pw) VALUES($1,$2) RETURNING *;';
    await db_request.db_insert(insert_query, query_values);
    return true;
  } else {
    console.log("Account exists");
    //alert user that user already exists
    return false;
  }
}
async function user_login() {

}
