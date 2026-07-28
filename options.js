let profiles = [];
let lockedDirs = new Set(); // dirs that came from auto-detect and should be locked

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderProfiles() {
  const container = document.getElementById("profileList");
  container.innerHTML = "";
  profiles.forEach((p, i) => {
    const locked = lockedDirs.has(p.dir);
    const row = document.createElement("div");
    row.className = "profile-row";
    row.innerHTML =
      `<input type="text" class="name-in" placeholder="e.g. Work" value="${esc(p.name)}" />` +
      `<div class="dir-wrap">` +
        `<input type="text" class="dir-in${locked ? " locked" : ""}" placeholder="e.g. Default" value="${esc(p.dir)}"${locked ? " readonly" : ""} />` +
        (locked ? `<button class="unlock-btn" title="Edit directory">✎</button>` : "") +
      `</div>` +
      `<button class="remove-btn" title="Remove">✕</button>`;

    row.querySelector(".name-in").addEventListener("input", (e) => {
      profiles[i] = { ...profiles[i], name: e.target.value };
    });
    row.querySelector(".dir-in").addEventListener("input", (e) => {
      profiles[i] = { ...profiles[i], dir: e.target.value };
    });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      lockedDirs.delete(p.dir);
      profiles.splice(i, 1);
      renderProfiles();
    });
    if (locked) {
      row.querySelector(".unlock-btn").addEventListener("click", () => {
        lockedDirs.delete(p.dir);
        renderProfiles();
        // focus the now-unlocked dir input
        const rows = document.querySelectorAll(".profile-row");
        rows[i]?.querySelector(".dir-in").focus();
      });
    }

    container.appendChild(row);
  });
}

function showNotice(msg, type = "warn") {
  const el = document.getElementById("notification");
  el.textContent = msg;
  el.style.display = "block";
  el.style.background = type === "ok" ? "#dcfce7" : "#fef9c3";
  el.style.borderColor = type === "ok" ? "#86efac" : "#fde047";
  el.style.color = type === "ok" ? "#14532d" : "#713f12";
}

document.getElementById("detectBtn").addEventListener("click", () => {
  const btn = document.getElementById("detectBtn");
  const status = document.getElementById("detectStatus");
  btn.disabled = true;
  btn.textContent = "Detecting…";
  status.textContent = "";

  chrome.runtime.sendMessage({ type: "DETECT_PROFILES" }, (resp) => {
    btn.disabled = false;
    btn.textContent = "🔍 Auto-detect my profiles";

    if (resp?.detected?.length) {
      profiles = resp.detected.map((d) => ({ name: d.name, dir: d.dir }));
      lockedDirs = new Set(profiles.map((p) => p.dir));
      renderProfiles();
      status.textContent = `Found ${profiles.length} profile${profiles.length !== 1 ? "s" : ""}`;
    } else {
      showNotice("Could not auto-detect profiles. You can add them manually below.");
    }
  });
});

document.getElementById("addBtn").addEventListener("click", () => {
  profiles.push({ name: "", dir: "" });
  renderProfiles();
  const rows = document.querySelectorAll(".profile-row");
  if (rows.length) rows[rows.length - 1].querySelector(".name-in").focus();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const toSave = profiles.filter((p) => p.name.trim() && p.dir.trim());
  const btn = document.getElementById("saveBtn");
  btn.disabled = true;

  chrome.runtime.sendMessage({ type: "SET_PROFILES", profiles: toSave }, () => {
    btn.disabled = false;
    showNotice(`Saved ${toSave.length} profile${toSave.length !== 1 ? "s" : ""}. Settings apply to all your Chrome profiles automatically.`, "ok");
    lockedDirs = new Set(toSave.map((p) => p.dir));
    profiles = toSave;
    renderProfiles();
    document.getElementById("doneRow").style.display = "block";
  });
});

document.getElementById("doneBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});

// Warn if the installed companion app is missing or too old to support the
// features on this page (e.g. cross-profile settings sync). Old hosts report
// no version, so they surface here automatically.
const REQUIRED_HOST_VERSION = 2;
chrome.runtime.sendMessage({ type: "PING" }, (resp) => {
  const version = resp?.hostVersion ?? 0;
  if (version >= REQUIRED_HOST_VERSION) return;

  const box = document.getElementById("hostUpdate");
  const title = document.getElementById("hostUpdateTitle");
  const body = document.getElementById("hostUpdateBody");
  const link = document.getElementById("hostUpdateLink");

  if (version === 0) {
    title.textContent = "Companion app not detected";
    body.textContent =
      "The companion app is required to open pages in other profiles. Install it to get started.";
    link.textContent = "Open setup guide →";
  } else {
    title.textContent = "Companion app update available";
    body.textContent =
      "Your installed companion app is out of date. Reinstall it to sync settings across all your Chrome profiles — otherwise the option below only applies to this profile.";
    link.textContent = "Update the companion app →";
  }

  const guideUrl = chrome.runtime.getURL("welcome.html");
  link.href = guideUrl;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: guideUrl });
  });
  box.style.display = "block";
});

// "Close after move" behavior — stored in the shared companion-app config so it
// applies to every Chrome profile on this PC (like the profile list).
chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (resp) => {
  const value = resp?.settings?.closeAfterMove || "off";
  const radio = document.querySelector(
    `input[name="closeAfterMove"][value="${value}"]`
  );
  if (radio) radio.checked = true;
});
document.querySelectorAll('input[name="closeAfterMove"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.checked) {
      chrome.runtime.sendMessage({
        type: "SET_SETTINGS",
        settings: { closeAfterMove: e.target.value },
      });
    }
  });
});

const reviewUrl = `https://chromewebstore.google.com/detail/open-in-profile/${chrome.runtime.id}/reviews`;
document.getElementById("reviewLinkOptions").href = reviewUrl;

// Load on open
chrome.runtime.sendMessage({ type: "GET_PROFILES" }, (resp) => {
  profiles = resp?.profiles ?? [];
  lockedDirs = new Set(profiles.map((p) => p.dir));
  renderProfiles();
});
