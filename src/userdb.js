// userdb.js - get data from radioid into dmrid_history table
const { Pool } = require("pg");
const superagent = require("superagent");
const fs = require('fs')


const pool = new Pool();
const default_radioid_users_json =
  "https://database.radioid.net/static/users.json";
const local_json = "./users.json";

async function download_users_json(url) {
  if (!url) {
    url = default_radioid_users_json;
  }
  return superagent.get(url).then(res => {
    return res.body;
  });
}

const insert_query = `INSERT INTO dmrid_history
                        (radio_id, callsign, name, surname,
                         city, state, country, remarks)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                      ON CONFLICT DO NOTHING`;

async function update_records(users_promise) {
  const client = await pool.connect();
  const users = JSON.parse(await users_promise);
  let done = 0;
  try {
    await client.query("BEGIN");
    for (const user of users["users"]) {
      await client.query(insert_query, [
        user.radio_id,
        user.callsign,
        user.name,
        user.surname,
        user.city,
        user.state,
        user.country,
        user.remarks,
      ]);
      done++;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  console.log(`Processed ${done} records.`);
}

(async function () {
  //await update_records(download_users_json());
  await update_records(fs.promises.readFile(local_json, 'utf8'));
})();
