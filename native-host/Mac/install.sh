#!/bin/bash

echo ""
echo "  ====================================================="
echo "    Open in Profile -- Companion App Installer (Mac)"
echo "  ====================================================="
echo ""
echo "  This installs the small helper that lets Chrome"
echo "  open links in a different profile."
echo ""
echo "  You'll need your Extension ID from Chrome."
echo "  (The welcome page inside the extension shows it.)"
echo ""

# The host runs on Apple's /usr/bin/python3, which is only a stub until the
# Command Line Tools are installed. Chrome launches native hosts with a minimal
# PATH, so test python3 exactly the way it will be resolved at runtime.
if ! PATH=/usr/bin:/bin:/usr/sbin:/sbin python3 -c 'import sys' >/dev/null 2>&1; then
    echo "  ERROR: Python 3 isn't available on this Mac yet."
    echo ""
    echo "  The companion app needs Apple's Command Line Tools (which"
    echo "  include Python 3). Install them by running this in Terminal:"
    echo ""
    echo "      xcode-select --install"
    echo ""
    echo "  Follow the prompt, then re-run this installer."
    exit 1
fi

read -p "  Paste Extension ID and press Enter: " EXT_ID

if [ -z "$EXT_ID" ]; then
    echo ""
    echo "  ERROR: No Extension ID entered."
    exit 1
fi

# Validate: exactly 32 characters
if [ ${#EXT_ID} -ne 32 ]; then
    echo ""
    echo "  WARNING: That doesn't look like a valid Extension ID."
    echo "  It should be 32 lowercase letters, e.g.:"
    echo "    abcdefghijklmnopabcdefghijklmnop"
    echo ""
    read -p "  Continue anyway? (y/n): " CONT
    if [[ "$CONT" != "y" && "$CONT" != "Y" ]]; then
        exit 1
    fi
fi

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
LAUNCHER="$INSTALL_DIR/host_launcher.sh"
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
MANIFEST="$MANIFEST_DIR/com.openinprofile.host.json"

echo ""
echo "  Setting permissions..."
# Files downloaded from the web carry the com.apple.quarantine flag, and
# Gatekeeper can silently refuse to run a quarantined host_launcher.sh when
# Chrome spawns it. Clear it (the Mac equivalent of Windows "Unblock").
xattr -dr com.apple.quarantine "$INSTALL_DIR" 2>/dev/null || true
chmod +x "$LAUNCHER"
chmod +x "$INSTALL_DIR/host.py"

echo "  Writing manifest..."
mkdir -p "$MANIFEST_DIR"

cat > "$MANIFEST" <<EOF
{
  "name": "com.openinprofile.host",
  "description": "Open in Profile native messaging host",
  "path": "$LAUNCHER",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXT_ID/"
  ]
}
EOF

echo ""
echo "  ====================================================="
echo "    Done! Installation successful."
echo "  ====================================================="
echo ""
echo "  Next steps:"
echo "    1. Go to Chrome Extensions and click the reload"
echo "       icon on 'Open in Profile'"
echo "    2. Click the arrow icon in your toolbar"
echo "    3. Go to Manage Profiles and click"
echo "       'Auto-detect my profiles'"
echo ""
