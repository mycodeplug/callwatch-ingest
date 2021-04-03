# callwatch-ingest

## initial setup

```
docker run -it -v "$PWD":/app -w /app node:15-buster yarn install
```

## starting the ingest

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster node src/ingest.js
```

### dev server (restart on change)

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

### showing changes in the history log

Need to get this working
```
 SELECT * FROM dmrid_history
 WHERE radio_id IN
 (
   SELECT radio_id, MAX(updated_ts) as updated_ts FROM dmrid_history
   WHERE updated_ts >= (NOW() - interval '2 day')
   GROUP BY radio_id HAVING COUNT(*) > 1
 )
 ORDER BY radio_id;
 ```
