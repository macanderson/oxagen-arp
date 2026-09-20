# Local development services

This bundle prepares a local development environment. Staging and production use the separate AWS ECS/Fargate path. This is not a production installation or a claim of SOC2 readiness.

PostgreSQL and SeaweedFS are real storage services. The app, gateway, worker, migration, and storage setup commands must come from reviewed product images. **Those product programs are not included or replaced with pretend services here.** Complete explicit phase-zero certification before product implementation. Supply and review the resulting immutable images before starting this bundle.

## What runs

| Service | Purpose | Access |
| --- | --- | --- |
| `postgres` | PostgreSQL 17; durable local data | Private network; no host port |
| `object-store` | SeaweedFS with an S3 API and local files | Private network; no host port or admin UI |
| `migrate` | Apply the app image's actual migrations | Own database role; runs to completion |
| `storage-init` | Create `oxagen-dev` if absent and verify an authenticated object roundtrip | Separate setup credentials; runs to completion |
| `gateway` | The real product gateway | `127.0.0.1:8081` by default |
| `app` | The real product web app/API | `127.0.0.1:8080` by default |
| `worker` | The real background worker | No host port |

The data network is internal. App and gateway also join the local edge network for their published ports; that network is not an outbound policy firewall. No provider or external connector credentials are supplied, and the provided product configuration disables them. All anonymous access and default-owner creation stay disabled.

## Required images

Choose Linux images for the same supported architecture and pin **all five image references** as `repository@sha256:<64 hex characters>`. Tags, even version tags, are rejected by the helper. Images must already be available in the selected local Docker Engine; `pull_policy: never` stops automatic downloads. Review image sources, signatures, licenses, and capabilities before supplying the pins. There is no made-up digest in this package.

