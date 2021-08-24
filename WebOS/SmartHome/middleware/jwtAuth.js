//jwt key value file
const token_config = require("./auth_config.js");

//local model temp file
const local_auth = require("../models/local_auth.js");

const jwt = require('jsonwebtoken');

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
  var dir = '../web_source/html/login_page.html';
  if (token == null || token == '-') {
    console.log("Null Token");
    return false;
  }

  jwt.verify(token, token_config.secret, (err, user) => {
    if (err) {
      console.log("Error?:" + err);
      //res.send("Web Token expired");
      res.redirect(dir);
    }
  });
  return true;
}

function block_access(req, res, next) {
  var token = local_auth.token;
  var dir = '../web_source/html/login_page.html';

  if (token == null || token == '-') {
    console.log("No Token");
    //login required
    res.redirect(dir);
  }

  jwt.verify(token, token_config.secret, (err, user) => {
    if (err) { //token error
      res.redirect(dir);
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
