# FastBrowse

FastBrowse is a lightning-fast, lightweight Chromium-based desktop browser built with Electron and React. Its defining feature is a native, offline-capable **AI Summarization Engine** that automatically generates concise abstractions of the web pages you visit in real-time.

## ✨ Features
* **Private & Local AI**: Fully local privacy-first AI summarization leveraging WebAssembly and Hugging Face's `Transformers.js`. No API keys required, and your browsing data never leaves your machine.
* **Modern Interface**: A clean, sleek React UI powered by Tailwind CSS.
* **Native Performance**: Secure, sandboxed Chromium rendering managed via Electron's isolated `BrowserView` architecture.
* **Smart Content Extraction**: Utilizes native DOM extraction routines to intelligently filter out ads, navigation menus, and non-critical content before forwarding text to the Neural Network.

## 🚀 Setup and Installation

### Prerequisites
- Node.js (v18+)
- npm

### Running Locally
To run the browser on your machine:
```bash
# 1. Install dependencies
npm install

# 2. Start the development server and Electron browser window
npm run dev
```

*Note: On your first run, the local AI model (`distilbart-cnn-6-6`) will securely download in the background. Subsequent runs will instantly load the model from your local cache.*

## 📦 Packaging for macOS
To compile and package the browser into a standalone `.dmg` application bundle:
```bash
npm run build
```
Once completed, you will find the installation file within the `/dist` directory.
