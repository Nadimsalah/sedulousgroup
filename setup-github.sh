#!/bin/bash

# GitHub Setup Script for Sedulous Group Project

echo "🚀 GitHub Repository Setup"
echo "=========================="
echo ""

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote -v
    echo ""
    read -p "Do you want to update it? (y/n): " update
    if [ "$update" = "y" ] || [ "$update" = "Y" ]; then
        git remote remove origin
    else
        echo "Keeping existing remote. Exiting."
        exit 0
    fi
fi

echo "📋 Please provide your GitHub details:"
echo ""
read -p "GitHub username or organization name: " github_user
read -p "Repository name [sedulousgroup]: " repo_name
repo_name=${repo_name:-sedulousgroup}

echo ""
echo "Choose connection method:"
echo "1. HTTPS (easier, works everywhere)"
echo "2. SSH (requires SSH key setup)"
read -p "Enter choice (1 or 2): " method

if [ "$method" = "2" ]; then
    remote_url="git@github.com:${github_user}/${repo_name}.git"
else
    remote_url="https://github.com/${github_user}/${repo_name}.git"
fi

echo ""
echo "🔗 Adding remote: $remote_url"
git remote add origin "$remote_url"

echo ""
echo "📝 Current branch:"
git branch --show-current

read -p "Rename branch to 'main'? (y/n): " rename
if [ "$rename" = "y" ] || [ "$rename" = "Y" ]; then
    git branch -M main
    echo "✅ Branch renamed to 'main'"
fi

echo ""
echo "📤 Ready to push to GitHub!"
echo ""
echo "⚠️  IMPORTANT: Make sure the repository exists on GitHub first!"
echo "   Go to: https://github.com/new"
echo "   Create repository named: ${repo_name}"
echo "   DO NOT initialize with README, .gitignore, or license"
echo ""
read -p "Press Enter when repository is created, or Ctrl+C to cancel..."

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin $(git branch --show-current)

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your project is now on GitHub!"
    echo "   View it at: https://github.com/${github_user}/${repo_name}"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "   1. Repository doesn't exist on GitHub - create it first"
    echo "   2. Authentication failed - use Personal Access Token"
    echo "   3. Branch name mismatch - try: git push -u origin main"
fi


