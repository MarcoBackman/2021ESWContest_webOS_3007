const alert = require('alert');
const path = require('path');

//database comm file
let db_query = require('../db/db_single_request.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

/*
 ***********************************************
 *        General-use DB communication         *
 *    This only contains common query traits   *
 ***********************************************
 */

async function check_data(table, column, data) {
  //!injection attack prone code! must paramatize the value!
  var select_query = "SELECT EXISTS (SELECT * FROM "+ table +" WHERE "
   + column + "='" + data +"');";

  try {
    var exist = await db_query.db_request(select_query);
  } catch(err) {
    console.log(err);
  }
  return exist;
}

async function insert_account(input_values) {
  //if data does not exist, insert
    var insert_query = 'INSERT INTO accounts(id,pw,user_name) VALUES($1,$2,$3) RETURNING *;';
    try {
      var result = await db_query.db_insert(insert_query, input_values);
    } catch (err) {
      console.log(err);
    }
    return result;
}

async function insert_car_schedule(input_values) {
  //if data does not exist, insert
    var insert_query = 'INSERT INTO car_schedule(car_number, scheduled_user,'
       + 'car_schedule_start, car_schedule_end, car_info)'
       + 'VALUES($1,$2,$3,$4, $5) RETURNING *;';
    try {
      var result = await db_query.db_insert(insert_query, input_values);
    } catch (err) {
      console.log("Error on car schedule insertion" + err);
    }
    return result;
}

//send with single data - returns rows of matched data
async function select_by_data(table, column, data) {
  var select_query = "SELECT * FROM " + table +
                     " WHERE " + column + "='" + data + "';";
  try {
    var list = await db_query.db_request_data(select_query);
  } catch(err) {
    console.log(err);
  }
  return list;
}

async function get_column_data(table, column, data, column_to_get) {
  var select_query = "SELECT " + column_to_get + " FROM " + table +
                     " WHERE " + column + "='" + data + "';";
  try {
    var list = await db_query.db_request_data(select_query);
  } catch(err) {
    console.log(err);
  }
  return list;
}

//
async function select_column(table, column) {
  var select_query = "SELECT " + column + " FROM " + table +
                     "ORDER BY " + table + " ASC;";
  try {
    var list = await db_query.db_request_data(select_query);
  } catch(err) {
    console.log(err);
  }
  return list;
}

//local_node_db_comm
module.exports = {
  check_data,
  insert_account,
  select_by_data,
  select_column,
  get_column_data,
  insert_car_schedule
};
