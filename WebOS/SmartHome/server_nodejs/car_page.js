const path = require('path');
const fs = require('fs');
const request = require('request');
const fetch = require('node-fetch');

//database comm file
const db_query = require('../db/db_single_request.js');
const node_db_comm = require('./db_comm.js');

/*
 ***********************************************
 *                  Car register               *
 ***********************************************
 */

async function insert_car_info(input_values, img_file_name, current_user) {
    /*
    car_year
    car_model
    car_company
    car_owner
    car_name
    car_num
    */
    var car_info = [input_values[0], input_values[1], input_values[2], input_values[4]];
    var query_lists = [car_info, input_values[3], input_values[5], img_file_name, current_user];
    //must provide all 5 critical elements to DB:
    //  car_num, car_owner, img_file_name, registered_user, car_info.
    var insert_query
     = 'INSERT INTO webOS_car(car_info, car_owner, car_num,' +
        'car_image ,registered_user) VALUES($1,$2,$3,$4,$5) RETURNING *;';
    var result = await db_query.db_insert(insert_query, query_lists);
    return result;
}

/*
 ***********************************************
 *                Render EJS JSON              *
 ***********************************************
 */

//this function cannot be async function - used for rendering ejs
async function renderJSONFile() {
  //run this as promise

  var car_list = await node_db_comm.select_column("webos_car", "car_num");
  var car_names = ["-"];
  //render user's registered car lists
  function push_element(element) {
    car_names.push(element);
  }
  if (typeof car_list === 'function') {
    car_list.forEach(push_element);
  }
  var result = "Valid car";
  //read car image links from db
  var renderForm = {
    car_names: car_names,
    result: result,
    car_image: "Hey"
  };
  console.log(renderForm.car_names);
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

    var car_list = node_db_comm.select_column("webOS_car", "car_num");
    //then refresh page
    res.render('../web_source/ejs/car_page', renderJSONFile());
  }
}

//local_node_car
module.exports = {
  renderJSONFile,
  make_time_format,
  make_api_request_form,
  validate_image_file,
  register_car_info
};
