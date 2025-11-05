#!/bin/bash
# ================================================
# 🔥 Lit.it – Netlify Environment Sync Script
# Push all env vars from .env.local to Netlify site
# ================================================

set -e

# Ensure Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "⚙️  Installing Netlify CLI..."
  npm install -g netlify-cli
fi

# Ensure user is logged in
echo "🔐  Checking Netlify authentication..."
netlify status || netlify login

# Check for .env.local
if [ ! -f .env.local ]; then
  echo "❌  .env.local not found. Please create one first."
  exit 1
fi

# Ensure site is linked
if [ ! -d ".netlify" ]; then
  echo "🔗  Linking local repo to Netlify site..."
  netlify link
fi

echo "🚀  Syncing environment variables from .env.local to Netlify..."

# Read .env.local line by line
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ -n "$key" && ! "$key" =~ ^# ]]; then
    echo "📦  Setting $key..."
    netlify env:set "$key" "${value}"
  fi
done < .env.local

echo "✅  All environment variables have been uploaded to Netlify!"
echo "🔎  Run 'netlify env:list' to verify."
