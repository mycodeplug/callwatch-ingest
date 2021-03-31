# callwatch-ingest

## initial setup

```
docker run -it -v "$PWD":/app -w /app node:15-buster yarn install
```

## starting the ingest

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=pnwho -e PGUSER=pnwho -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster node src/ingest.js
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
