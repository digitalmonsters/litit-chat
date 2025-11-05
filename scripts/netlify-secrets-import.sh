#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Netlify Secrets Import Script
#  This script loads your .env.local file and pushes all keys
#  to your Netlify environment variables using the Netlify CLI.
# ─────────────────────────────────────────────────────────────

if [ ! -f .env.local ]; then
  echo "❌ .env.local not found! Please run this script in your project root."
  exit 1
fi

echo "🔐 Importing all environment variables from .env.local to Netlify..."

# Export vars from .env.local (skip comments and empty lines)
export $(grep -v '^#' .env.local | xargs)

# Loop through every key=value pair in .env.local and set it in Netlify
while IFS='=' read -r key value; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    echo "➡️ Setting $key ..."
    netlify env:set "$key" "$value"
  fi
done < <(grep -v '^#' .env.local)

echo "✅ Done! All variables from .env.local have been added to Netlify."
