const alert = require('alert');
const path = require('path');

//database comm file
const db_comm = require("./db_comm.js");
const db_query = require('../db/db_single_request.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

//jwt file
const node_jwt = require("../middleware/jwtAuth.js");

async function login_account(input_values) {
  //check if data exists
  //!injection attack prone code! must paramatize the value!
  var id_exists = await db_comm.check_data("accounts", "id", input_values[0]);
  var pw_exists = await db_comm.check_data("accounts", "pw", input_values[1]);
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
    local_auth.id = input_values[0].trim(" ");
    local_auth.role = "user";
    //retreive data from database
    var result_list = await db_comm.select_by_data("accounts", "id", input_values[0]);
    local_auth.name = result_list[0][2];
    local_auth.token = node_jwt.generate_token(input_values[0]);
    alert("안녕하세요! " + local_auth.name + "님.");
    //redirect to the main page
    res.sendFile(path.join(__dirname,'../web_source/html/main_page.html'));
  } else {
    //login failed - alert user
    alert("Invalid ID/PW!");
    //give empty the input field
    res.sendFile(path.join(__dirname,'../web_source/html/login_page.html'));
  }
}

//local_node_login
module.exports = {
  login_account,
  login_wait
};
