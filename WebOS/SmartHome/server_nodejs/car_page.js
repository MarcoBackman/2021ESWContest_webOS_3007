const path = require('path');
const fs = require('fs');
const request = require('request');
const fetch = require('node-fetch');

//database comm file
const db_query = require('../db/db_single_request.js');
const node_db_comm = require('./db_comm.js');

//local model temp file
const local_auth = require("../models/local_auth.js");

/*
 ***********************************************
 *                  Car register               *
 ***********************************************
 */

async function insert_car_info(input_values, img_file_name, current_user) {
    /*
     * car_year
     * car_model
     * car_company
     * car_owner
     * car_name
     * car_num
     */
    var car_info = [input_values[0], input_values[1], input_values[2], input_values[4]];
    var query_lists = [car_info, input_values[3], input_values[5], img_file_name, current_user];
    //must provide all 5 critical elements to DB:
    //  car_num, car_owner, img_file_name, registered_user, car_info.
    var insert_query
     = 'INSERT INTO webOS_car(car_info, car_owner, car_num,' +
        'car_image ,registered_user) VALUES($1,$2,$3,$4,$5) RETURNING *;';
    try {
      var result = await db_query.db_insert(insert_query, query_lists);
    } catch(err) {
      console.log(err);
    }
    return result;
}

/*
 ***********************************************
 *                Render EJS JSON              *
 ***********************************************
 */

function pushData(element, list_to_push, outer_index, inner_index) {
  if (inner_index == -1) {
    list_to_push.push(element[outer_index]);
  } else {
    list_to_push.push(element[outer_index][inner_index]);
  }
  return list_to_push;
}

//this function cannot be async function - used for rendering ejs
async function renderJSONFile() {
  //run this as promise

  //empty car list means there is no matching car that user ownes
  var car_list = await car_data_by_user("webOS_car", "car_owner",
    local_auth.name, "car_num");

  //render user's registered car info into array
  var car_names = [];
  var car_images = [];
  var car_numbers = [];
  var car_fuels = [];
  var car_schedule = [];

  /*
   * 0 : car number
   * 1 : car owner
   * 2 : car image
   * 3 : registered user
   * 4 : detailed car info.
   */
  if (car_list[0] != null) {
    console.log("Found");
    for(var i = 0; i < car_list.length; i++) {
      //store car_name into the array
      pushData(car_list[i], car_names, 4, 2);
      //store image file name to the array
      pushData(car_list[i], car_images, 2, -1);
      //store fuel usage to the array by each car

      //load schedule data

      //store car numbers into the array
      pushData(car_list[i], car_numbers, 0, -1);
    }
  }
  //read car image links from db
  var renderForm = {
    car_names: car_names,
    car_numbers: car_numbers,
    car_images: car_images,
    car_fuels: car_fuels,
    car_schedule: car_schedule
  };
  return renderForm;
}

/*
 ***********************************************
 *                  Car Schedule               *
 ***********************************************
 */

function make_time_format(list) {
  var full_format = "" + list[0].trim(" ") +
                         list[1].trim(" ") +
                         list[2].trim(" ") +
                         list[3].trim(" ") +
                         list[4].trim(" ");
  return full_format;
}

async function sendDataFormat(req, res) {
   var user_name = local_auth.name;         //shows user name
   var selected_car = req.body.reserve_car; //shows car name

   var time_from_list = [req.body.year_from,
                         req.body.month_from,
                         req.body.date_from,
                         req.body.hour_from,
                         req.body.min_from];

   var time_to_list = [req.body.year_to,
                       req.body.month_to,
                       req.body.date_to,
                       req.body.hour_to,
                       req.body.min_to];
   var time_from = local_node_car.make_time_format(time_from_list);
   var time_to = local_node_car.make_time_format(time_to_list);

   var input_array = [];

   //send data set to the server
   node_db_comm.insert_car_schedule();
}

