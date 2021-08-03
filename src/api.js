const express = require('express')
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
app.use(cors());
const port = 3333;
const pool = new Pool();
pool.on('error', (err) => {
    console.log("db Pool error", err);
});

function createError(status, message) {
    var err = new Error(message);
    err.status = status;
    return err;
}

app.param('radio_id', function(req, res, next, num, name){
    req.params[name] = parseInt(num, 10);
    if( isNaN(req.params[name]) ){
        next(createError(400, 'failed to parseInt '+num));
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.send({'pnwho': '0.0.1'})
})

app.get('/pnwusers', async (req, res) => {
    const client = await pool.connect();
    const result = await client.query(
        "SELECT radio_id, callsign, name, city, state, country, last_heard " +
        "FROM pnwusers " +
        "ORDER BY last_heard DESC"
    )
    res.send(result.rows);
})

app.get('/pnwtalkgroups', async (req, res) => {
    const client = await pool.connect();
    const default_since = "2 day";
    const since = req.query ? (req.query.since ? req.query.since : default_since) : default_since;
    const result = await client.query(`
        SELECT
            MAX(time) AS last_heard,
            COUNT(*) as n_calls,
            talkgroup
        FROM calls
        WHERE time > NOW() - $1::interval 
        GROUP BY talkgroup
        ORDER BY last_heard DESC;
    `, [since]);
    res.send(result.rows);
})

app.get('/calls', async (req, res) => {
    const client = await pool.connect();
    const default_since = "2 day";
    const since = req.query ? (req.query.since ? req.query.since : default_since) : default_since;
    const result = await client.query(`
        SELECT time, duration, source_peer, talkgroup, calls.radio_id
        FROM calls
        WHERE time > NOW() - $1::interval
        ORDER BY time ASC 
    `, [since]);
    res.send(result.rows);
})

app.get('/calls/:talkgroup', async (req, res) => {
    const client = await pool.connect();
    const default_since = "2 day";
    const since = req.query ? (req.query.since ? req.query.since : default_since) : default_since;
    const result = await client.query(`
        SELECT time, duration, source_peer, talkgroup, calls.radio_id
        FROM calls
        WHERE LOWER(talkgroup) = LOWER($1) AND time > NOW() - $2::interval
        ORDER BY time ASC 
    `, [req.params.talkgroup, since]);
    res.send(result.rows);
})

app.get('/calls_by_id/:radio_id', async (req, res) => {
    const client = await pool.connect();
    const limit = res.query ? (req.query.limit ? parseInt(res.query.limit) : 100) : 100;
    const result = await client.query(`
        SELECT time, duration, source_peer, dest_group, calls.radio_id
        FROM calls
        JOIN users ON users.radio_id = calls.radio_id
        WHERE calls.radio_id = $1
        ORDER BY time DESC
        LIMIT $2
    `, [req.params.radio_id, limit]);
    res.send(result.rows);
})

app.get('/user_by_callsign/:callsign', async (req, res) => {
    const client = await pool.connect();
    const result = await client.query(`
        SELECT radio_id, callsign, name, city, state, country
        FROM users
        WHERE callsign = $1
    `, [req.params.callsign.toUpperCase()]);
    res.send(result.rows);
})

app.get('/user_by_id/:radio_id', async (req, res) => {
    const client = await pool.connect();
    const result = await client.query(`
        SELECT radio_id, callsign, name, city, state, country
        FROM users
        WHERE radio_id = $1
    `, [req.params.radio_id]);
    res.send(result.rows);
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
