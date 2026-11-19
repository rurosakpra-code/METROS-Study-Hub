(() => {
  const appId = typeof window.ETHORA_APP_ID === "string" ? window.ETHORA_APP_ID.trim() : "";
  if (!appId || appId === "YOUR_APP_ID") {
    console.info("Ethora assistant is not loaded. Set ETHORA_APP_ID in ethora-config.js.");
    return;
  }

  const script = document.createElement("script");
  script.src = "https://app.chat.ethora.com/widget/assistant.js";
  script.id = "chat-content-assistant";
  script.async = true;
  script.dataset.appId = appId;
  script.dataset.apiBase = "https://api.chat.ethora.com/v1";
  script.dataset.position = "left";
  document.body.appendChild(script);
})();
