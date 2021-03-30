# callwatch-ingest

## initial setup

```
docker run -it -v "$PWD":/app -w /app node:15-buster yarn install
```

## starting the ingest

```
docker run -it -v "$PWD":/app -w /app node:15-buster node src/ingest.js
```

## dev container

```
docker run -it --network db -e PGHOST=db -e PGDATABASE=callwatch -e PGUSER=ingest -e PGPASSWORD=securesecure -v "$PWD":/app -w /app node:15-buster /bin/bash
```
