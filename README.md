# callwatch-ingest

## initial setup

```
docker run -it -v "$PWD":/app -w /app node:15-buster yarn install
```

## api server

```
docker run -it --network db -p 3333:3333 -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster npx nodemon src/api.js
```

## starting the ingest

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster node src/ingest.js
```

### dev ingest (restart on change)

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster npx nodemon src/ingest.js
```

## cronjob to update the usersdb

TODO
```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster node src/userdb.js
```

## dev container

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster /bin/bash
```
# queries

## userdb

### full history of changed ids

This query fetches the full history of dmr numbers that have had
modifications in the last day.

It specifically excludes new DMR numbers.

```
SELECT * FROM dmrid_history
WHERE radio_id IN
(
  SELECT radio_id FROM dmrid_history
  WHERE radio_id IN
  (
	  SELECT radio_id FROM dmrid_history
	  GROUP BY radio_id
      HAVING COUNT(*) > 1
  ) AND updated_ts >= (NOW() - interval '1 day')
 )
 ORDER BY radio_id, id ASC;
```
