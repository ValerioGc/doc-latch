# DocLatch

DocLatch is a lightweight desktop PDF viewer for Windows, Linux and macOS. Open several documents in tabs, navigate with smooth zoom, and protect your files with a password — everything runs on your own computer, never in the cloud.

## Key features

- **Multi-document tabs** — open several PDFs at once in separate tabs, each keeping its own current page, zoom level and password.
- **Split view** — show two open documents side by side in the same window to compare them without switching tabs.
- **Password protection** — add or remove AES-256 encryption from your documents in a couple of clicks, from the Protection menu.
- **Smooth zoom and scrolling** — navigate pages with smooth zooming: a loading indicator appears while the view is recalculated, never a blurry or clipped page.
- **Recent documents** — quickly find recently opened files from the home screen.
- **Light and dark theme** — switch between themes at any time from the settings.
- **Multilingual** — interface available in Italian, English, French and German.

## Installation

Installers for Windows (`.exe`/`.msi`), Linux (`.deb`/`.rpm`/`.AppImage`) and macOS (`.dmg`) are available from the [Releases](https://github.com/ValerioGc/doc-latch/releases) section of the repository.

> **Note:** the Windows and macOS installers aren't signed with a paid certificate yet, so it's normal for Windows SmartScreen (or Gatekeeper on macOS) to show a warning on first launch. You can proceed by choosing "More info" → "Run anyway" (Windows) or the equivalent on macOS.

## Privacy

DocLatch never uploads your files to any server: opening, browsing and password-protecting documents all happen entirely locally, with no internet connection and no usage data collection.

## Current limitations

- Handles **PDF** files only (no exporting to other formats yet).
- It's a viewer: it doesn't yet support editing page content (text/images) or reordering pages.
- The Windows and macOS installers aren't signed (see note above).

## Coming up

Planned future work includes page management and reordering, document conversion to other formats, document signing (image/text overlay), filling existing form fields (AcroForm), and a guided demo on first launch. The full, up-to-date list is in [ROADMAP.md](ROADMAP.md).

## Contributing or building from source

All technical information — stack, project structure, development commands, testing and the release process — is in [DEVELOPMENT.md](DEVELOPMENT.md).
