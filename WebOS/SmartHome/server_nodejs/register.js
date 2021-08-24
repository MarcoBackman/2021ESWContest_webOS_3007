const alert = require('alert');
const path = require('path');

//database comm file
const db_query = require('../db/db_single_request.js');

//db basic communication functions
const db_comm = require("./db_comm.js");

//local model temp file
const local_auth = require("../models/local_auth.js");

async function register_wait(input_values, res) {
  var result = await db_comm.check_data("accounts", "id", input_values[0]);

  if (result === true) { //account exists
    //prompt user that id has already taken
    alert("Already registered");
    res.sendFile(path.join(__dirname,'../web_source/html/register_page.html'));
  } else {  //account does not exists
    db_comm.insert_account(input_values);
    alert("Newly added");
    res.sendFile(path.join(__dirname,'../web_source/html/login_page.html'));
  }
}

//local_node_reg
module.exports = {
  register_wait
};
