# Open in Profile

Send any Chrome tab or link to another Chrome profile — right-click or toolbar button.

## Setup

**1. Load the extension**
- Chrome → Extensions → Manage Extensions → enable **Developer mode**
- **Load unpacked** → select the `extension` folder
- A setup guide opens automatically

**2. Install the companion app**
- Put the `native-host` folder somewhere permanent (e.g. `C:\OpenInProfile\`)
- Double-click `install.bat`
- Paste your Extension ID from the setup guide when prompted

**3. Configure profiles**
- Click the ⇄ toolbar icon → **Manage profiles**
- Click **Auto-detect my profiles** — done

Install the extension in each Chrome profile (Load unpacked, same folder = same Extension ID). The companion app and profile settings are shared automatically — nothing else to configure.

## How it works

Chrome extensions can't open URLs in a different profile directly. The companion app (`host.ps1`) bridges this by receiving a message from the extension and launching `chrome.exe --profile-directory="..." "url"`. Profile settings are stored in `%APPDATA%\OpenInProfile\profiles.json` — one file, shared by all profiles.

## Files

```
extension/          ← Chrome extension (load unpacked)
native-host/
  host.ps1          ← PowerShell companion app
  host_launcher.bat ← Entry point called by Chrome
  install.bat       ← One-time installer
```

## Privacy

No data is collected or transmitted. Everything runs locally on your PC.
