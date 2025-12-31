# GitHub Repository Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `sedulousgroup` (or `sedulousgroup-net`)
3. Description: "Sedulous Group Car Rental Platform"
4. Choose **Private** or **Public** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

## Step 2: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sedulousgroup.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/sedulousgroup.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: If repository already exists

If the repository already exists on GitHub:

```bash
# Check current remotes
git remote -v

# Add or update remote
git remote set-url origin https://github.com/YOUR_USERNAME/sedulousgroup.git

# Push
git push -u origin main
```

## Quick Command (Copy & Paste)

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sedulousgroup.git
git branch -M main
git push -u origin main
```

## Troubleshooting

### If you get "remote already exists" error:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/sedulousgroup.git
```

### If you need to authenticate:
- GitHub may ask for username and password
- For password, use a **Personal Access Token** (not your GitHub password)
- Create token at: https://github.com/settings/tokens
- Select scope: `repo` (full control of private repositories)

### If branch name is different:
```bash
# Check current branch
git branch

# Rename to main
git branch -M main

# Push
git push -u origin main
```


