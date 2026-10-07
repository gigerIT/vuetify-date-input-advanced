#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
# The implemented fix is covered by the maintained component regression suite.
exec npm run test -- tests/components/allowedDateGaps.spec.ts
