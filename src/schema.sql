CREATE DATABASE callwatch;
CREATE USER ingest WITH ENCRYPTED PASSWORD 'xxx';
GRANT ALL PRIVILEGES ON DATABASE callwatch TO ingest;

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
    UNIQUE (time, duration, dest_group)
);

CREATE TABLE IF NOT EXISTS ingest (
  id SERIAL PRIMARY KEY,
  time timestamp with time zone NOT NULL,
  update_number integer NOT NULL
);
