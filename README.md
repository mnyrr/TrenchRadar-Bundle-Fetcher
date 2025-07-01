# TrenchRadar Bundle Fetcher - Browser Extension

## 📦 Extension Description

**TrenchRadar Bundle Fetcher** is a powerful tool that displays bundle information for tokens on Axiom and Nova by fetching data from TrenchRadar API. The tool shows:

- Overall token statistics (holding bundles, total SOL spent, held percentage)
- Top 5 holding bundles with detailed information
- Visual progress indicators for remaining tokens

## 🛠 Installation Method

#### Step-by-Step Guide:

1. **Download the extension files**  
   - Create a folder called `trenchradar-extension`
   - Save these files inside it:
     - `manifest.json`
     - `background.js`
     - `content.js`
     - `popup.css`
     - Save all icon files (16x16, 32x32, 48x48, 128x128 PNGs)

2. **Open Chrome Extensions Page**  
   Type in address bar:  chrome://extensions/


3. **Enable Developer Mode**  
- Toggle the switch in top-right corner to "On"
- You'll see new options appear

4. **Load Unpacked Extension**  
- Click the **Load unpacked** button
- Select the `trenchradar-extension` folder you created
- The extension will now appear in your extensions list

5. **Pin the Extension (Optional)**  
- Click the puzzle icon in Chrome's toolbar
- Find "TrenchRadar Bundle Fetcher"
- Click the pin icon to keep it visible

6. **Use the Extension**  
- Navigate to `https://axiom.trade/meme/[token-address]`
- Click the "Check Bundles" button that appears in the navigation bar

## ⚠️ Important Notes

- The extension requires permissions to:
- Access cookies for trench.bot
- Make requests to external APIs
- No data is collected or sent to third parties
- Works best on Chromium-based browsers (Chrome, Edge, Brave)
