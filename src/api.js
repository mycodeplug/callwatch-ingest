const express = require('express')
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
app.use(cors());
const port = 3333;
const pool = new Pool();

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

app.get('/radio_id/:radio_id', async (req, res) => {
    const client = await pool.connect();
    const limit = res.query ? (req.query.limit ? parseInt(res.query.limit) : 100) : 100;
    const result = await client.query(
        "SELECT time, duration, source_peer, dest_group, calls.radio_id, callsign, name, state, country " +
        "FROM calls " +
        "JOIN users ON users.radio_id = calls.radio_id " +
        "WHERE calls.radio_id = $1 " +
        "ORDER BY time DESC " +
        "LIMIT $2", [req.params.radio_id, limit],
    )
    res.send(result.rows);

})

app.get('/callsign/:callsign', async (req, res) => {
    const client = await pool.connect();
    const result = await client.query(
        "SELECT radio_id, callsign, name, city, state, country " +
        "FROM users " +
        "WHERE callsign = $1 ", [req.params.callsign.toUpperCase()],
    )
    res.send(result.rows);

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
