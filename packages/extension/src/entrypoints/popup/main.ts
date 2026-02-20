import { getSettings, saveSettings } from "@/utils/storage";

const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const settingsView = document.getElementById("settings-view") as HTMLElement;
const mainView = document.getElementById("main-view") as HTMLElement;
const toggleSettingsBtn = document.getElementById("toggle-settings") as HTMLButtonElement;
const apiUrlInput = document.getElementById("api-url") as HTMLInputElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const saveSettingsBtn = document.getElementById("save-settings-btn") as HTMLButtonElement;
const settingsStatusEl = document.getElementById("settings-status") as HTMLParagraphElement;

let settingsVisible = false;

// Load saved settings into inputs
async function loadSettings() {
  const settings = await getSettings();
  apiUrlInput.value = settings.apiUrl;
  apiKeyInput.value = settings.apiKey;

  // If no settings configured, show settings view by default
  if (!settings.apiUrl || !settings.apiKey) {
    showSettings(true);
  }
}

function showSettings(show: boolean) {
  settingsVisible = show;
  settingsView.hidden = !show;
  mainView.hidden = show;
  toggleSettingsBtn.textContent = show ? "Back" : "Settings";
}

function showStatus(el: HTMLParagraphElement, message: string, type: "success" | "error") {
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}

// Toggle between main view and settings
toggleSettingsBtn.addEventListener("click", () => {
  showSettings(!settingsVisible);
});

// Save settings
saveSettingsBtn.addEventListener("click", async () => {
  const url = apiUrlInput.value.trim();
  const key = apiKeyInput.value.trim();

  if (!url) {
    showStatus(settingsStatusEl, "API URL is required.", "error");
    return;
  }
  if (!key) {
    showStatus(settingsStatusEl, "API key is required.", "error");
    return;
  }

  await saveSettings({ apiUrl: url, apiKey: key });
  showStatus(settingsStatusEl, "Settings saved!", "success");

  setTimeout(() => {
    settingsStatusEl.hidden = true;
    showSettings(false);
  }, 1000);
});

// Save current page via background script
saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";
  statusEl.hidden = true;

  try {
    const result = await browser.runtime.sendMessage({ type: "save-current-page" }) as { ok?: boolean; error?: string };
    if (result?.ok) {
      showStatus(statusEl, "Saved!", "success");
    } else {
      showStatus(statusEl, result?.error ?? "Unknown error.", "error");
    }
  } catch (e) {
    showStatus(statusEl, `Error: ${e instanceof Error ? e.message : String(e)}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save This Page";
  }
});

// Initialize
loadSettings();
