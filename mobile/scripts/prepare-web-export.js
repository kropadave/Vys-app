#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(process.argv[2] || 'dist');
const iconFontDir = path.join(outputDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
const publicFontDir = path.join(outputDir, 'assets', 'fonts');
const bundleDir = path.join(outputDir, '_expo', 'static', 'js', 'web');

function copyIconFonts() {
  if (!fs.existsSync(iconFontDir)) return;

  fs.mkdirSync(publicFontDir, { recursive: true });
  for (const fileName of fs.readdirSync(iconFontDir)) {
    if (!fileName.endsWith('.ttf')) continue;
    fs.copyFileSync(path.join(iconFontDir, fileName), path.join(publicFontDir, fileName));
  }
}

function rewriteFontReferences() {
  if (!fs.existsSync(bundleDir)) return;

  for (const fileName of fs.readdirSync(bundleDir)) {
    if (!fileName.endsWith('.js')) continue;
    const filePath = path.join(bundleDir, fileName);
    const source = fs.readFileSync(filePath, 'utf8');
    const next = source
      .replaceAll('assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', 'assets/fonts/')
      .replaceAll('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/assets/fonts/');

    if (next !== source) fs.writeFileSync(filePath, next);
  }
}

function writeVercelConfig() {
  const noStoreHeaders = [
    {
      key: 'Cache-Control',
      value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  ];

  fs.writeFileSync(
    path.join(outputDir, 'vercel.json'),
    `${JSON.stringify(
      {
        cleanUrls: true,
        trailingSlash: false,
        rewrites: [
          { source: '/(.*)', destination: '/index.html' },
        ],
        headers: [
          {
            source: '/(.*)',
            headers: noStoreHeaders,
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

copyIconFonts();
rewriteFontReferences();
writeVercelConfig();
