// Netflix Live Translator — Content Script
// Hides Korean subtitles and shows translated English overlay

(function () {
  "use strict";

  let apiKey = null;
  let enabled = true;
  const translationCache = new Map();
  const pendingTranslations = new Map(); // text -> Promise
  let overlay = null;
  let lastKoreanText = "";
  let hideTimer = null;

  // Load API key from storage
  chrome.storage.sync.get(["gcloudApiKey", "enabled"], (result) => {
    apiKey = result.gcloudApiKey || null;
    enabled = result.enabled !== false;
    if (apiKey && enabled) {
      init();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.gcloudApiKey) {
      apiKey = changes.gcloudApiKey.newValue;
    }
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
    }
    if (apiKey && enabled) {
      init();
    } else {
      // Disabled — remove overlay and unhide Netflix subs
      if (overlay) overlay.remove();
      overlay = null;
      document.body.classList.remove("nlt-active");
    }
  });

  // Google Cloud Translation API call
  function translateText(text) {
    if (translationCache.has(text)) {
      return Promise.resolve(translationCache.get(text));
    }

    if (pendingTranslations.has(text)) {
      return pendingTranslations.get(text);
    }

    const promise = (async () => {
      try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: text,
            source: "ko",
            target: "en",
            format: "text",
          }),
        });

        if (!response.ok) {
          console.error("[NLT] Translation API error:", response.status);
          return null;
        }

        const data = await response.json();
        const translated = data.data.translations[0].translatedText;
        translationCache.set(text, translated);

        // Cap cache
        if (translationCache.size > 500) {
          const firstKey = translationCache.keys().next().value;
          translationCache.delete(firstKey);
        }

        return translated;
      } catch (err) {
        console.error("[NLT] Translation failed:", err);
        return null;
      } finally {
        pendingTranslations.delete(text);
      }
    })();

    pendingTranslations.set(text, promise);
    return promise;
  }

  // Create our subtitle overlay — inside the player so it works in fullscreen
  function createOverlay() {
    if (overlay && overlay.isConnected) return;
    overlay = document.createElement("div");
    overlay.id = "nlt-overlay";
    // Try to place inside Netflix's player (required for fullscreen)
    const player =
      document.querySelector(".watch-video--player-view") ||
      document.querySelector("[data-uia='video-canvas']") ||
      document.querySelector(".VideoContainer") ||
      document.body;
    player.appendChild(overlay);
  }

  // Re-attach overlay when entering/exiting fullscreen
  document.addEventListener("fullscreenchange", () => {
    if (overlay) overlay.remove();
    overlay = null;
    createOverlay();
  });

  function showTranslation(text) {
    if (!overlay) createOverlay();
    if (hideTimer) clearTimeout(hideTimer);
    overlay.textContent = text;
    overlay.style.display = "block";
  }

  function hideTranslation() {
    // Don't hide immediately — Netflix briefly clears the container between lines.
    // Delay so subs linger naturally like Netflix's own timing.
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (overlay) {
        overlay.textContent = "";
        overlay.style.display = "none";
      }
    }, 1500);
  }

  // Extract text from Netflix subtitle elements
  function extractSubtitleText(container) {
    // Netflix structure: container > div[dir] > span > span
    // Grab the direct child divs to avoid duplicate nested text
    const lines = container.querySelectorAll(":scope > div");
    if (lines.length > 0) {
      return Array.from(lines)
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .join(" ");
    }
    return container.textContent.trim();
  }

  // Check if text contains Korean
  function isKorean(text) {
    return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
  }

  // Process subtitle changes
  async function handleSubtitleChange() {
    if (!apiKey || !enabled) return;

    // Find Netflix's subtitle container
    const subtitleContainer =
      document.querySelector(".player-timedtext-text-container") ||
      document.querySelector("[data-uia='player-timedtext']") ||
      document.querySelector(".player-timedtext");

    if (!subtitleContainer) {
      hideTranslation();
      return;
    }

    const koreanText = extractSubtitleText(subtitleContainer);

    // No subtitle or same as last one
    if (!koreanText) {
      hideTranslation();
      lastKoreanText = "";
      return;
    }

    // Same text, already handled
    if (koreanText === lastKoreanText) return;
    lastKoreanText = koreanText;

    // Not Korean — leave it alone
    if (!isKorean(koreanText)) {
      hideTranslation();
      return;
    }

    // If we have a cached translation, show it instantly
    if (translationCache.has(koreanText)) {
      showTranslation(translationCache.get(koreanText));
      return;
    }

    // Translate — the Korean subs are hidden by CSS so user sees nothing while waiting
    const translated = await translateText(koreanText);
    // Make sure this is still the current subtitle
    if (translated && koreanText === lastKoreanText) {
      showTranslation(translated);
    }
  }

  let observer = null;

  function init() {
    if (observer) return;

    // Add class to body to activate our CSS (hides Netflix subs)
    document.body.classList.add("nlt-active");
    createOverlay();

    observer = new MutationObserver(() => {
      handleSubtitleChange();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    console.log("[NLT] Netflix Live Translator active — Korean subs hidden, English overlay on");
  }
})();
