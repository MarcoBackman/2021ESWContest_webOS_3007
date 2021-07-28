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

app.post('/add_account', function(req, res) {

  var query_values = [req.body.id, req.body.pw];

  if (query_values[0] === undefined
     || query_values[1] === undefined ) {
    console.log("Undefined");
  } else {

  }
});

async function register_account(query_values) {

  //check if data exists
  var select_query = 'SELECT * FROM accounts WHERE id=($1);';
  await db_request.db_select(query_text, query_values);

  //if data does not exist, insert
  var insert_query = 'INSERT INTO accounts(id,pw) VALUES($1,$2) RETURNING *;';
  await db_request.db_insert(query_text, query_values);
}
