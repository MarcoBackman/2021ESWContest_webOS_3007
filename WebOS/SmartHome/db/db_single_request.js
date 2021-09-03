const util = require('util');

//for localhost
const connection_conf = require('./config/DB1_local_pg_conf.json');
//for ec2 db - SSL
//var connection_conf = require('./config/DB1_aws_pg_pw_conf.json');
//for ec2 db - SSH
//var connection_conf = require('./config/DB1_aws__pg_ssh_conf.json');

const auth_list = {
  user: connection_conf.user,
  host: connection_conf.host,
  database: connection_conf.database,
  password: connection_conf.password,
  port: connection_conf.port
}

const { Pool, Client } = require('pg');

async function connection_check() {
  const client = new Client(auth_list);
  await client.connect();
  console.log("Connection Checking...");
  const query = await client.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.log("Select request error: " + err.stack);
    } else {
      console.log("Select request result: " + res);
    }
  });
}

async function db_insert(query_command, values) {
  const client = new Client(auth_list);
  client.connect();
  // callback
  client.query(query_command, values) //query string
    .then(result => console.log("Insertion result: " + result))
    .catch(e => console.error(e.stack)) //callback here
    .then(() => client.end());
}

//need refactor - confusion with db_request_data
//mainly for insertion, update
async function db_request(query_text) {
  //this must be a pool not a client -> need explaination
  const pool = new Pool(auth_list);

  const result = await pool.query({
    rowMode: 'array',
    text: query_text,
  });
  console.log("DB Request - fields[0]: " + result.fields[0]);
  console.log("DB Request data - rows: " + result.rows); // [[boolean]]
  await pool.end();

  return result.rows[0][0]; //returns boolean value
}


//returns rows with data
async function db_request_data(query_text) {
  //this must be a pool not a client -> need explaination
  const pool = new Pool(auth_list);

  const result = await pool.query({
    rowMode: 'array',
    text: query_text,
  });
  console.log("DB Request - fields[0]: " + result.fields[0]);
  console.log("DB Request data - rows: " + result.rows); // [[element]]
  await pool.end();

  return result.rows; //returns rows
}

module.exports = {
  db_request,
  db_insert,
  db_request_data,
  connection_check
};
