#!/bin/bash

# Quick script to add project to GitHub repository "sedulousgroup"

echo "🔗 Adding project to GitHub repository: sedulousgroup"
echo ""

# Get GitHub username
read -p "Enter your GitHub username or organization name: " github_user

if [ -z "$github_user" ]; then
    echo "❌ GitHub username is required!"
    exit 1
fi

# Check if remote exists
if git remote get-url origin &> /dev/null; then
    echo "⚠️  Remote 'origin' already exists. Removing it first..."
    git remote remove origin
fi

# Add remote
echo "🔗 Adding remote: https://github.com/${github_user}/sedulousgroup.git"
git remote add origin "https://github.com/${github_user}/sedulousgroup.git"

# Rename branch to main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "📝 Renaming branch from '$current_branch' to 'main'"
    git branch -M main
fi

echo ""
echo "✅ Remote added successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure the repository 'sedulousgroup' exists on GitHub:"
echo "   https://github.com/new"
echo "   - Name: sedulousgroup"
echo "   - DO NOT initialize with README"
echo ""
echo "2. Then push your code:"
echo "   git push -u origin main"
echo ""
echo "Or run this command now (will fail if repo doesn't exist):"
read -p "Push now? (y/n): " push_now

if [ "$push_now" = "y" ] || [ "$push_now" = "Y" ]; then
    echo ""
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Success! Your project is on GitHub:"
        echo "   https://github.com/${github_user}/sedulousgroup"
    else
        echo ""
        echo "❌ Push failed. Make sure:"
        echo "   1. Repository 'sedulousgroup' exists on GitHub"
        echo "   2. You have access to push to it"
        echo "   3. You're authenticated (may need Personal Access Token)"
    fi
fi


