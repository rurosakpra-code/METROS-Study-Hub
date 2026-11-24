(() => {
  const launcher = document.getElementById("ai-assistant-launch");
  const status = document.getElementById("ai-assistant-status");
  const appId = typeof window.ETHORA_APP_ID === "string" ? window.ETHORA_APP_ID.trim() : "";
  if (!launcher || !appId || appId === "YOUR_APP_ID") {
    launcher?.classList.add("hidden");
    if (!appId || appId === "YOUR_APP_ID") console.info("Ethora assistant is not loaded. Set ETHORA_APP_ID in ethora-config.js.");
    return;
  }

  let chargedForSession = false;
  let loading = false;

  function loadWidget() {
    if (document.getElementById("chat-content-assistant")) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://app.chat.ethora.com/widget/assistant.js";
      script.id = "chat-content-assistant";
      script.async = true;
      script.dataset.appId = appId;
      script.dataset.apiBase = "https://api.chat.ethora.com/v1";
      script.dataset.position = "left";
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error("The AI assistant could not be loaded. Check your connection and retry."));
      };
      document.body.appendChild(script);
    });
  }

  launcher.addEventListener("click", async () => {
    if (loading) return;
    loading = true;
    launcher.disabled = true;
    try {
      if (typeof window.medstudyCanUseAi !== "function" || !window.medstudyCanUseAi()) {
        throw new Error("The AI assistant is available to signed-in members only.");
      }
      if (!chargedForSession) {
        if (typeof window.medstudySpendAiGem !== "function") throw new Error("Gem confirmation is unavailable. Refresh and try again.");
        const approved = await window.medstudySpendAiGem();
        if (!approved) return;
        chargedForSession = true;
      }
      if (status) status.textContent = "Loading the AI assistant…";
      await loadWidget();
      launcher.classList.add("hidden");
      if (status) status.textContent = "AI assistant ready. Open it from its floating icon.";
    } catch (error) {
      console.error("Could not start the AI assistant.", error);
      launcher.textContent = chargedForSession ? "Retry loading AI assistant" : "Open AI assistant · 10 Gems";
      if (status) {
        status.textContent = chargedForSession
          ? `${error.message} Your 10-Gem session charge was already applied; retrying will not charge again.`
          : error.message;
        status.classList.add("error");
      }
    } finally {
      loading = false;
      launcher.disabled = false;
    }
  });
})();
