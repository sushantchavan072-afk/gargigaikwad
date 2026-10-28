# Beginner guide: upload this portfolio to GitHub and deploy it on Vercel

This guide takes the portfolio on your Windows computer and publishes it as a live website. It includes a Bash route first and a GitHub Desktop route if you prefer buttons.

## What you are doing

- **GitHub** stores a copy of your website files online.
- **Git** records changes to your files. Use Git Bash commands or GitHub Desktop buttons to send those changes to GitHub.
- **Vercel** hosts the live website. Connect it to GitHub to deploy every push automatically, or deploy directly with the Vercel CLI.

This portfolio is plain HTML, CSS and JavaScript. It has no build step.

## Before you begin

You need:

1. A GitHub account: <https://github.com/signup>
2. A Vercel account: <https://vercel.com/signup>
3. For the Bash route: [Git for Windows](https://git-scm.com/download/win), [GitHub CLI](https://cli.github.com/), and [Node.js LTS](https://nodejs.org/).
4. For the button-based route: GitHub Desktop for Windows: <https://desktop.github.com/download/>
5. This portfolio folder on your computer:

   `C:\Users\HP\Downloads\gargi-portfolio-v9\site`

Inside that folder, `index.html`, `style.css`, `main.js`, and the `assets`, `fonts`, and `vendor` folders should be together. **Do not upload only `index.html`**; the other files are needed for the site to look and work correctly.

Before making the portfolio public, review `assets\cv.pdf`. The current project notes say it is an older resume and includes a phone number; replace it with a current copy if you do not want that version published.

### Optional: preview the site on your computer first

Open PowerShell in the original `site` folder and run `py -m http.server 8000`. Then visit <http://localhost:8000>. Press **Ctrl+C** in PowerShell to stop the server. (If `py` is not recognized, try `python -m http.server 8000`.)

## Bash route: upload to GitHub and deploy with Vercel CLI

This path keeps your existing `site` folder as the repository root. Use **Git Bash** (installed with Git for Windows). You will also install GitHub CLI (`gh`) to create and upload the GitHub repository from the terminal, and Node.js so Vercel CLI (`vercel`) can run.

### 1. Install the command-line tools

Install these if you do not already have them:

- [Git for Windows](https://git-scm.com/download/win) — includes Git Bash.
- [GitHub CLI](https://cli.github.com/) — provides the `gh` command.
- [Node.js LTS](https://nodejs.org/) — includes `npm`, which installs Vercel CLI.

After installation, close and reopen Git Bash. Check that the commands are available:

```bash
git --version
gh --version
node --version
npm --version
```

If a command says `command not found`, install that tool, reopen Git Bash, then try again.

### 2. Go to the website folder

Copy and run this in Git Bash:

```bash
cd "/c/Users/HP/Downloads/gargi-portfolio-v9/site"
pwd
ls
```

`pwd` should end with `/gargi-portfolio-v9/site`. The file list should include `index.html`, `style.css`, `main.js`, `assets`, `fonts`, and `vendor`. If it does not, stop and navigate to the correct folder before continuing.

### 3. Start Git and save the first checkpoint

Run these commands one at a time:

```bash
git init
git branch -M main
git add -A
git status --short
git commit -m "Initial portfolio"
```

`git status --short` shows what will be uploaded. Check the list before continuing. If Git asks who made the commit, set your own name and GitHub email, then repeat the commit:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-github-email@example.com"
git commit -m "Initial portfolio"
```

Replace the sample name and email with your own. A commit is a saved checkpoint on your computer.

### 4. Sign in and create the GitHub repository

Run:

```bash
gh auth login
```

Choose `GitHub.com`, choose `HTTPS`, then choose the web browser login option and follow the prompt. Return to Git Bash when login succeeds. You do not need to paste a password or token into the commands.

Connect the local folder to the GitHub repository you already created, then push the site:

```bash
gh auth setup-git
git remote add origin https://github.com/sushantchavan072-afk/gargigaikwad.git
git push -u origin main
```

If Git says `remote origin already exists`, update it with `git remote set-url origin https://github.com/sushantchavan072-afk/gargigaikwad.git`, then retry the push. If Git rejects the push because the GitHub repository already contains a README or other commit, stop and tell me the exact error before using force-push; the local and online histories need to be combined safely.

Your GitHub repository can stay private; the deployed Vercel website can still be public.

To set the repository description from Bash, run:

```bash
gh repo edit sushantchavan072-afk/gargigaikwad --description "Portfolio website for Gargi Gaikwad — showcasing graphic design, typography, publications, Indian crafts, and playful experiments. Built with HTML, CSS, and JavaScript."
```

Check the upload:

```bash
git status
git remote -v
gh repo view --web
```

The status should say the working tree is clean. The browser command opens your GitHub repository.

### 5. Install and sign in to Vercel CLI

Install the Vercel command:

```bash
npm install -g vercel@latest
vercel --version
vercel login
```

Follow the browser sign-in prompt, then return to Git Bash. If Git Bash cannot interact with the login prompt, try `winpty vercel login`.

### 6. Deploy the site

Make sure Git Bash is still in the `site` folder, then run:

```bash
vercel --prod
```

On the first run, Vercel asks a few setup questions. Choose your account/team, create a new project if asked, use `./` for the project directory, and confirm the current directory. If Vercel asks about framework/build settings, choose **Other** and leave the build command blank. This portfolio has no build step.

Vercel will print a production URL when deployment finishes. Open that URL and check the homepage and a few other pages. The CLI keeps a small `.vercel` link file locally so later deployments know which Vercel project to use.

### 7. Publish later updates from Bash

After editing files in the same `site` folder, run:

```bash
git add -A
git commit -m "Describe what changed"
git push
vercel --prod
```

Change the commit message to briefly describe your update. `git push` sends the changes to GitHub; `vercel --prod` publishes those changes to the live website.

**Automatic-deploy option:** connect the GitHub repository in your Vercel project's **Settings → Git**. After that connection, each push to the production branch (usually `main`) triggers a deployment, so future updates only need `git add -A`, `git commit -m "..."`, and `git push`. The first Git connection is configured in Vercel's dashboard.

### Bash troubleshooting

- **`gh: command not found` or `vercel: command not found`:** install the tool, close Git Bash, and open it again.
- **`Author identity unknown`:** run the two `git config --global` commands in Step 3 with your own details, then make the commit again.
- **`remote origin already exists`:** a remote is already configured. Run `git remote -v` and do not repeat the `gh repo create` command; use the existing remote with `git push -u origin main` if it points to the right GitHub repository.
- **GitHub CLI login prompt behaves strangely in Git Bash:** try `winpty gh auth login`, or run `gh auth login` in Windows Terminal.
- **Vercel displays a 404:** confirm you ran `vercel --prod` from the folder that directly contains `index.html`.

## Alternative: GitHub Desktop (no terminal)

Use this route if you prefer buttons. It makes a new working copy, so you can keep the original folder as a backup.

### 1. Sign in to GitHub Desktop

1. Install and open GitHub Desktop.
2. Choose **Sign in to GitHub.com** and follow the browser sign-in steps.
3. Return to GitHub Desktop after it says you are signed in.

### 2. Create a repository on your computer

1. In GitHub Desktop, choose **File → New repository…**.
2. Enter a name such as `gargigaikwad`.
3. For **Local path**, choose a folder where you want to keep your website repository, such as `C:\Users\HP\Documents`.
   - GitHub Desktop creates a new folder named `gargigaikwad` inside that location.
4. Leave **Initialize this repository with a README** unchecked. The site already has its own README.
5. Click **Create repository**.

### 3. Copy the website into the new repository

1. Open the original `site` folder in File Explorer:
   `C:\Users\HP\Downloads\gargi-portfolio-v9\site`
2. Select everything inside it, including the folders `assets`, `fonts`, and `vendor`.
3. Copy the selected files and folders.
4. Open the new `gargigaikwad` folder you just created.
5. Paste the files there. The new folder should have `index.html` directly inside it, alongside `style.css` and `main.js`.

From now on, edit the copy inside `gargigaikwad`. GitHub Desktop watches that folder for changes. The original `site` folder is just your backup.

### 4. Save the first version (make a commit)

1. Return to GitHub Desktop. The copied files should appear in the **Changes** list.
2. At the bottom left, enter a summary such as `Add portfolio website`.
3. Click **Commit to main**.

A **commit** is a saved checkpoint of your files on your computer. It has not been uploaded yet.

### 5. Publish the repository to GitHub

1. Click **Publish repository** in the top bar.
2. Give the repository the name `gargigaikwad`.
3. Choose whether the code repository should be **Private** or **Public**.
   - A private GitHub repository can still power a public Vercel website.
   - Choose public only if you want other people to browse the source files.
4. Click **Publish repository**.

GitHub Desktop uploads the commit. To check, click **View on GitHub**. You should see `index.html`, `style.css`, `main.js`, and the asset folders in the repository.

## Part 2: Deploy the GitHub repository on Vercel

### 6. Connect Vercel to GitHub

1. Sign in at <https://vercel.com/>.
2. On the Vercel dashboard, click **Add New… → Project** (the button may appear as **New Project**).
3. If Vercel asks to connect GitHub, choose **Connect GitHub** or **Install** and approve access to the `gargigaikwad` repository.
4. Find `gargigaikwad` in the repository list and click **Import**.

If the repository is private and does not appear, return to GitHub and check that the Vercel GitHub App has permission to access it. In Vercel's GitHub access screen, grant access to this repository.

### 7. Set the right Vercel settings

On the **Configure Project** screen, use these settings:

| Setting | Value |
|---|---|
| Project name | `gargigaikwad` or another available name |
| Framework Preset | **Other** |
| Root Directory | `./` or the repository root |
| Build Command | Leave blank; do not add a build command |
| Install Command | Leave blank |
| Output Directory | `.` or leave Vercel's static-site default |

The important check is that the selected root folder contains `index.html`. In this guide, the files are directly at the repository root, so do not select a nested `site` folder. If you chose to upload a parent folder that contains `site\index.html` instead, set Root Directory to `site`.

Click **Deploy**. Vercel will upload the project and show its build/deployment progress. This is a static website, so Vercel serves the files directly; there is no build step.

### 8. Open the live website

When Vercel says the deployment is ready, click **Visit**. Your website will have an address similar to:

`https://gargigaikwad.vercel.app`

The exact address may differ if that project name is already taken. Open the address and check the home page, Playground, project pages, images, and CV link.

## Part 3: Publish changes later

After the first deployment, the normal update cycle is:

1. Edit files in your new `gargigaikwad` folder.
2. Open GitHub Desktop and review the files under **Changes**.
3. Enter a short summary, such as `Update playground interactions`.
4. Click **Commit to main**.
5. Click **Push origin** in the top bar.
6. In Vercel, open your project and the **Deployments** tab. Wait for the newest deployment to say **Ready**.
7. Refresh your live website.

**Commit** saves a checkpoint locally. **Push origin** uploads it to GitHub. Vercel sees the new GitHub update and deploys it automatically. If you only commit but do not push, the live website will not update.

## Optional: use your own domain

You can keep the free `vercel.app` address or connect a domain you own:

1. In Vercel, open your project and choose **Settings → Domains**.
2. Enter your domain and click **Add**.
3. Vercel will show the DNS records for your domain provider. Add those exact records there.
4. Wait until Vercel marks the domain as configured, then open it in a browser.

## Common problems

### The home page shows 404

Check that `index.html` is directly inside the deployed root folder. If it is inside a subfolder, change Vercel's **Root Directory** to that subfolder and redeploy.

### The page loads but images or styles are missing

Check that `assets`, `fonts`, and `vendor` were copied and pushed. File and folder names are case-sensitive on hosting services. Keep each file's original name and its relative folder structure.

### I changed a file, but the live site did not change

Check that you edited the repository copy, committed the changes, clicked **Push origin**, and waited for Vercel's latest deployment to become **Ready**. A browser hard refresh can help show the latest version.

### Vercel asks for a build command or reports a build error

Check that **Framework Preset** is **Other**, the build command is blank, and the root folder is the one containing `index.html`. This site does not use `npm run build`.

## Useful links

- [GitHub Desktop download](https://desktop.github.com/download/)
- [GitHub CLI installation](https://cli.github.com/)
- [GitHub CLI: create and push a repository](https://cli.github.com/manual/gh_repo_create)
- [Vercel CLI overview](https://vercel.com/docs/cli)
- [Vercel: deploy a project from CLI](https://vercel.com/docs/projects/deploy-from-cli)
- [GitHub's guide to creating a repository with GitHub Desktop](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop)
- [GitHub's guide to publishing an existing project](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop)
- [Vercel: deploy a Git repository](https://vercel.com/docs/git)
- [Vercel: static sites and build settings](https://vercel.com/docs/builds)
