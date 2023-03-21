COPY (SELECT ARRAY_TO_JSON(ARRAY_AGG(t)) FROM (
    SELECT radio_id, callsign, name, city, state, country, last_heard
    FROM pnwusers
    ORDER BY last_heard DESC
) t)
TO STDOUT
