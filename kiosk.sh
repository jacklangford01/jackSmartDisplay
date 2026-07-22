#!/bin/bash

# TODO: Set this to a default, but allow easy override by passing a parameter or
# using the environment variable KIOSK_URL.
KIOSK_URL="${KIOSK_URL:-http://localhost:3000}"

# Wait for services to come online.
# TODO: It would be nice to get rid of this, but right now on Bookworm, if we
# don't wait, there are errors at boot and you have to start kiosk manually.
sleep 8

echo 'Starting Chromium...'

if command -v chromium >/dev/null 2>&1; then
    CHROMIUM_BIN="$(command -v chromium)"
elif command -v chromium-browser >/dev/null 2>&1; then
    CHROMIUM_BIN="$(command -v chromium-browser)"
else
    echo 'Chromium executable not found.' >&2
    exit 127
fi

# Replace this shell with Chromium so systemd tracks crashes and OOM kills
# directly and can restart the kiosk reliably.
exec "$CHROMIUM_BIN" \
    --ozone-platform=wayland \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --no-first-run \
    --kiosk \
    --app="$KIOSK_URL"
