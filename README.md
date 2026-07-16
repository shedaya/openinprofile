# Open in Profile

Send any Chrome tab or link to another Chrome profile — right-click or toolbar button.

## Setup

**1. Install the extension**
- Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/open-in-profile/lnnalmbekphgipfkdhhbjdnmjnnalggb)
- A setup guide opens automatically

**2. Install the companion app**
- Download `open-in-profile.zip` from the [latest release](https://github.com/shedaya/openinprofile/releases/latest) and unzip it
- Put the `native-host` folder somewhere permanent (e.g. `C:\OpenInProfile\`)
- Double-click `install.bat` inside that folder
- Paste your Extension ID from the setup guide when prompted

**3. Configure profiles**
- Click the ⇄ toolbar icon → **Manage profiles**
- Click **Auto-detect my profiles** — done

The companion app and profile settings are shared across all your Chrome profiles automatically — nothing else to configure.

**Optional: close the old window after moving**

By default, moving a page to another profile opens it in the new profile and leaves the current window open. To close the source instead, open **Manage profiles** and, under **When opening in another profile**, choose *Close the original tab* or *Close the original window*. This applies when you move the current page (toolbar popup or right-click **Open in …** on a page) — right-clicking a link never closes anything. The preference is saved per Chrome profile.

## How it works

Chrome extensions can't open URLs in a different profile directly. The companion app (`host.ps1`) bridges this by receiving a message from the extension and launching `chrome.exe --profile-directory="..." "url"`. Profile settings are stored in `%APPDATA%\OpenInProfile\profiles.json` — one file, shared by all profiles.

## Files

```
native-host/
  host.ps1                    ← PowerShell companion app
  host_launcher.bat           ← Entry point called by Chrome
  install.bat                 ← One-time installer
  com.openinprofile.host.json ← Native messaging manifest (written by install.bat)
```

## Privacy

No data is collected or transmitted. Everything runs locally on your PC.
