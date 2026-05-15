#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(process.argv[2] || 'dist');
const nodeAssetsDir = path.join(outputDir, 'assets', 'node_modules');
const publicVendorDir = path.join(outputDir, 'assets', 'vendor');
const iconFontDir = path.join(outputDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
const publicFontDir = path.join(outputDir, 'assets', 'fonts');

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.mjs', '.txt']);

function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;

  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function walkFiles(directory, visitor) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (filePath.startsWith(path.join(outputDir, 'assets'))) continue;
      walkFiles(filePath, visitor);
    } else if (entry.isFile()) {
      visitor(filePath);
    }
  }
}

function copyIconFonts() {
  if (!fs.existsSync(iconFontDir)) return;

  fs.mkdirSync(publicFontDir, { recursive: true });
  for (const fileName of fs.readdirSync(iconFontDir)) {
    if (!fileName.endsWith('.ttf')) continue;
    fs.copyFileSync(path.join(iconFontDir, fileName), path.join(publicFontDir, fileName));
  }
}

function copyVendorAssets() {
  copyDirectory(nodeAssetsDir, publicVendorDir);
}

function rewriteStaticReferences() {
  walkFiles(outputDir, (filePath) => {
    if (!textExtensions.has(path.extname(filePath))) return;
    const source = fs.readFileSync(filePath, 'utf8');
    const next = source
      .replaceAll('assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', 'assets/fonts/')
      .replaceAll('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/', '/assets/fonts/')
      .replaceAll('assets/node_modules/', 'assets/vendor/')
      .replaceAll('/assets/node_modules/', '/assets/vendor/');

    if (next !== source) fs.writeFileSync(filePath, next);
  });
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
copyVendorAssets();
rewriteStaticReferences();
writeVercelConfig();
