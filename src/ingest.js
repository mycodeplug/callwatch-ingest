// ingest.js - get data from callwatch into sqlite, etc
const http = require('http');
const sqlite3 = require('sqlite3');
const superagent = require('superagent');
const util = require('util')

const db_path = 'qsowatch.db';

// create the sqlite database
const DB = new sqlite3.Database(db_path, err => {
  if (err) {
    console.log(err);
    process.exit();
  }
  console.log(`Connected to ${db_path} database.`)
});
DB.get("SELECT name FROM sqlite_master WHERE type='table' AND name='calls';", (err, row) => {
  if (!row) {
    DB.exec(
      `CREATE TABLE calls (
        id integer NOT NULL PRIMARY KEY,
        time text NOT NULL,
        duration text NOT NULL,
        source_peer text NOT NULL,
        source_radio text NOT NULL,
        dest_group text NOT NULL,
        site text NOT NULL,
        rssi text NOT NULL,
        loss_rate text NOT NULL
      );`, function(err) {
      if (err) {
        console.log(err);
        console.log("cannot create calls table");
        process.exit();
      }
    });
  }
});
DB.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ingest';", (err, row) => {
  if (!row) {
    DB.exec(
      `CREATE TABLE ingest (
        id integer NOT NULL PRIMARY KEY,
        time integer NOT NULL,
        update_number numeric NOT NULL
      );`, function(err) {
      if (err) {
        console.log(err);
        console.log("cannot create ingest table");
        process.exit();
      }
    });
  }
});

class Call {
    constructor (id, time, duration, source_peer, source_radio, dest_group, rssi, site, loss_rate) {
        this.id = id;
        this.time = time;
        this.duration = duration;
        this.source_peer = source_peer;
        this.source_radio = source_radio;
        this.dest_group = dest_group;
        this.rssi = rssi;
        this.site = site;
        this.loss_rate = loss_rate;
    }

    static from_text (tx) {
        const [active_raw, done_raw] = tx.split("\b");
        const active_records = active_raw.split("\t");
        const [update_number, ...done_records] = done_raw.split("\t");
        const active_calls = []
        if (!active_raw.includes("&nbsp;\v \v")) {
            active_calls.push(...active_records.map(r => new Call(undefined, ...r.split("\v"))));
        }
        const done_calls = done_records.map(r => new Call(undefined, ...r.split("\v")));
        return [update_number, active_calls, done_calls]
    }
}

let g_active_calls = [];
let g_done_calls = [];

async function updateData (from_time, loop) {
    url = "http://pnw-d.pnwdigital.net:42420/data.txt";
    const query = {
        param: "ajaxcallwatch"
    }
    if (from_time) {
        query["updateNumber"] = from_time;
    }
    console.log(`Querying ${url} with ${util.inspect(query)}`);
    const resp = await superagent.get(url).query(query);
    const [update_number, active_calls, done_calls] = Call.from_text(resp.text);
    g_active_calls = active_calls
    g_done_calls.unshift(...done_calls);
    if (active_calls.length > 0) {
        console.log(`Active Calls (${active_calls.length})\n${util.inspect(active_calls)}`);
    }
    if (done_calls.length > 0) {
        console.log(`New Calls (${done_calls.length})\n${util.inspect(done_calls)}`);
        // only request updates from the last successful ingest
        from_time = update_number;
        const insert_query = `INSERT INTO calls (time, duration, source_peer,
                                                 source_radio, dest_group, rssi,
                                                 site, loss_rate)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const statement = DB.prepare(insert_query);
        done_calls.forEach((item) => {
            statement.run(
                [item.time, item.duration, item.source_peer, item.source_radio,
                 item.dest_group, item.rssi, item.site, item.loss_rate],
                function (err) {
                  if (err) throw err
                }
            );
        });
        statement.finalize()
        DB.run("INSERT INTO ingest (time, update_number) VALUES (?, ?)",
               [new Date(), update_number],
               err => {
                   if (err) {
                       console.log(err);
                       return;
                   }
               });
    }
    if (loop) {
        setTimeout(() => updateData(from_time, loop), 5000);
    }
}

DB.get("SELECT update_number FROM ingest ORDER BY time DESC LIMIT 1;", (err, row) => {
    let update_number = undefined
    if (row) {
        update_number = row.update_number;
    }
    updateData(update_number, true);
});
