#!/bin/sh
set -eu
ADAPTER_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$ADAPTER_DIR/mtls-services.mjs" "$@"
