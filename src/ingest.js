// ingest.js - get data from callwatch into sqlite, etc
const http = require("http");
const { DateTime } = require('luxon');
const { Pool, Client } = require("pg");
const superagent = require("superagent");
const util = require("util");

const cbridge = "pnw-d.pnwdigital.net";
const cbridge_tz = "America/Los_Angeles";

const long_sleep = 30000;  // delay when no calls are active
const short_sleep = 5000;  // delay when seeing active calls

const DB = new Pool();

function dmrid(s) {
  if (!s) {
    return -1;
  }
  const id_match = s.match(/[0-9]{4,}/);
  return id_match ? parseInt(id_match[0]) : -1;
}

class Call {
  constructor(
    id,
    timestamp,
    duration,
    source_peer,
    peer_id,
    source_radio,
    radio_id,
    dest_group,
    rssi,
    site,
    loss_rate
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.duration = duration;
    this.source_peer = source_peer;
    this.peer_id = peer_id;
    this.source_radio = source_radio;
    this.radio_id = radio_id;
    this.dest_group = dest_group;
    this.rssi = rssi;
    this.site = site;
    this.loss_rate = loss_rate;
  }

  static from_callwatch_row (
    time,
    duration,
    source_peer,
    source_radio,
    dest_group,
    rssi,
    site,
    loss_rate
  ) {
    return new Call(
      undefined,
      DateTime.fromFormat(time, "HH:mm:ss.u MMM d", {"zone": cbridge_tz}).toISO(),
      duration,
      source_peer,
      dmrid(source_peer),
      source_radio,
      dmrid(source_radio),
      dest_group,
      parseFloat(rssi),
      site,
      parseFloat(loss_rate.replace("%", "")),
    )
  }

  static from_text(tx) {
    const [active_raw, done_raw] = tx.split("\b");
    const active_records = active_raw.split("\t");
    const [update_number, ...done_records] = done_raw.split("\t");
    const active_calls = [];
    if (!active_raw.includes("&nbsp;\v \v")) {
      active_calls.push(
        ...active_records.map((r) => this.from_callwatch_row(...r.split("\v")))
      );
    }
    const done_calls = done_records.map(
      (r) => this.from_callwatch_row(...r.split("\v"))
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
  console.log(`[${DateTime.now().setZone(cbridge_tz).toISO()}] Querying ${url} with ${util.inspect(query)}`);
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
    const insert_query =
      `INSERT INTO calls
         (time, duration,
          source_peer, peer_id,
          source_radio, radio_id,
          dest_group,
          rssi, site, loss_rate, cbridge)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`;
    done_calls.forEach((item) => {
      const params = [
          item.timestamp,
          item.duration,
          item.source_peer,
          item.peer_id,
          item.source_radio,
          item.radio_id,
          item.dest_group,
          item.rssi,
          item.site,
          item.loss_rate,
          cbridge,
      ];
      DB.query(insert_query, params).catch((e) => console.error(e.stack, item, params));
    });
    DB.query("INSERT INTO cw_ingest (time, update_number) VALUES ($1, $2)", [
      new Date(),
      update_number,
    ]).catch((e) => console.error(e.stack));
  }
  if (loop) {
    const sleep_time = (active_calls.length > 0 || done_calls.length > 0) ? short_sleep : long_sleep;
    setTimeout(() => updateData(from_time, loop), sleep_time);
  }
}

async function start() {
  const row = await DB.query(
    "SELECT update_number FROM cw_ingest ORDER BY time DESC LIMIT 1;"
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
