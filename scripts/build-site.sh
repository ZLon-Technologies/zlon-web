#!/bin/sh
set -eu

out_dir=${ZLON_BUILD_DIR:-dist}

rm -rf "$out_dir"
mkdir -p "$out_dir"

for asset in *.html *.png *.webmanifest *.js; do
    [ -f "$asset" ] || continue

    case "$asset" in
        supabase-config.js) continue ;;
    esac

    cp "$asset" "$out_dir/"
done

ZLON_CONFIG_OUTPUT="$out_dir/supabase-config.js" sh ./scripts/write-supabase-config.sh
