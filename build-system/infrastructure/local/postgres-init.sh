#!/usr/bin/env bash
# Sourced by the official PostgreSQL entrypoint, once for an empty data volume.
# Password bytes travel in psql's input, never command arguments or printed SQL.
set -euo pipefail
OXAGEN_MIGRATION_PASSWORD="$(cat /run/secrets/postgres_migration_password)"
OXAGEN_RUNTIME_PASSWORD="$(cat /run/secrets/postgres_runtime_password)"
export OXAGEN_MIGRATION_PASSWORD OXAGEN_RUNTIME_PASSWORD
psql --username postgres --dbname oxagen --set ON_ERROR_STOP=1 <<'SQL'
\getenv migration_password OXAGEN_MIGRATION_PASSWORD
\getenv runtime_password OXAGEN_RUNTIME_PASSWORD
CREATE ROLE oxagen_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'migration_password';
CREATE ROLE oxagen_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'runtime_password';
ALTER DATABASE oxagen OWNER TO oxagen_migrator;
REVOKE ALL ON DATABASE oxagen FROM PUBLIC;
GRANT CONNECT ON DATABASE oxagen TO oxagen_runtime;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO oxagen_migrator;
GRANT USAGE ON SCHEMA public TO oxagen_runtime;
SQL
unset OXAGEN_MIGRATION_PASSWORD OXAGEN_RUNTIME_PASSWORD
