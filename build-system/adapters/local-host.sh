#!/bin/sh
set -eu
exec node "$(dirname "$0")/local-host.mjs" "$@"
