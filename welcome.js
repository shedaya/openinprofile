document.getElementById("extId").textContent = chrome.runtime.id;

if (new URLSearchParams(location.search).get("error") === "1") {
  document.getElementById("errorBanner").style.display = "block";
}

const storeUrl = `https://chromewebstore.google.com/detail/open-in-profile/${chrome.runtime.id}`;

chrome.runtime.sendMessage({ type: "PING" }, (resp) => {
  if (resp?.connected) {
    chrome.runtime.sendMessage({ type: "GET_PROFILES" }, (r) => {
      if (r?.profiles?.length) {
        // Fully set up — show all-done banner
        document.getElementById("allDone").style.display = "block";
        document.getElementById("step2").classList.add("done");
        document.getElementById("num2").textContent = "";
        document.getElementById("step3").classList.add("done");
        document.getElementById("num3").textContent = "";

        // Show "install in other profiles" buttons if multiple profiles configured
        const profiles = r.profiles;
        if (profiles.length > 1) {
          document.getElementById("otherProfiles").style.display = "block";
          const btns = document.getElementById("profileInstallBtns");
          for (const p of profiles) {
            const btn = document.createElement("button");
            btn.className = "install-btn";
            btn.textContent = `⇄ Install in ${p.name}`;
            btn.addEventListener("click", () => {
              chrome.runtime.sendMessage({
                type: "OPEN_URL",
                profile: p.dir,
                url: storeUrl,
              });
              btn.textContent = `✓ Opened ${p.name}`;
              btn.disabled = true;
            });
            btns.appendChild(btn);
          }
        }
      } else {
        // Host connected but no profiles yet
        document.getElementById("step2").classList.add("done");
        document.getElementById("num2").textContent = "";
      }
    });
  }
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
