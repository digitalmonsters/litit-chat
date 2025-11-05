#!/bin/bash

# -------------------------------------
# Netlify ENV Sync Script
# Reads .env.local and uploads vars
# -------------------------------------

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  No .env.local file found!"
  exit 1
fi

# Get current linked site info
echo "─────────────────────────────"
echo "🔍 Checking Netlify project link..."
netlify status

echo "─────────────────────────────"
echo "🚀  Syncing environment variables from .env.local to Netlify..."

while IFS='=' read -r key value; do
  # skip comments or blank lines
  [[ $key =~ ^#.*$ || -z "$key" ]] && continue
  # trim spaces
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  # remove quotes around values if any
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  echo "📦  Setting $key..."
  netlify env:set "$key" "$value" --context all
done < "$ENV_FILE"

echo "✅  All environment variables uploaded to Netlify!"
echo "🔎  Run 'netlify env:list' to verify."
