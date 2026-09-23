document.getElementById("manageBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

const storeUrl = `https://chromewebstore.google.com/detail/open-in-profile/${chrome.runtime.id}`;
const reviewUrl = `${storeUrl}/reviews`;

document.getElementById("reviewLinkPopup").href = reviewUrl;

function setInstallLabel(btn, prefix, name) {
  btn.textContent = "";
  btn.append(`${prefix} `);
  const b = document.createElement("b");
  b.textContent = name;
  btn.append(b);
}

chrome.runtime.sendMessage({ type: "GET_PROFILES" }, (resp) => {
  const profiles = resp?.profiles ?? [];
  const list = document.getElementById("list");

  if (profiles.length === 0) {
    list.innerHTML =
      '<div class="empty">No profiles configured.<br>' +
      '<button id="setupBtn">Run setup</button></div>';
    document.getElementById("setupBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
      window.close();
    });
    return;
  }

  for (const p of profiles) {
    const btn = document.createElement("button");
    btn.className = "profile-btn";
    btn.textContent = `→ ${p.name}`;
    btn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.runtime.sendMessage({
          type: "OPEN_URL",
          profile: p.dir,
          url: tab.url,
          source: { tabId: tab.id, windowId: tab.windowId },
        });
        window.close();
      });
    });
    list.appendChild(btn);
  }

  // Show "install in other profiles" section if more than one profile
  if (profiles.length > 1) {
    document.getElementById("installSection").style.display = "block";

    const toggle = document.getElementById("installToggle");
    const btns = document.getElementById("installBtns");
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      btns.classList.toggle("open", !expanded);
    });

    for (const p of profiles) {
      const btn = document.createElement("button");
      btn.className = "install-btn";
      setInstallLabel(btn, "Install in", p.name);
      btn.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          type: "OPEN_URL",
          profile: p.dir,
          url: storeUrl,
        });
        setInstallLabel(btn, "✓ Opened", p.name);
        btn.disabled = true;
      });
      btns.appendChild(btn);
    }
  }
});
