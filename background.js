{
  "manifest_version": 3,
  "name": "Open in Profile",
  "version": "2.0",
  "description": "Send any tab or link to another Chrome profile instantly. Right-click or click the toolbar icon.",
  "permissions": ["contextMenus", "tabs", "nativeMessaging", "scripting"],
  "host_permissions": ["<all_urls>"],
  "options_page": "options.html",
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Open in Profile",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
