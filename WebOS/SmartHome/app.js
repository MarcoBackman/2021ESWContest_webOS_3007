const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ejs = require('ejs');
const cors = require("cors");
//const react = require('react');

//local model temp file
const local_auth = require("./models/local_auth.js");

//local nodejs functions
const local_node_main = require("./server_nodejs/main_page.js");
const local_node_login = require("./server_nodejs/login.js");
const local_node_reg = require("./server_nodejs/register.js");
const local_node_db_comm = require("./server_nodejs/db_comm.js");
const local_node_car = require("./server_nodejs/car_page.js");
const local_node_jwt = require("./middleware/jwtAuth.js");

//limits the
const limiter = rateLimit({
 windowsMS: 15 * 60 * 1000,
 max: 100
});

var cors_setting = {
 origin: "http://localhost:8081"
}

var app = express();

//Apply express on different source paths
app.use(express.static('web_source'));
app.use(express.static('server_nodejs'));
app.use(express.static('middleware'));

app.use("/scripts", express.static('./scripts/'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());
app.use(cors(cors_setting));
app.use(limiter);

app.set('view engine', 'ejs');

var port = 8081; //port for local host connection
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

/*
 ***********************************************
 *                  GET  REQUEST               *
 ***********************************************
 */

//root page
app.get('/', function(req, res) {
  //check if user is logged in
  var logged_in = local_node_jwt.authenticate_token(res);
  //if not send default page
  if (logged_in === true) {
    console.log(logged_in);
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    console.log("Expired AWT Token");
    res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
  }
});

//main page
app.get('/main_page.html', local_node_jwt.block_access, function(req, res) {
  var logged_in = local_node_jwt.authenticate_token(res);
  console.log(logged_in);
  //if not send default page
  if (logged_in === true) {
    res.sendFile(path.join(__dirname,'./web_source/html/main_page.html'));
  } else {
    console.log("Expired AWT Token");
    res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
  }
});

//login page
app.get('/login_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
});

//register page
app.get('/register_page.html', function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/register_page.html'));
});

//room page
app.get('/room_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/room_page.html'));
});

//car page
app.get('/car_page', local_node_jwt.block_access, function(req, res) {
  //this does not work
  res.render('../web_source/ejs/car_page', local_node_car.renderJSONFile());
});

//finance page
app.get('/finance_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/finance_page.html'));
});

//power page
app.get('/power_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./web_source/html/power_page.html'));
});

//my page
app.get('/my_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(path.join(__dirname,'./'));
});



/*
 ***********************************************
 *                  POST REQUEST               *
 ***********************************************
 */

//---------------------- AUTH-RELATED POST REQUEST----------------------

//post new account info to database
app.post('/add_account', function(req, res) {
 var input_values = [req.body.id, req.body.pw, req.body.name];
 if (input_values[0] === undefined
    || input_values[1] === undefined
    || input_values[2] === undefined) {
   //prompt user to enter id or pw
 } else {
   local_node_reg.register_wait(input_values, res);
 }
});

//request id/pw comparison with a database
app.post('/user_login', function(req, res) {
 console.log("Post request called");
 var input_values = [req.body.user_id, req.body.user_pw];
 console.log(input_values);
 var result;
 if (input_values[0] === undefined
    || input_values[1] === undefined ) {
 } else {
   //find user
   local_node_login.login_wait(input_values, req, res);
 }
});

//logout request - empty locl_auth field.
app.post('/logout', function(req, res) {
  local_auth.id = "-";
  local_auth.name = "-";
  local_auth.role = "-";
  local_auth.token = "-";
  res.sendFile(path.join(__dirname,'./web_source/html/login_page.html'));
});

//--------------------END OF AUTH-RELATED POST REQUEST--------------------

//------------------------CAR-RELATED POST REQUEST------------------------

//post car_information to db with the image file name
app.post('/get_car_info', async function(req, res) {
  var input_values = [req.body.car_year,
                      req.body.car_model,
                      req.body.car_company,
                      req.body.car_owner,
                      req.body.car_name,
                      req.body.car_num];
  //var full_request_url = local_node_car.make_api_request_form(input_values);
  //local_node_car.register_car_info(input_values, full_request_url, res);
});

//post reservation for car schedule - check the criteria before submission.
app.post('/schedule_car', async function(req, res) {
  var selected_car = req.body.reserve_car;

  var time_from_list =  [req.body.year_from,
                        req.body.month_from,
                        req.body.date_from,
                        req.body.hour_from,
                        req.body.min_from];

  var time_to_list =  [req.body.year_to,
                      req.body.month_to,
                      req.body.date_to,
                      req.body.hour_to,
                      req.body.min_to];

  var time_from = local_node_car.make_time_format(time_from_list);
  var time_to = local_node_car.make_time_format(time_to_list);

  console.log("Selected Car: " + selected_car);
  console.log("Time from: " + time_from);
  console.log("Time to:" + time_to);
  console.log("User: " + local_auth.name);
});

//--------------------END OF CAR-RELATED POST REQUEST---------------------
