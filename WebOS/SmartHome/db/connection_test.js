const util = require('util');

//for localhost
//const connection_conf = require('./config/DB1_local_pg_conf.json');
//for ec2 db - SSL
var connection_conf = require('./config/DB1_aws_pg_pw_conf.json');

const auth_list = {
  user: connection_conf.user,
  host: connection_conf.host,
  database: connection_conf.database,
  password: connection_conf.password,
  port: connection_conf.port
}

const { Pool, Client } = require('pg');

run();

async function run() {
  await connection_check();
}

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
