#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
repro_file=$(mktemp tests/allowed-date-gap.XXXXXX.spec.ts)
trap 'rm -f -- "$repro_file"' EXIT
cp -- .lavish/allowed-date-gap.repro.ts "$repro_file"
npm run test -- "$repro_file"
