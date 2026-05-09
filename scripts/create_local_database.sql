-- Local dev database (PostgreSQL 15+). README: superuser `postgres`, password `test`.
--   set PGPASSWORD=test
--   psql -U postgres -h 127.0.0.1 -f scripts/create_local_database.sql

CREATE DATABASE raffaello IF NOT EXISTS;
