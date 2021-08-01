var alert = require('alert');
var pg = require('pg');
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var ejs = require('ejs');
let db_query = require('./db/db_single_request.js');

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

app.use("/scripts", express.static('./scripts/'));
app.use(express.static(path.join(__dirname, './web_source')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());
app.use(limiter);
app.listen(port);

app.engine('html', ejs.renderFile);

//root page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  //res.send(browserRefresh('./web_source/html/main_page.html'))
});

app.get('/main_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
});

app.get('/login_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
});

app.get('/register_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/register_page.html'));
});

app.get('/room_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/room_page.html'));
});

app.get('/car_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/car_page.html'));
});

app.get('/finance_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/finance_page.html'));
});

app.get('/power_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/power_page.html'));
});

app.post('/add_account', function(req, res) {
  var input_values = [req.body.id, req.body.pw];
  if (input_values[0] === undefined
     || input_values[1] === undefined ) {
    //prompt user to enter id or pw
  } else {
    register_wait(input_values, res);
  }
});

app.post('/user_login', function(req, res) {
  console.log("Post request called");
  var input_values = [req.body.user_id, req.body.user_pw];
  console.log(input_values);
  var result;
  if (input_values[0] === undefined
     || input_values[1] === undefined ) {
  } else {
    //find user
    login_wait(input_values, res);
  }
});

async function check_web_session() {

}

// returns true if id exists
async function check_account(input_values) {
  //!injection attack prone code! must paramatize the value!
  var select_query = "SELECT EXISTS (SELECT * FROM accounts WHERE id='" +
  input_values[0] +"');";

  var account_exists = await db_query.db_request(select_query, input_values);
  return account_exists;
}

async function insert_account(input_values) {
  //if data does not exist, insert
    var insert_query = 'INSERT INTO accounts(id,pw) VALUES($1,$2) RETURNING *;';
    var result = await db_query.db_insert(insert_query, input_values);
    return result;
}

async function login_account(input_values) {
  //check if data exists
  //!injection attack prone code! must paramatize the value!
  var id_select_query = "SELECT EXISTS (SELECT * FROM accounts WHERE id='" +
  input_values[0] +"');";

  var pw_select_query = "SELECT EXISTS (SELECT * FROM accounts WHERE pw='" +
  input_values[1] +"');";

  var id_exists = await db_query.db_request(id_select_query, input_values);
  var pw_exists = await db_query.db_request(pw_select_query, input_values);

  if (!id_exists || !pw_exists) {
    return false;
  } else {
    return true;
  }
}

async function login_wait(input_values, res) {
  var result = await login_account(input_values);
  if (result === true) {
    //login success
    alert("Hello!" + input_values[0]);
    //give user grant

    //redirect to the main page
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    //login failed - alert user
    alert("User not found");
    //give empty the input field

    //res.send();
  }
}

async function register_wait(input_values, res) {
  var result = await check_account(input_values); //pending result

  if (result === true) { //account exists
    //prompt user that id has already taken
    alert("Already registered");
    res.sendFile(path.join(__dirname,'./web_source/html/register_page.html'));
  } else {  //account does not exists
    insert_account(input_values);
    alert("Newly added");
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  }
}
