var pg = require('pg');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');

var register_register_app = express();
var server = http.createServer(register_app);

var port = 8081;

const limiter = rateLimit({
  windowsMS: 15 * 60 * 1000,
  max: 100
});

register_app.use(express.static(__dirname + './html/register_page.html'));
register_app.listen(port);
////specify why bodyParser is needed
register_app.use(bodyParser.urlencoded({extended: false}));
//specify why helmet is needed
register_app.use(helmet());
//specify why limiter is needed
register_app.use(limiter);

register_app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'./html/register_page.html'));
});

register_app.post('/add', function(req, res) {
  let db_request = require('./server/db_single_request.js');
  console.log(typeof db_request.request_db_post);

  const query_text = 'INSERT INTO accounts(id,pw) VALUES(?,?)';
  var query_values = [req.body.id, req.body.pw];

  db_request.request_db_post(query_text, query_values);
  console.log("user has been added");
  res.send("New user has been added into the database with ID = " +
  req.body.id + " and password = " + req.body.pw);
});
