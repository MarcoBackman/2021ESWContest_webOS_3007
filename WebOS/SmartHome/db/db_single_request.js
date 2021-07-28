const Router = require('express-promise-router');
const util = require('util');

//for localhost
const connection_conf = require('./config/DB1_local_pg_conf.json');
//for ec2 db - SSL
//var connection_conf = require('./config/DB1_aws_pg_ssl_conf.json');
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

async function conncection_check() {
  const client = new Client(auth_list);
  await client.connect();
  const query = await client.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(res);
    }
  });
}

/*
 * This method should be used only for insertion query.
 * This does not use await/async.
 * Therefore, it will not wait for the respond from the server.
 */
function db_insert(query_command, values) {
  const client = new Client(auth_list);
  client.connect();
  // callback
  client.query(query_command, values) // your query string here
    .then(result => console.log(result)) // your callback here
    .catch(e => console.error(e.stack)) // your callback here
    .then(() => client.end());

}

async function db_select(query_text, query_values) {
  const pool = new Pool(auth_list);
  const client = await pool.connect(auth_list);
  const result = await client.query({
    rowMode: 'array',
    text: select_query,
    query_values
  })
  console.log(result.fields[0]); // must return true
  console.log(result.rows) // [true]
  await client.end();
}

module.exports = {
  db_select,
  db_insert,
  conncection_check
};
