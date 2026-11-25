# Publish the configurator for free

This folder is a complete copy of the **stable** configurator: `index.html`, `js/` and `assets/`. It is about 89 MB.
No server or domain is needed. Every stable release refreshes it (`bash tools/make-stable.sh`).

## Option A: Netlify Drop (fastest, about 2 minutes)
1. Open https://app.netlify.com/drop
2. Drag this whole `share-site` folder onto the page.
3. You get a link like `https://random-name-123.netlify.app`. Send that to anyone.
- Without an account the site is deleted after about an hour. Sign up free (an email or GitHub login) to keep it permanently.
- In Site settings you can rename it, e.g. `container-haz.netlify.app`.
- **To update:** open the site in Netlify → Deploys → drag the folder again.

## Option B: GitHub Pages (permanent, good for regular updates)
1. Create a free account at https://github.com and a new **public** repository, e.g. `container-haz`.
2. Click **uploading an existing file**, drag in everything inside this folder (including `js/` and `assets/`), then **Commit**.
   - The web uploader takes up to 100 files at a time. This folder has about 50, so one upload is enough.
3. Go to **Settings → Pages**. Under *Branch*, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/container-haz/`
- **To update:** upload the changed files again (usually just `index.html` and `js/`).

## Notes
- Saved designs live in each visitor's own browser. Share a design with the **Save & share → configuration code** text.
- The 3D engine and fonts load from public CDNs, so visitors need an internet connection.
- Textures and sky maps are CC0 (Poly Haven); see `assets/CREDITS.md`.
