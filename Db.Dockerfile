FROM postgres:15-alpine
COPY src/schema.sql /docker-entrypoint-initdb.d/schema.sql
