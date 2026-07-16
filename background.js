const HOST = "com.openinprofile.host";

function nativeMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(HOST, msg, (r) =>
      resolve(chrome.runtime.lastError ? null : r)
    );
  });
}

// Close the source tab/window after a page was opened in another profile.
// Controlled by the "closeAfterMove" setting: "off" (default), "tab", "window".
async function closeSource(tabId, windowId) {
  const { closeAfterMove = "off" } = await chrome.storage.local.get("closeAfterMove");
  try {
    if (closeAfterMove === "tab" && typeof tabId === "number") {
      await chrome.tabs.remove(tabId);
    } else if (closeAfterMove === "window" && typeof windowId === "number") {
      await chrome.windows.remove(windowId);
    }
  } catch (_e) {
    // The tab/window may already be gone; nothing to clean up.
  }
}

async function rebuildMenus() {
  const { profiles = [] } = await chrome.storage.local.get("profiles");
  await chrome.contextMenus.removeAll();
  for (const p of profiles) {
    chrome.contextMenus.create({
      id: `profile:${p.dir}`,
      title: `Open in ${p.name}`,
      contexts: ["page", "link"],
    });
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  rebuildMenus();
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});
chrome.runtime.onStartup.addListener(rebuildMenus);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const dir = info.menuItemId.replace(/^profile:/, "");
  const isLink = !!info.linkUrl;
  const url = info.linkUrl || tab?.url;
  if (!url) return;
  const r = await nativeMessage({ action: "open_url", profile: dir, url });
  // Only "move" the current page. When a link was right-clicked, the current
  // tab is a different page, so it must never be closed.
  if (r?.status === "ok" && !isLink && tab) {
    await closeSource(tab.id, tab.windowId);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case "PING":
      nativeMessage({ action: "ping" }).then((r) =>
        sendResponse({ connected: r?.status === "ok" })
      );
      return true;

    case "GET_PROFILES":
      // Read local cache; if empty, pull from native host and cache it
      chrome.storage.local.get("profiles").then(async ({ profiles = [] }) => {
        if (profiles.length === 0) {
          const r = await nativeMessage({ action: "get_profiles" });
          if (r?.status === "ok" && r.profiles?.length) {
            profiles = r.profiles;
            await chrome.storage.local.set({ profiles });
            await rebuildMenus();
          }
        }
        sendResponse({ profiles });
      });
      return true;

    case "DETECT_PROFILES":
      nativeMessage({ action: "detect_profiles" }).then((r) =>
        sendResponse(r?.status === "ok" ? { detected: r.detected } : { error: true })
      );
      return true;

    case "SET_PROFILES":
      (async () => {
        await chrome.storage.local.set({ profiles: msg.profiles });
        await nativeMessage({ action: "set_profiles", profiles: msg.profiles });
        await rebuildMenus();
        sendResponse({ ok: true });
      })();
      return true;

    case "OPEN_URL":
      nativeMessage({ action: "open_url", profile: msg.profile, url: msg.url }).then(async (r) => {
        const ok = r?.status === "ok";
        // Close the source only when the caller marked this as moving the
        // current page (msg.source). Callers that open an unrelated URL, such
        // as the "install in other profiles" buttons, omit it.
        if (ok && msg.source) {
          await closeSource(msg.source.tabId, msg.source.windowId);
        }
        sendResponse({ ok });
      });
      return true;
  }
});
