// ingest.js - get data from callwatch into sqlite, etc
const http = require("http");
const moment = require("moment-timezone");
const { Pool, Client } = require("pg");
const superagent = require("superagent");
const util = require("util");

const cbridge = "pnw-d.pnwdigital.net";
moment.tz.setDefault("America/Los_Angeles");

const DB = new Pool();

class Call {
  constructor(
    id,
    time,
    duration,
    source_peer,
    source_radio,
    dest_group,
    rssi,
    site,
    loss_rate
  ) {
    this.id = id;
    this.time = moment(time, "HH:mm:ss.S MMM DD", true).format();
    this.duration = duration;
    this.source_peer = source_peer;
    this.source_radio = source_radio;
    this.dest_group = dest_group;
    this.rssi = rssi;
    this.site = site;
    this.loss_rate = loss_rate;
  }

  static from_text(tx) {
    const [active_raw, done_raw] = tx.split("\b");
    const active_records = active_raw.split("\t");
    const [update_number, ...done_records] = done_raw.split("\t");
    const active_calls = [];
    if (!active_raw.includes("&nbsp;\v \v")) {
      active_calls.push(
        ...active_records.map((r) => new Call(undefined, ...r.split("\v")))
      );
    }
    const done_calls = done_records.map(
      (r) => new Call(undefined, ...r.split("\v"))
    );
    return [update_number, active_calls, done_calls];
  }
}

let g_active_calls = [];
let g_done_calls = [];

async function updateData(from_time, loop) {
  url = `http://${cbridge}:42420/data.txt`;
  const query = {
    param: "ajaxcallwatch",
  };
  if (from_time) {
    query["updateNumber"] = from_time;
  }
  console.log(`Querying ${url} with ${util.inspect(query)}`);
  const resp = await superagent.get(url).query(query);
  const [update_number, active_calls, done_calls] = Call.from_text(resp.text);
  g_active_calls = active_calls;
  g_done_calls.unshift(...done_calls);
  if (active_calls.length > 0) {
    console.log(
      `Active Calls (${active_calls.length})\n${util.inspect(active_calls)}`
    );
  }
  if (done_calls.length > 0) {
    console.log(
      `New Calls (${done_calls.length})\n${util.inspect(done_calls)}`
    );
    // only request updates from the last successful ingest
    from_time = update_number;
    const insert_query = `INSERT INTO calls (time, duration, source_peer,
                                                 source_radio, dest_group, rssi,
                                                 site, loss_rate, cbridge)
                              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    done_calls.forEach((item) => {
      DB.query(insert_query, [
        item.time,
        item.duration,
        item.source_peer,
        item.source_radio,
        item.dest_group,
        item.rssi,
        item.site,
        item.loss_rate,
        cbridge,
      ]).catch((e) => console.error(e.stack));
    });
    DB.query("INSERT INTO ingest (time, update_number) VALUES ($1, $2)", [
      new Date(),
      update_number,
    ]).catch((e) => console.error(e.stack));
  }
  if (loop) {
    setTimeout(() => updateData(from_time, loop), 5000);
  }
}

async function start() {
  const row = await DB.query(
    "SELECT update_number FROM ingest ORDER BY time DESC LIMIT 1;"
  );
  let update_number = undefined;
  if (row) {
    update_number = row.update_number;
  }
  updateData(update_number, true);
}

(async function () {
  await start();
})();
