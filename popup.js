// Netflix Live Translator — Popup Script

const apiKeyInput = document.getElementById("apiKey");
const enabledToggle = document.getElementById("enabled");
const saveButton = document.getElementById("save");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get(["gcloudApiKey", "enabled"], (result) => {
  if (result.gcloudApiKey) {
    apiKeyInput.value = result.gcloudApiKey;
  }
  enabledToggle.checked = result.enabled !== false;
});

// Save settings
saveButton.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    statusEl.textContent = "Please enter an API key";
    statusEl.className = "status error";
    return;
  }

  chrome.storage.sync.set(
    {
      gcloudApiKey: key,
      enabled: enabledToggle.checked,
    },
    () => {
      statusEl.textContent = "Saved! Reload your Netflix tab.";
      statusEl.className = "status success";
      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "status";
      }, 3000);
    }
  );
});

// Also save when toggle changes
enabledToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked });
});
