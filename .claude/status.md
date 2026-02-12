# Netflix Live Translator

## Vision
Chrome extension that intercepts Korean subtitles on Netflix and replaces them with real-time English translations using Google Cloud Translate API.

## Current State
- Building MVP Chrome extension
- Core files created: manifest.json, content.js, styles.css, popup.html/js
- Translation: Google Cloud Translate API (Korean → English)
- Display mode: Replace Korean with English (clean look)

## Decisions Made
- Chrome Extension (Manifest V3)
- Google Cloud Translate API (Scott's choice)
- Replace mode, not dual-subtitle mode
- MutationObserver watching Netflix's `.player-timedtext-text-container` for subtitle changes
- Translation cache (500 entries max) to avoid redundant API calls

## What's Next
- Generate extension icons
- Test on actual Netflix page
- Scott needs a Google Cloud API key with Translation API enabled

## Open Questions
- Does Scott already have a Google Cloud account/API key?
