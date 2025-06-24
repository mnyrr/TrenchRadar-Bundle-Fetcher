# TrenchRadar Bundle Fetcher - Browser Extension & Userscript

## 📦 Extension Description

**TrenchRadar Bundle Fetcher** is a powerful tool that displays bundle information for tokens on Axiom Trade by fetching data from TrenchRadar API. The tool shows:

- Overall token statistics (holding bundles, total SOL spent, held percentage)
- Top 5 holding bundles with detailed information
- Visual progress indicators for remaining tokens

## 🛠 Installation Methods

### Option 1: Install as Chrome Extension (Recommended) (Axiom and Nova)

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

### Option 2: Install as Tampermonkey Userscript (only Axiom)

#### Step-by-Step Guide:

1. **Install Tampermonkey Extension**  
- Get Tampermonkey from Chrome Web Store:  
  [https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

2. **Create New Userscript**  
- Click Tampermonkey icon in toolbar
- Select "Create a new script"

3. **Paste the Userscript Code**  
- Delete all existing code in the editor
- Paste the full userscript code (from content.js)
- Make sure the metadata block is included at the top

4. **Save the Userscript**  
- Press `Ctrl+S` or click "File > Save"
- The script will now be active

5. **Use the Userscript**  
- Navigate to `https://axiom.trade/meme/[token-address]`
- Click the "Check Bundles" button that appears in the navigation bar

## 🔧 Troubleshooting

**For Extension Installation:**
- If you see "Invalid manifest" error, check your `manifest.json` formatting
- Make sure all required files are in the folder
- Chrome may show warnings about "unpacked extensions" - this is normal

**For Userscript Installation:**
- Ensure Tampermonkey is enabled for the site
- Check script is set to run on `https://axiom.trade/*` URLs
- Refresh the page after installing

## ⚠️ Important Notes

- The extension requires permissions to:
- Access cookies for trench.bot
- Make requests to external APIs
- No data is collected or sent to third parties
- Works best on Chromium-based browsers (Chrome, Edge, Brave)
