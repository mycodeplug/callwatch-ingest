COPY (
  SELECT radio_id,
         UPPER(callsign),
         CONCAT(INITCAP(name), UPPER(SUBSTRING(surname from 0 for 1))),
         INITCAP(city),
         INITCAP(state),
         NULL,
         INITCAP(country)
  FROM pnwusers
  WHERE callsign <> ''
  ORDER BY last_heard DESC
) TO STDOUT DELIMITER ',' CSV QUOTE '"';