/*
 ***********************************************
 *               CAR API request               *
 ***********************************************
 */

function make_api_request_form(input_values) {
  const car_img_api = require("../db/config/car_api_conf.json");
  var full_request_url = "";
  Object.entries(car_img_api).forEach(([keyword, value]) => {
    if (keyword == "_api_reference") {
    } else if (keyword == "url") {
      full_request_url += value ;
    } else if (keyword == "year") {
      full_request_url += keyword + "=" + input_values[0] + "&";
    } else if (keyword == "model") {
      full_request_url += keyword + "=" + input_values[1] + "&";
    } else if (keyword == "make") {
      full_request_url += keyword + "=" + input_values[2] + "&";
    } else {
      full_request_url += keyword + "=" + value +"&";
    }
  });
  return full_request_url;
}

async function get_car_imagelink(full_request_url, res) {
  let settings = { method: "Get" };
  console.log("Full request url: " + full_request_url);
  var response = await fetch(full_request_url, settings);
  var json_response = await response.json();
  var image_link = json_response.images[0].link;
  return image_link;
}


/*
 ***********************************************
 *             CAR file validation             *
 ***********************************************
 */

function output_file_name(input_values) {
  //set file_name - company_model_year.png
  return "" + input_values[2] + "_" + input_values[1]
            + "_" + input_values[0] + ".png";
}

function car_image_download(image_link, file_name) {
  //execute image download
  var download = function(url, name, callback) {
    request.head(url, function(err, head_res, body){
      console.log('content-type:', head_res.headers['content-type']);
      console.log('content-length:', head_res.headers['content-length']);
      let pathToFile = path.join(__dirname,
         "../web_source/src/car_img", name);
      request(url).pipe(fs.createWriteStream(pathToFile)).on('close', callback);
    });
  };

  download(image_link, file_name, function() {
    console.log('Image download complete.');
  });
}

function validate_image_file(file_name) {
  const path = '../web_source/src/car_img/' + file_name;
  try {
    if (fs.existsSync(path)) {
      return true;
    }
  } catch(err) {
    console.error(err);
    return false;
  }
  return false;
}

/*
 ********************************************
 *             Car registration             *
 ********************************************
 */

async function register_car_info(input_values, full_request_url, res) {
  var image_link = ""

  //validate duplication car (by car number)
  var exists = await node_db_comm.check_data("webos_car", "car_num", input_values[5]);
  //make file car_name
  var file_name = output_file_name(input_values);

  //Alert user if the car info is already registered.
  if (exists) {
    //check local image data - compare with DB file name

    //this will refresh a page
    res.render('../web_source/ejs/car_page', renderJSONFile());
  } else { //Write input data to DB
    //check car image on local file - compare with DB file name
    var valid = validate_image_file(file_name);

    //no image found
    if (valid == false) {
        //send query to DB
        var image_link = await get_car_imagelink(full_request_url, res);
        //download image from url
        car_image_download(image_link, file_name);
    }

    //post data to db from the link(including images)
    await insert_car_info(input_values, file_name, local_auth.name);

    //then refresh page
    res.render('../web_source/ejs/car_page', renderJSONFile());
  }
}

/*
 ***********************************************
 *               DB communication              *
 ***********************************************
 */
//SELECT * FROM webos_car WHERE car_owner='백승준' ORDER BY car_num ASC;
//need modification
async function car_data_by_user(table, targetColumn, targetVal, orderBy) {
  var select_query = "SELECT * FROM " + table + " WHERE " + targetColumn +
                     "='" + targetVal + "' ORDER BY " + orderBy + " ASC;";
  try {
    var list = await db_query.db_request_data(select_query);
  } catch(err) {
    console.log(err);
  }
  return list;
}

//this will raise duplication issues
async function get_car_number_by_name() {

}

//local_node_car
module.exports = {
  renderJSONFile,
  make_time_format,
  make_api_request_form,
  validate_image_file,
  register_car_info
};
