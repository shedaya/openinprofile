const HOST = "com.openinprofile.host";

function nativeMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendNativeMessage(HOST, msg, (r) =>
      resolve(chrome.runtime.lastError ? null : r)
    );
  });
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

chrome.runtime.onInstalled.addListener(rebuildMenus);
chrome.runtime.onStartup.addListener(rebuildMenus);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const dir = info.menuItemId.replace(/^profile:/, "");
  const url = info.linkUrl || tab.url;
  await nativeMessage({ action: "open_url", profile: dir, url });
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
      nativeMessage({ action: "open_url", profile: msg.profile, url: msg.url }).then((r) =>
        sendResponse({ ok: r?.status === "ok" })
      );
      return true;
  }
});
