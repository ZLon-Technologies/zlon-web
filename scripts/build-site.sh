#!/bin/sh
set -eu

if command -v npm >/dev/null 2>&1; then
    exec npm run build
fi

if command -v pnpm >/dev/null 2>&1; then
    exec pnpm build
fi

if command -v yarn >/dev/null 2>&1; then
    exec yarn build
fi

echo "A Node.js package manager is required to build this Next.js app." >&2
exit 1
