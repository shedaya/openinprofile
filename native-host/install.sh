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
