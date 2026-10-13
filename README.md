# Whiteboard for Mac

Offline drawing app for macOS (₦1,000 one-time per Mac). Electron wrapper around the Whiteboard board.

- `main.js` / `preload.js` / `activate.html` — app shell, activation window, bridges
- `board.html` — the board UI (Mac copy; view-only until activated, same as Windows)
- `license.js` — RSA signature verification (public key only; private key stays with the seller)
- `test-license.js` — `node test-license.js <code> <pid>` (needs a seller-made code)
- `icon.icns` — app icon (built from the Windows .ico via `build-icns.ps1`)
- `.github/workflows/build-mac.yml` — builds signed-structure-correct `.dmg` + `.zip` on GitHub macOS runners

## Release a new Mac version

1. Push to `main`, then: `gh workflow run build-mac` (or use the Actions tab).
2. Download the `mac-dist` artifacts (arm64 + x64 dmg/zip).
3. Attach them to a GitHub Release and link the release files from the download site.

Built artifacts are unsigned (no Apple Developer cert): on first run users right-click → Open.
macOS 11+ required (Electron 44).

© 2026 ststudiosng. Whiteboard™ is a trademark of ststudiosng.
