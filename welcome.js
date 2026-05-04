document.getElementById("extId").textContent = chrome.runtime.id;

if (new URLSearchParams(location.search).get("error") === "1") {
  document.getElementById("errorBanner").style.display = "block";
}

chrome.runtime.sendMessage({ type: "PING" }, (resp) => {
  if (resp?.connected) {
    chrome.runtime.sendMessage({ type: "GET_PROFILES" }, (r) => {
      if (r?.profiles?.length) {
        document.getElementById("allDone").style.display = "block";
        document.getElementById("step2").classList.add("done");
        document.getElementById("num2").textContent = "";
        document.getElementById("step3").classList.add("done");
        document.getElementById("num3").textContent = "";
      } else {
        document.getElementById("step2").classList.add("done");
        document.getElementById("num2").textContent = "";
      }
    });
  }
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
