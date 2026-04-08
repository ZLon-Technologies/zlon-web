#!/bin/sh
set -eu

if [ -f .env ]; then
    . ./.env
fi

if [ -f .env.local ]; then
    . ./.env.local
fi

: "${ZLON_SUPABASE_URL:?Missing ZLON_SUPABASE_URL}"
: "${ZLON_SUPABASE_ANON_KEY:?Missing ZLON_SUPABASE_ANON_KEY}"

escape_js_string() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

supabase_url=$(escape_js_string "$ZLON_SUPABASE_URL")
supabase_anon_key=$(escape_js_string "$ZLON_SUPABASE_ANON_KEY")
config_output=${ZLON_CONFIG_OUTPUT:-supabase-config.js}
config_dir=$(dirname "$config_output")

mkdir -p "$config_dir"

cat > "$config_output" <<EOF
window.ZLon = window.ZLon || {};
window.ZLon.supabaseConfig = {
    url: "${supabase_url}",
    anonKey: "${supabase_anon_key}"
};
EOF