- **PostgreSQL:** reviewed Docker Official PostgreSQL 17 Bookworm image. It must support `POSTGRES_PASSWORD_FILE`, `pg_isready`, `psql` with `\getenv`, and its normal initialization scripts. Keep PostgreSQL 17's explicit data layout shown here; changing to another major version needs a data migration, image review, and configuration update. The official entrypoint handles an arbitrary non-root UID with its `nss_wrapper` support. [Official PostgreSQL image source](https://github.com/docker-library/postgres/blob/master/17/bookworm/docker-entrypoint.sh)
- **Object store:** reviewed SeaweedFS image with `/usr/bin/weed` and `curl`. Its `server` command must support the arguments in `compose.mjs`. The mounted filer settings keep metadata under `/data`. The master health check is only an infrastructure check; the setup job must also prove S3 access. [SeaweedFS server source](https://github.com/seaweedfs/seaweedfs/blob/master/weed/command/server.go), [container image source](https://github.com/seaweedfs/seaweedfs/blob/master/docker/Dockerfile.local), [filer settings](https://github.com/seaweedfs/seaweedfs/blob/master/docker/filer.toml)
- **App, gateway, worker:** actual reviewed product images that satisfy the contract below. `APP_IMAGE` is the release bundle's `api` image, serving the web app and API. No source mount, development shell, Docker socket, host home directory, or cloud credentials enter them.

## Product image entrypoint contract

Each image exposes `/opt/oxagen/bin/oxagen`. Commands are argv arrays, without a shell. This is a proposed integration contract for future certified product images, not a claim that the product CLI has been built.

| Command | Required result |
| --- | --- |
| `serve api`, `serve gateway`, `serve worker` | Run the named real service, handle SIGTERM, and stop owned work before exit. API/gateway listen on `OXAGEN_HTTP_PORT`; the worker has no public listener. The local Compose service `app` uses the `api` role. |
| `health --component ROLE --ready --quiet` | Exit 0 only when that service can do its job and its required storage/schema are ready. Check worker progress/lease health, not merely its PID. Never print content or keys. |
| `database migrate --no-seed` | Apply reviewed migrations once under a database lock; return nonzero on failure. Grant only needed runtime operations. Create tenant keys, IAM tables, RLS with `FORCE ROW LEVEL SECURITY`, and tested policies in the real migrations. Do not create a default admin. |
| `storage init-local --verify-roundtrip --deadline-seconds 120` | Retry readiness within 120 seconds, create the named bucket using setup credentials, then use runtime credentials to put, read, compare, and delete a unique synthetic probe. Fail on authentication errors, incorrect bytes, or cleanup failure. Repeated startup must not reset or erase existing objects. |

All product commands read password and key **files**, not secret values in environment variables. `OXAGEN_DB_*` selects the database connection; `OXAGEN_DB_PASSWORD_FILE` is the password file. Local transport is explicitly `disable-local-only`. `OXAGEN_S3_*` selects a path-style S3 endpoint and bucket. Its credential files contain `{ "accessKey": "...", "secretKey": "..." }`; only `storage-init` receives `OXAGEN_S3_ADMIN_CREDENTIALS_FILE`. Each program must reject unknown config fields and unsafe combinations rather than silently ignore them.

`local-config.json` keeps providers, connectors, external telemetry, anonymous access, raw logging, and automatic owner creation off. It requires real IAM and valid ScanReceipts. The product images must validate this contract version and apply those settings. A separate reviewed fixture/identity setup is needed to sign in; this bundle does not create a hidden login or bypass workspace policy.

Compose waits for health and successful setup before starting dependents. These gates control initial startup; the product must still handle later connection loss, fail closed, and reconnect safely. An unhealthy dependency does not itself pause or fence a running agent. [Compose startup rules](https://docs.docker.com/compose/how-tos/startup-order/)

## Prepare and check, without starting services

Use Node 22 or later and Compose v2 supporting the current Compose Specification. Copy this local bundle to a separate development directory first. Do not prepare local data inside the installed immutable build runner: generated files would change its installation digest. From your development copy:

```bash
cp .env.example .env.local
id -u
id -g
```

Edit `.env.local`: fill in the five reviewed image digests, your non-root UID/GID, and optional distinct ports. Do not add passwords to that file. Then:

```bash
node local.mjs prepare
node local.mjs validate .env.local
node local.mjs render .env.local > compose.resolved.json
docker compose --project-name oxagen-local -f compose.resolved.json config --quiet
```

`prepare` creates private local directories and random development-only credentials. It prints no values and refuses to overwrite existing state. `validate` and `render` run offline; they never pull, build, start a container, contact a provider, or certify a product image. `compose.json` is the generated unresolved template; the resolved JSON file is the configuration passed to Compose. JSON is a YAML-compatible representation, so no separate YAML parser is needed by the offline tests.

The secret directory is mode 0700 and files are mode 0600. Every service uses the same non-root host UID/GID so Compose's file bind mounts are readable without broadening permissions. Compose secrets are files, not a cloud secret manager or encrypted store. Protect the host disk and do not put these directories in a synced folder. [Compose secret files](https://docs.docker.com/compose/how-tos/use-secrets/)

## Start only when the images are ready

After offline checks and review of the real images:

```bash
docker compose --project-name oxagen-local -f compose.resolved.json up --wait --wait-timeout 180
docker compose --project-name oxagen-local -f compose.resolved.json ps
docker compose --project-name oxagen-local -f compose.resolved.json down
```

`down` retains `.local-data`; it does not erase the database. Never regenerate passwords while retaining the old database. PostgreSQL initialization runs only for an empty data directory. A failed initial migration or init script needs inspection and a deliberate recovery; no automatic reset is supplied. To discard a disposable environment, stop it first and deliberately remove **both** local state directories after checking the path and any data worth keeping.

Only synthetic development data belongs here. Local PostgreSQL, SeaweedFS, plain HTTP, and host disk files do not prove AWS RDS/S3/KMS, TLS, tenant isolation, backups, legal holds, retention, or production authorization behavior. Database runtime roles have no superuser or RLS-bypass right, but real per-record security still belongs in certified migrations and services. S3-compatible behavior must be checked against AWS separately. [SeaweedFS S3 behavior](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API)

Raw Docker logs are disabled. Diagnose failures from safe status/health results and product-owned cleaned evidence. There are no paid model calls or deployment effects in the static checks. Docker Desktop may be useful for local product development after its own qualification; it does **not** qualify or replace the build runner's separate Linux, network-isolated agent execution profile.
