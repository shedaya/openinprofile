# Chrome Web Store — Listing Copy

Reference copy of the live listing. The store description box is plain text, so the
**Full Description** below is written to be pasted in as-is.

---

## Name
Open in Profile

---

## Short Description (132 chars max)

Pulled "from package" — this is the `description` in `manifest.json`:

Send any tab or link to another Chrome profile instantly. Right-click or click the toolbar icon.

---

## Full Description (paste-ready)

Send any tab or link to another Chrome profile. Right-click or click the toolbar icon — done.
Keep your logins and tabs separated between work, school and personal, and fix the "logged into the wrong account" annoyance.

How it works
→ Right-click any page or link and choose "Open in Work", "Open in Personal", etc.
→ Or click the ⇄ toolbar button to send the current tab with one click.
→ The page opens immediately in the correct profile.
→ Optionally close the original tab or window automatically, so nothing is left behind in the old profile.

Key features
• Works on any page or link — right-click context menu and toolbar popup
• Optional auto-close — after sending a page, close the original tab or window so you're not left with it open in the wrong profile
• Configure your profiles once — all your Chrome windows share the same settings automatically
• Auto-detects your Chrome profiles — no need to look up profile folder names manually
• Rename profiles in one place — the change applies everywhere instantly
• Clean, modern setup guide walks you through installation step by step

What's the companion app?
Chrome extensions can't directly control other Chrome profiles, so Open in Profile uses a small companion helper (a PowerShell script) that runs silently on your PC when needed. The included installer sets everything up in about 2 minutes — no technical knowledge required.
The companion app is open source and available on GitHub. It stores your profile names and preferences in a couple of small files on your computer and sends no data anywhere.
Download the companion app: https://github.com/shedaya/openinprofile/releases/latest

Requirements
• Windows 10 or 11
• Google Chrome
• One-time companion app installation (link above)

Support & source code
https://github.com/shedaya/openinprofile

---

## Category
Workflow & Planning

## Language
English (United States)

---

## Store listing keywords / tags
chrome profiles, multiple profiles, switch profiles, open in profile, tab management, profile switcher, work personal, multi-profile, close tab, wrong account

---

## Screenshot captions (for the 5 required screenshots)

1. **Right-click any page** — "The context menu appears on any page or link. Choose which profile to open it in."
2. **Toolbar popup** — "Click the ⇄ icon to send the current tab to another profile with one click."
3. **Auto-detect profiles** — "The extension reads your Chrome profiles automatically — no manual setup."
4. **Manage profiles** — "Rename profiles and choose whether to auto-close the original tab or window. Every Chrome window sees the change instantly."
5. **Setup guide** — "A clear step-by-step guide walks you through the one-time companion app installation."

Optional 6th: **Auto-close option** — "Pick 'Close the original tab' or 'Close the original window' so nothing is left open in the wrong profile."

---

## Privacy policy (required — suggested short version for GitHub Pages)

Open in Profile does not collect, transmit, or store any personal data.

The extension communicates only with a locally installed companion app on your own computer. Your profile names and preferences are stored in local files (`%APPDATA%\OpenInProfile\profiles.json` and `settings.json`) and are never sent to any server.

No analytics, no tracking, no ads.

---

## Not yet in the listing (deliberately)

**macOS.** A Mac companion app ships in `native-host/Mac/`, but it is not advertised yet: it
depends on `python3`, which on a clean Mac requires Xcode Command Line Tools, and it has not
been verified on real hardware. Add `• Windows 10/11 or macOS` to Requirements and drop the
"PowerShell script" wording only after the Mac host is hardened and tested on a Mac.
