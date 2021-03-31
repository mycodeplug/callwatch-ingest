CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,
    time timestamp with time zone NOT NULL,
    duration real NOT NULL,
    source_peer text NOT NULL,
    source_radio text NOT NULL,
    dest_group text NOT NULL,
    site text NOT NULL,
    rssi text NOT NULL,
    loss_rate text NOT NULL,
    cbridge text NOT NULL,
    UNIQUE (time, source_peer, source_radio, dest_group)
);

CREATE TABLE IF NOT EXISTS cw_ingest (
  id SERIAL PRIMARY KEY,
  time timestamp with time zone NOT NULL,
  update_number integer NOT NULL,
  cbridge text NOT NULL
);

CREATE TABLE IF NOT EXISTS dmrid_history (
  id SERIAL PRIMARY KEY,
  radio_id integer NOT NULL,
  callsign varchar(16) NOT NULL,
  name text,
  surname text,
  city text,
  state text,
  country text,
  remarks text,
  updated_ts timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (radio_id, callsign, name, surname, city, state, country, remarks)
);
