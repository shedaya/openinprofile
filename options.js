let profiles = [];

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
    const row = document.createElement("div");
    row.className = "profile-row";
    row.innerHTML =
      `<input type="text" class="name-in" placeholder="e.g. Work" value="${esc(p.name)}" />` +
      `<input type="text" class="dir-in"  placeholder="e.g. Default" value="${esc(p.dir)}" />` +
      `<button class="remove-btn" title="Remove">✕</button>`;

    row.querySelector(".name-in").addEventListener("input", (e) => {
      profiles[i] = { ...profiles[i], name: e.target.value };
    });
    row.querySelector(".dir-in").addEventListener("input", (e) => {
      profiles[i] = { ...profiles[i], dir: e.target.value };
    });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      profiles.splice(i, 1);
      renderProfiles();
    });

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
    showNotice(`Saved ${toSave.length} profile${toSave.length !== 1 ? "s" : ""}.`, "ok");
    profiles = toSave;
    renderProfiles();
  });
});

// Load on open
chrome.runtime.sendMessage({ type: "GET_PROFILES" }, (resp) => {
  profiles = resp?.profiles ?? [];
  renderProfiles();
});
