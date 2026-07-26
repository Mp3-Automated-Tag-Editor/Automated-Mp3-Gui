<p align="center">
  <img src="https://github.com/user-attachments/assets/01400821-1d5c-4c67-b315-fce2c7604288" alt="Automated MP3 Tag Editor GUI" />
</p>

<p align="center">
  <a href="https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui">GitHub</a> ·
  <a href="https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/releases">Releases</a> ·
  <a href="https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/issues">Issues</a>
  <br /><br />
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui">
  <img alt="GitHub license" src="https://img.shields.io/github/license/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui">
</p>

# Automated MP3 Tag Editor GUI

Local desktop app (**Tauri** + **Next.js** + **Rust**) for scanning a music library, scraping metadata from a companion API, editing tags/cover art, downloading tracks, and browsing library stats.

**Current version:** `2.0.1-beta`

---

## What it does

| Area | Capability |
|------|------------|
| **Library** | Pick a folder, scan MP3s into a local SQLite cache, refresh individual tracks |
| **Scrape** | Batch-fetch metadata via an external scrape API; **review** suggestions or **apply** tags immediately |
| **Edit** | Manual tag edits, embed/replace album art (ID3v2.3 + JPEG), fetch art from a URL |
| **Download** | YouTube/other URLs via **yt-dlp**; Spotify via **spotDL** |
| **Player** | Built-in library playback (Windows taskbar media controls when available) |
| **Stats** | Library summaries, genre/artist breakdowns, artist-country map (MusicBrainz) |
| **Settings** | Thread count, scrape providers, scrape mode, library path, appearance |

App data lives under `~/.config/auto-mp3` (on Windows: `%USERPROFILE%\.config\auto-mp3`).

---

## Prerequisites

- [Node.js](https://nodejs.org/) (18+ recommended)
- [Rust](https://www.rust-lang.org/tools/install) + [Tauri v1 system deps](https://v1.tauri.app/v1/guides/getting-started/prerequisites/)
- A running **scrape API** reachable from this app (see env below)
- For downloads only:
  - [ffmpeg](https://ffmpeg.org/) on `PATH`
  - Sidecar binaries in `bin/` (see [Download sidecars](#download-sidecars))

---

## Setup

```bash
git clone https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui
cd Automated-Mp3-Gui
npm install
```

### Environment

Create `.env.development` at the **repo root** (or in `src-tauri/`):

```env
ENV=development
DEV_API_ENDPOINT=http://127.0.0.1:8000/api/scrape/
HEALTH_ENDPOINT=http://127.0.0.1:8000/api/
```

| Variable | Used for |
|----------|----------|
| `DEV_API_ENDPOINT` | POST target for per-track scrape requests (must be a valid URL; trailing path is fine) |
| `HEALTH_ENDPOINT` | Base URL for `/health` checks in the UI |
| `ENV` | Optional label logged at startup |

**Production builds** compile in `src-tauri/.env.production` (same keys). That file must exist before `npm run tauri build`.

### Download sidecars

Windows (from repo root):

```powershell
npm run fetch:sidecars
```

This places `bin/yt-dlp-x86_64-pc-windows-msvc.exe` and `bin/spotdl-x86_64-pc-windows-msvc.exe` for Tauri `externalBin`. Other platforms: put matching `yt-dlp` / `spotdl` binaries under `bin/` per [Tauri externalBin naming](https://v1.tauri.app/v1/guides/building/sidecar/).

### Run / build

```bash
npm run tauri dev      # development
npm run tauri build    # production installer / binary
```

---

## Usage

1. Set a **library folder** (Edit or Settings).
2. Wait for the scan to finish (progress events update the UI).
3. **Scrape** incomplete tracks — choose review (suggestions only) or apply (write tags to disk).
4. Review/edit tags and cover art on the Edit page; save when ready.
5. Optional: **Download** into the library; **Music** to play; **Statistics** for overview.

Scraping will fail if `DEV_API_ENDPOINT` is unset or the API is down. Local edit/playback/library scan work without it.

---

## Screenshots

<img width="1562" height="900" alt="Dashboard" src="https://github.com/user-attachments/assets/77a3074b-799f-40a5-9218-ab470510a1c1" />
<img width="1562" height="900" alt="Edit" src="https://github.com/user-attachments/assets/a36b69e1-2c09-4496-b3b1-81ec32918e30" />
<img width="1602" height="1046" alt="Library" src="https://github.com/user-attachments/assets/7707c91c-4238-4cc4-8e26-5b660af89cd9" />
<img width="1491" height="992" alt="Player" src="https://github.com/user-attachments/assets/a85a1113-4114-49db-ada2-9d571d26a43d" />
<img width="1562" height="900" alt="Stats" src="https://github.com/user-attachments/assets/16260b30-2cc7-432f-a938-3fda5352209c" />
<img width="1811" height="1061" alt="Download" src="https://github.com/user-attachments/assets/00b77b91-f5e1-4dab-9e6b-d257d7150c1c" />

---

## Stack

- **UI:** React, TypeScript, Tailwind, Next.js
- **Shell:** Tauri 1.x
- **Tags:** Lofty / ID3 (JPEG APIC, ID3v2.3 for player compatibility)
- **Local data:** SQLite library cache + scrape response cache under `~/.config/auto-mp3`

---

## License

MIT © Mp3 Automated Tag Editor. See [LICENSE](LICENSE).
