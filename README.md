# DocLatch

DocLatch is a lightweight desktop PDF viewer for Windows and Linux. Open several documents in tabs, navigate with smooth zoom, and protect your files with a password — everything runs on your own computer, never in the cloud.

## Key features

- **Multi-document tabs** — open several PDFs at once in separate tabs, each keeping its own current page, zoom level and password.
- **Split view** — show two open documents side by side in the same window to compare them without switching tabs.
- **Password protection** — add or remove AES-256 encryption from your documents in a couple of clicks, from the Protection menu.
- **Smooth zoom and scrolling** — navigate pages with smooth zooming: a loading indicator appears while the view is recalculated, never a blurry or clipped page.
- **Recent documents** — quickly find recently opened files from the home screen.
- **Light and dark theme** — switch between themes at any time from the settings.
- **Text size** — choose between three interface text sizes (small, medium, large) from the settings.
- **Multilingual** — interface available in Italian, English, French and German.

## Installation

Download the installer for your platform from the [Releases](https://github.com/ValerioGc/doc-latch/releases) section:

| Platform | File |
|----------|------|
| Windows | `DocLatch_x.x.x_windows_x64.exe` |
| Linux | `DocLatch_x.x.x_linux_x64_portable.AppImage` |

> **Note:** the Windows installer is not signed with a paid certificate yet, so Windows SmartScreen may show a warning on first launch. You can proceed by choosing "More info" → "Run anyway".

### Linux — AppImage

The Linux release is a self-contained portable binary that runs on any distribution without installation:

```bash
chmod +x DocLatch_x.x.x_linux_x64_portable.AppImage
./DocLatch_x.x.x_linux_x64_portable.AppImage
```

## Privacy

DocLatch never uploads your files to any server: opening, browsing and password-protecting documents all happen entirely locally, with no internet connection and no usage data collection.

## Current limitations

- Handles **PDF** files only (no exporting to other formats yet).
- It's a viewer: it doesn't yet support editing page content (text/images) or reordering pages.
- The Windows installer isn't signed (see note above).
- macOS is not yet supported.

## Coming up

Planned future work includes page management and reordering, document conversion to other formats, document signing (image/text overlay), filling existing form fields (AcroForm), and a guided demo on first launch.

## Contributing or building from source

All technical information — stack, project structure, development commands, testing and the release process — is in [DEVELOPMENT.md](DEVELOPMENT.md).
