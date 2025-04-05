<p align="center">
  <a href="https://github.com/your-username/mp3-tag-editor-gui">
    <img src="https://github.com/user-attachments/assets/01400821-1d5c-4c67-b315-fce2c7604288" alt="Automated MP3 Tag Editor GUI" />
  </a>
</p>
&nbsp;

<p align="center">
    <a href="https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/">GitHub</a> •
    <a href="#">Docs</a> •
    <a href="#">Contributing</a> •
    <a href="#">Releases</a> •
    <a href="#">Discord</a>
    <br /><br />
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui?style=social">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui">
    <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui">
    <img alt="GitHub license" src="https://img.shields.io/github/license/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui"> 
</p>

# 🎧 Automated MP3 Tag Editor GUI
Your sleek, local-first, blazing-fast **desktop application** for editing MP3 tags — powered by **Rust**, **TypeScript**, and **Tauri**.

> **No ads. No upload. No BS. Just edit your music.**

---

## 🔥 Features

- 🔍 Auto-fetch metadata (title, artist, album, genre, etc.)
- 🖼️ Cover art support (upcoming!)
- 💾 Batch edit MP3 files
- 🧠 AI-enhanced guessing (based on filename patterns)
- 📂 Drag & drop support
- 🧑‍💻 Manual overrides
- 🌗 Light & Dark mode
- 🧩 Cross-platform (macOS, Windows, Linux)

---

## 💻 Tech Stack

| Layer       | Tech                    |
|------------|-------------------------|
| UI         | React + TypeScript + Tailwind CSS |
| Backend    | Rust + [Lofty](https://crates.io/crates/lofty) |
| Framework  | [Tauri](https://tauri.app) |
| Build Tool | Vite + Cargo            |

---

## 🚀 Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup Instructions

\`\`\`bash
# Clone the repository
git clone https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui
cd mp3-tag-editor-gui

# Install frontend dependencies
npm install

# Start in development mode
npm run tauri dev
\`\`\`

To build a production executable:

\`\`\`bash
npm run tauri build
\`\`\`

---

## 🛠️ Development Notes

- Tauri commands can be called from the frontend like so:
\`\`\`ts
import { invoke } from "@tauri-apps/api";

await invoke("read_mp3_tags", { filePath: "/path/to/song.mp3" });
\`\`\`

- Backend code is located in `src-tauri/` and supports modular Rust design.

---

## 📸 Screenshots

![automp31](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/75e880a5-cdd9-4165-8719-0586c8273bb2)

![mp3_1](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/e625c2ff-1a51-4cdb-b6e2-1fead179efb6)

![mp3_2](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/faa0e671-4a91-469f-9355-bf33cfdee21f)

![image](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/2467301c-57c0-422a-90d5-b487b2cc0ff2)

![WhatsApp Image 2024-01-09 at 00 24 50](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/91d15bad-e3cc-4dd7-8754-6916c8b7b78a)

![mp3_3](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/assets/70965472/d7c0ae27-febb-4cf5-b08f-a54b89ffc9ba)
---

## ✅ TaskList / Roadmap

### v1.0.0
- [x] Basic file picker & tag editor
- [x] Auto metadata from file names
- [x] Save changes to disk

### v1.1.0
- [ ] Cover art support
- [ ] MusicBrainz integration
- [ ] Tag presets & templates
- [ ] Folder scanning
- [ ] Export metadata as JSON/CSV

---

## 💬 Community

- Discord: [Coming Soon]
- Suggest a feature or report a bug via [Issues](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/issues)
- Contribute via [Pull Requests](https://github.com/Mp3-Automated-Tag-Editor/Automated-Mp3-Gui/pulls)

---

## 🙏 Acknowledgments

- [Lofty-RS](https://github.com/Serial-ATA/lofty-rs)
- [Tauri](https://github.com/tauri-apps/tauri)
- [MusicBrainz](https://musicbrainz.org/)
- Open-source contributors around the globe ❤️

---

## 📜 License

MIT © 2025 [Your Name]. See [LICENSE](LICENSE) for more details.

> Music is life — tag it right. 🎶
