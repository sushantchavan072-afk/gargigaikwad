GARGI GAIKWAD PORTFOLIO — local preview and hosting
===================================================

This is a static site: HTML, CSS, JavaScript, fonts and images are served as files.
There is no build step. Keep the folder structure intact when previewing or deploying.
For the full Windows beginner walkthrough, see GITHUB-VERCEL-BEGINNER-GUIDE.md.

LOCAL PREVIEW
-------------
1. Open PowerShell or Terminal in the folder containing index.html.
2. Start a local web server:
     Windows:  py -m http.server 8000
     macOS/Linux:  python3 -m http.server 8000
   If `py` is unavailable on Windows, try `python -m http.server 8000`.
3. Visit http://localhost:8000 in your browser. Press Ctrl+C in the terminal to stop.

You can also open index.html directly, but a local server is more reliable for media
and browser features. After editing an HTML, CSS or JS file, refresh the page.

DEPLOY TO VERCEL (dashboard)
---------------------------
1. Put this site folder in a GitHub repository and push the files.
2. In Vercel, choose Add New → Project, connect the repository, then import it.
3. Set Root Directory to the folder that contains index.html (for this repository,
   choose `site` only if the repository root is its parent folder).
4. Choose Other as the framework preset. Leave Build Command and Install Command empty.
   Set Output Directory to `.` (the project root). No environment variables are needed.
5. Deploy. Vercel will provide a preview URL; subsequent pushes trigger new deployments.

DEPLOY TO VERCEL (CLI)
----------------------
Install Node.js, open a terminal in the folder containing index.html, then run:
     npm install -g vercel
     vercel
Follow the prompts to sign in and link or create a project. For a production deployment,
run `vercel --prod`. The CLI detects a static site; if asked, use Other and set the output
directory to `.` with no build command.

For Netlify or GitHub Pages, publish the same folder as a static site; no build command
is required. Keep `index.html` at the published root.

Quick Vercel option without connecting Git: use https://vercel.com/drop and upload this
site folder (or a zip of it), keeping its assets and fonts folders together.
Vercel build settings reference: https://vercel.com/docs/builds

PAGES (14)
index, work, about, playground, 4 project pages (taks, noto-sans, azulejos-goa, anjana)
and 6 playground pages (playground-<name>.html).

FONTS
Headings use PP Editorial New Ultralight + Ultralight Italic (already installed in fonts/ as editorial-ultralight.woff2 and
editorial-italic.woff2, converted from the files Gargi supplied). Geist and Geist Mono are open-source and included.
LICENCE: the files supplied came from befonts.com marked "Personal Use Only". For a public or paid portfolio, buy the
PP Editorial New licence from pangrampangram.com and replace those two files (same names).

IMAGES / VIDEOS YOU STILL NEED TO ADD  (put them in assets/, exact filenames)
Missing files are hidden automatically, so nothing looks broken. Drop them in and refresh.
  lens-0.webp ... lens-6.webp                      About page photo strip
  Instagram_post_-_1.png, _3.png, _4.png, _5.png, _6.png, _6-2.png
  IMG_1053.JPG, IMG_1056.JPG, IMG_1120.JPG
  DSC7381.JPG, DSC7381-2.JPG, DSC7390.JPG, DSC7405.JPG, DSC7490.JPG
  rang-latest.webp, taks-latest.webp, azulejos-latest.webp
  anjana-market-still.jpg, anjana-film-five-seconds.webm, anjana-market-film.webm
  Rotract_Khopoli_logo.png                         Rotaract playground card
  internship-cover.jpg                             cover for 'Internship work at Archaeology' (shows a tile with 'A' until added)
  About-page photo stack: these extra cards appear automatically once the file exists (edit the list in STACK in build.py): Instagram_post_-_4.png, DSC7405.JPG, IMG_1120.JPG, Instagram_post_-_6-2.png, DSC7490.JPG
  cv.pdf                                           replace with her real CV (current file is the older Canva resume and contains a phone number)

BEHANCE LINKS
Rajgad and Pratapgad currently link to Gargi's Behance profile. Paste the exact project URLs into the 'museums-heritage' panels in build.py once they are published,
and add the Suf booklet link the same way when it is ready. Coming-soon cards (Suf booklet, RAC Khopoli newsletter and website) live in COMING_LIST.

CHANGE TEXT / PROJECTS
Edit the relevant HTML file directly in this folder. Shared layout and visual styles are
in style.css; interactions are in main.js. This delivered folder does not include the
build.py source generator referenced by an earlier version of these notes.
Note: the email in build.py is gargig.work09@gmail.com (from the Lovable project); the resume says gargig.work@gmail.com. Please confirm which is right.
"Details to be added" under Tools on project pages is a placeholder from the original content file.

BEHAVIOUR
Home hero tags use a small physics engine (vendor/matter.min.js, MIT). It switches off for reduced-motion users.
Playground: drag the background to pan, drag any card on its own, click a card to open it, remix the board,
stamp emoji stickers, or draw colorful doodles. Hide/show marks with the eye button; use the trash button to clear them.
