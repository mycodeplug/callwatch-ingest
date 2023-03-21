#!/usr/bin/env bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

function compose_psql () {
  cat "$1" | docker compose run psql -q
}

output_dir=${1:-$SCRIPTPATH/output/$(date +%Y%m%dT%H%M%S)}

mkdir -p "$output_dir"
compose_psql "$SCRIPTPATH/sql/pg_to_TYT_csv.sql" > "$output_dir/pnwusers-md-uv380.csv"
compose_psql "$SCRIPTPATH/sql/pg_to_AT_csv.sql" | awk 'sub("$", "\r")' > "$output_dir/pnwusers-anytone-878.csv"
compose_psql "$SCRIPTPATH/sql/pg_to_pnwusers_json.sql" > "$output_dir/pnwusers.json"
