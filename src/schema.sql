CREATE OR REPLACE FUNCTION talkgroup_from(dest_group text) RETURNS text
LANGUAGE plpgsql
IMMUTABLE RETURNS NULL ON NULL INPUT
PARALLEL SAFE AS
$$
BEGIN
    RETURN (
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
        REPLACE(
            REGEXP_REPLACE(dest_group, '(~2)?(-[0-9]+|\.CC(\..*)?)$', '', 'i'),
            'Audio Test 2', 'Audio Test'
        ), 'BC 1', 'BC'
        ), 'Bridge 2', 'Bridge'
        ), 'California 1', 'California'
        ), 'Cascades 1', 'Cascades'
        ), 'I.84', 'I-84 2'
        ), 'Idaho 1', 'Idaho'
        ), 'Inland 1', 'Inland'
        ), 'Oregon 1', 'Oregon'
        ), 'PNWR 2', 'PNWR'
        ), 'Parrot 1', 'Parrot'
        ), 'SoCal 2', 'SoCal'
        )
    );
END
$$;

CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,
    time timestamp with time zone NOT NULL,
    duration real NOT NULL,
    source_peer text NOT NULL,
    peer_id integer NOT NULL DEFAULT -1,
    source_radio text NOT NULL,
    radio_id integer NOT NULL DEFAULT -1,
    dest_group text NOT NULL,
    talkgroup text GENERATED ALWAYS AS (talkgroup_from(dest_group)) STORED,
    site text NOT NULL,
    rssi numeric NOT NULL DEFAULT 0.0,
    loss_rate numeric NOT NULL DEFAULT 0.0,
    cbridge text,
    UNIQUE (time, source_peer, source_radio, dest_group)
);

CREATE INDEX calls_radio_id ON calls (radio_id);
CREATE INDEX calls_peer_id ON calls (peer_id);
CREATE INDEX calls_cbridge ON calls (cbridge);
CREATE INDEX calls_dest_group ON calls (dest_group);
CREATE INDEX calls_talkgroup ON calls (talkgroup);

CREATE TABLE IF NOT EXISTS cw_ingest (
  id SERIAL PRIMARY KEY,
  time timestamp with time zone NOT NULL,
  update_number integer NOT NULL
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
  updated_ts timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX dmrid_history_record ON dmrid_history (
  radio_id, callsign,
  COALESCE(name, ''),
  COALESCE(surname, ''),
  COALESCE(city, ''),
  COALESCE(state, ''),
  COALESCE(country, ''),
  COALESCE(remarks, '')
);
CREATE INDEX dmrid_history_radio_id ON dmrid_history (radio_id);
CREATE INDEX dmrid_history_callsign on dmrid_history (callsign);

CREATE OR REPLACE VIEW users AS
  SELECT DISTINCT ON (radio_id)
    radio_id, callsign, name, surname, city, state, country, remarks, updated_ts
  FROM dmrid_history
  ORDER BY radio_id, updated_ts DESC;

CREATE OR REPLACE VIEW pnwusers AS
  SELECT DISTINCT ON (calls.radio_id)
    calls.radio_id,
    calls.time AS last_heard,
    users.callsign, users.name, users.surname,
    users.city, users.state, users.country,
    users.remarks
  FROM calls
  LEFT OUTER JOIN users ON (calls.radio_id = users.radio_id)
  WHERE calls.radio_id > 0
  ORDER BY calls.radio_id, last_heard DESC;
