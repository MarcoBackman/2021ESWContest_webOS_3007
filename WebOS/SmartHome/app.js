const alert = require('alert');
const pg = require('pg');
const fs = require('fs');
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ejs = require('ejs');
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
let db_query = require('./db/db_single_request.js');
const token_config = require("./db/auth_config.js");
const local_auth = require("./models/local_auth.js");

/*
  Run this on the server-side
*/

//limits the
const limiter = rateLimit({
 windowsMS: 15 * 60 * 1000,
 max: 100
});


var port = 8081;//port for local host connection
var cors_setting = {
 origin: "http://localhost:8081"
}

var app = express();

app.use("/scripts", express.static('./scripts/'));
app.use(express.static(path.join(__dirname, './web_source')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());
app.use(cors(cors_setting));
app.use(limiter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

app.engine('html', ejs.renderFile);

//root page
app.get('/', function(req, res) {
  //check if user is logged in
  var logged_in = authenticate_token(res);
  //if not send default page
  console.log(logged_in);
  if (logged_in === true) {
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
  }
});

app.get('/main_page.html', function(req, res) {
  var logged_in = authenticate_token(res);
  console.log(logged_in);
  //if not send default page
  if (logged_in === true) {
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
  }
});

app.get('/login_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
});

app.get('/register_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/register_page.html'));
});

app.get('/room_page.html', block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/room_page.html'));
});

app.get('/car_page.html', block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/car_page.html'));
});

app.get('/finance_page.html', block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/finance_page.html'));
});

app.get('/power_page.html', block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/power_page.html'));
});

app.get('/my_page', block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./'));
});

app.post('/logout', function(req, res) {
  console.log("in");
  local_auth.token = "-";
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
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
    login_wait(input_values, req, res);
  }
});

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

async function login_wait(input_values, req, res) {
  var result = await login_account(input_values);
  if (result === true) {
    //login success
    alert("Hello!" + input_values[0]);
    local_auth.id = input_values[0];
    local_auth.role = "user";
    local_auth.token = generate_token(input_values[0]);
    //redirect to the main page
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    //login failed - alert user
    alert("User not found");
    //give empty the input field

    res.status(200).send({
      accessToken: null
    });
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

/*
 ***********************************************
 *                 JWT methods                 *
 ***********************************************
 */

function generate_token(user_id) {
  var token = jwt.sign({name:user_id.toString()}, token_config.secret, {
    expiresIn: 1800
  }); // 30 minutes
  return token;
}

function authenticate_token(res) {
  var token = local_auth.token;

  if (token == null || token == '-') {
    console.log("Null Token");
    return false;
  }

  jwt.verify(token, token_config.secret, (err, user) => {
    if (err) {
      console.log("Error?:" + err);
      res.sendStatus(403);
    }
  });
  return true;
}

function block_access(req, res, next) {
  var token = local_auth.token;

  if (token == null || token == '-') {
    console.log("No Token");
    //login required
    res.sendStatus(403);
  }

  jwt.verify(token, token_config.secret, (err, user) => {
    if (err) { //invalid token
      res.sendStatus(403);
    }
    req.user = user;

    next();
  });
}
