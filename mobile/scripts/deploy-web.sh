#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$MOBILE_DIR"

# Read values directly from .env file
SUPABASE_URL="$(grep '^EXPO_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-)"
SUPABASE_KEY="$(grep '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' .env | cut -d= -f2-)"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "ERROR: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing from mobile/.env"
  exit 1
fi

echo "Building Expo web export..."
EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL" EXPO_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY" \
  npx expo export --platform web --output-dir dist

echo "Post-processing..."
node ./scripts/prepare-web-export.js dist

echo "Linking to vys-expo-web-export..."
mkdir -p dist/.vercel
echo '{"projectId":"prj_IxFPIHk19IdNXY66ApGt53Y7XhIo","orgId":"team_lLr1CQPWzr5JJhbKUD6BtaSp"}' > dist/.vercel/project.json

echo "Deploying to Vercel..."
npx vercel deploy dist --prod --yes

echo "Done."
