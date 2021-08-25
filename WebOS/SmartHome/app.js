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

//static file paths
const ROOT_PATH = path.join(__dirname,'./');
const MAIN_PAGE_PATH = path.join(__dirname,'./web_source/html/main_page.html');
const LOGIN_PAGE_PATH = path.join(__dirname,'./web_source/html/login_page.html');
const REG_PAGE_PATH = path.join(__dirname,'./web_source/html/register_page.html');
const ROOM_PAGE_PATH = path.join(__dirname,'./web_source/ejs/room_page.ejs');
const CAR_PAGE_PATH = path.join(__dirname,'./web_source/ejs/car_page.ejs');
const POWER_PAGE_PATH = path.join(__dirname,'./web_source/html/power_page.html');
const FINACE_PAGE_PATH = path.join(__dirname,'./web_source/html/finance_page.html');
const MY_PAGE_PATH = path.join(__dirname,'./web_source/html/finance_page.html');

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

app.use(express.static(path.join(__dirname, 'web_source')));
app.use(express.static(path.join(__dirname, 'server_nodejs')));
app.use(express.static(path.join(__dirname, 'middleware')));

/*
//this will raise problem when url typed like:
    http://localhost:8081/car_page/car_page/car_page/
    -> this will load the page but accomodates css loading error
app.use(express.static('web_source'));
app.use(express.static('server_nodejs'));
app.use(express.static('middleware'));
*/

app.use("/scripts", express.static('./scripts/'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());
app.use(cors(cors_setting));
app.use(limiter);

app.set('view engine', 'ejs');

var port = 8081; //port for local host connection
app.listen(port, (err) => {
  if (err) console.log(err);
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
    res.sendFile(MAIN_PAGE_PATH);
  } else {
    console.log("Expired AWT Token");
    res.sendFile(LOGIN_PAGE_PATH);
  }
});

//main page
app.get('/main_page.html', local_node_jwt.block_access, function(req, res) {
  var logged_in = local_node_jwt.authenticate_token(res);
  //if not send default page
  if (logged_in === true) {
    res.sendFile(MAIN_PAGE_PATH);
  } else {
    console.log("Expired AWT Token");
    res.sendFile(LOGIN_PAGE_PATH);
  }
});

//login page
app.get('/login_page.html', function(req, res) {
  res.sendFile(LOGIN_PAGE_PATH);
});

//register page
app.get('/register_page.html', function(req, res) {
  res.sendFile(REG_PAGE_PATH);
});

//room page
app.get('/room_page', local_node_jwt.block_access, async function(req, res) {
  //retrive data from the database

  //EJS file must work on render instead of sendFile.
  res.render('../web_source/ejs/room_page.ejs');
});

//car page
app.get('/car_page', local_node_jwt.block_access, async function(req, res) {

  //retrive data from the database
  var car_page_data = await local_node_car.renderJSONFile();
  //EJS file must work on render instead of sendFile.
  try {
    res.render(path.join(__dirname, './web_source/ejs/car_page'), car_page_data);
  } catch(err) {
    console.log(err);
  }
});

//finance page
app.get('/finance_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(FINACE_PAGE_PATH);
});

//power page
app.get('/power_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(POWER_PAGE_PATH);
});

//my page
app.get('/my_page', local_node_jwt.block_access, function(req, res) {
  res.sendFile(ROOT_PATH);
});

//all other paths for get request
 app.get('*', (req, res) =>{
   var logged_in = local_node_jwt.authenticate_token(res);
   //if not send default page
   if (logged_in === true) {
     res.sendFile(MAIN_PAGE_PATH);
   } else {
     res.sendFile(LOGIN_PAGE_PATH);
   }
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
 var input_values = [req.body.user_id, req.body.user_pw];
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

  var full_request_url = await local_node_car.make_api_request_form(input_values);
  local_node_car.register_car_info(input_values, full_request_url, res);
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

app.post('/my_room', async function(req, res) {
  var time_from_list =  req.body.room
});

//all other paths for post request
app.post('*', async function(req, res) {
  console.log("Unexpected post request");
});

//--------------------END OF CAR-RELATED POST REQUEST---------------------
