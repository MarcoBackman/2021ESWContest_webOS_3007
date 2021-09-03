const jwt = require('jsonwebtoken');
const path = require('path');

//jwt key value file
const token_config = require("./auth_config.js");

//local model temp file
const local_auth = require("../models/local_auth.js");

const LOGIN_PAGE_PATH = path.join(__dirname,'../web_source/html/login_page.html');
/*
 ***********************************************
 *                 JWT methods                 *
 ***********************************************
 */

function generate_token(user_id) {
  var token = jwt.sign({name:user_id.toString()}, token_config.secret, {
    expiresIn: 1800
  }); //1800s = 30 minutes
  return token;
}

function authenticate_token() {
  var token = local_auth.token;
  if (token == null || token == '-') {
    console.log("Null Token");
    return false;
  }

  try {
    jwt.verify(token, token_config.secret);
  } catch (err) {
    return false;
  }
  return true;
}

function block_access(req, res, next) {
  var token = local_auth.token;

  if (token == null || token == '-') {
    console.log("No Token");
    //login required
    res.sendFile(LOGIN_PAGE_PATH);
  }

  jwt.verify(token, token_config.secret, (err, user) => {
    if (err) { //token error
      res.sendFile(LOGIN_PAGE_PATH);
    }
    req.user = user;
    next();
  });
}

//local_node_jwt
module.exports = {
  generate_token,
  authenticate_token,
  block_access
};
