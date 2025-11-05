#!/bin/bash
# ================================================
# 🔥 Lit.it – Netlify Environment Sync Script
# Push all env vars from .env.local to Netlify site
# ================================================

set -e

if [ ! -f .env.local ]; then
  echo "❌  .env.local not found. Please make sure it exists in project root."
  exit 1
fi

if ! command -v netlify &> /dev/null; then
  echo "⚙️  Installing Netlify CLI..."
  npm install -g netlify-cli
fi

echo "🔐  Checking Netlify authentication..."
netlify status || netlify login

if [ ! -d ".netlify" ]; then
  echo "🔗  Linking local repo to Netlify..."
  netlify link
fi

echo "🚀  Syncing environment variables from .env.local to Netlify..."
while IFS='=' read -r key value; do
  if [[ -n "$key" && ! "$key" =~ ^# ]]; then
    echo "📦  Setting $key..."
    netlify env:set "$key" "${value}"
  fi
done < .env.local

echo "✅  All environment variables have been uploaded to Netlify!"
echo "🔎  Run 'netlify env:list' to verify."
