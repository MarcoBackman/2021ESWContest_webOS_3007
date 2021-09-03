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

    //generate user number
    var user_number = await generate_user_number();
    console.log("USER NUMBER:" + user_number);

    if (user_number == -1 || user_number == null) {
      console.log("UNEXPECTED ERROR");
      alert("ERROR!");
      res.sendFile(path.join(__dirname,'../web_source/html/login_page.html'));
    } else {
      db_comm.insert_account(input_values, user_number);
      alert("Newly added");
      res.sendFile(path.join(__dirname,'../web_source/html/login_page.html'));
    }
  }
}

async function generate_user_number() {
  //setup user number to db
  var result_index = await get_user_number();

  if (result_index != -1) {
    return result_index += 1;
  } else {
    return -1;
  }
}

//get user number from DB
async function get_user_number() {
  //queries
  var query = "SELECT MAX(user_number) FROM accounts;";

  //user number empty - return 0
  try {
    var index = await db_query.db_request_data(query);
  } catch (err) {
    console.log("USER NUMBER INDEX GET ERROR: " + index);
    return -1;
  }

  console.log(index[0]);

  //it is empty - base case.
  if (index[0] == null) {
    console.log("TABLE IS EMPTY.");
    return 1;
  }

  if (index[0].length == 0) {
    console.log("TABLE IS EMPTY.");
    return 1;
  }

  return index[0];
}

//local_node_reg
module.exports = {
  register_wait
};
