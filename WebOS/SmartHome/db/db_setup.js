const { Pool, Client } = require('pg');

////for localhost
//const connection_conf = require('./config/DB1_local_pg_conf.json');

//for ec2 db - PW auth
var connection_conf = require('./config/DB1_aws_pg_pw_conf.json');

//for ec2 db - SSH
//var connection_conf = require('./config/DB1_aws__pg_ssh_conf.json');

const target_db = "webos_ec2_db";

const pool_list = {
  user: connection_conf.user,
  host: connection_conf.host,
  database: connection_conf.database,
  password: connection_conf.password,
  port: connection_conf.port,
  max: connection_conf.max,
  idleTimeoutMills: connection_conf.idleTimeoutMills,
  connectionTimeoutMillis: connection_conf.connectionTimeoutMillis
}

const auth_list = {
  user: connection_conf.user,
  host: connection_conf.host,
  database: connection_conf.database,
  password: connection_conf.password,
  port: connection_conf.port
}

const pool = new Pool(pool_list);
const client = new Client(auth_list);

const execute = async (query) => {
    try {
        await client.connect();
        await client.query(query);  // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    } finally {
        await client.end();         // closes connection
    }
};

pool.connect(function(err, client, done) {
    if(err) {
      return console.error('connection error', err);
    }
    create_tables();
    done();
});
pool.end();

function create_db() {
  var query_text = 'CREATE DATABASE "webos_ec2_db";';
  execute(query_text).then(result => {
      if (result) {
          console.log('Table created');
      }
  });
}


function create_tables() {
  var query_text = 'CREATE TABLE IF NOT EXISTS "user_accunts"(' +
	    '"id" VARCHAR(20),' +
	    '"name" VARCHAR(40) NOT NULL,' +
	    '"role" VARCHAR(15) NOT NULL,' +
      '"user_number" SMALLINT NOT NULL);';
  execute(query_text).then(result => {
      if (result) {
          console.log('Table created');
      }
  });
}

function create_car_usage_log_table() {
  var create_table_query =
  "CREATE TABLE IF NOT EXISTS public.car_usage_log" +
  "(fuel_used double precision NOT NULL," +
  "service_start_time bigint NOT NULL," +
  "service_end_time bigint NOT NULL," +
  "fuel_actual_level double precision," +
  "fuel_refilled double precision," +
  "car_number character varying COLLATE pg_catalog.'default'," +
  "user_number integer)" +
  "TABLESPACE pg_default;" +
  "ALTER TABLE public.car_usage_log OWNER to postgres;";
}
