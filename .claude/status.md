# Netflix Live Translator

## Vision
Chrome extension that intercepts Korean subtitles on Netflix and replaces them with real-time English translations.

## Current State — MVP Complete
- Extension loads on Netflix, watches subtitle DOM via MutationObserver
- Korean text detected → sent to Google Cloud Translate API → English overlay replaces it
- Works in both windowed and fullscreen mode
- Subtitle timing lingers naturally (1.5s delay before clearing)
- Translation cache (500 entries) prevents redundant API calls
- Settings popup with API key input and on/off toggle

## Decisions Made
- Chrome Extension (Manifest V3)
- Google Cloud Translate API (500k chars/month free)
- Replace mode (English only, no dual subs)
- Overlay attached inside Netflix player container (required for fullscreen)
- `visibility: hidden` on Netflix's native subs (keeps DOM readable, hides visually)

## What's Next
- Nothing urgent — MVP is working and shipped to GitHub
- Potential future: support more language pairs, auto-detect source language, subtitle timing fine-tuning
