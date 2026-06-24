import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Replace Windows drive letter paths
    content = content.replaceAll('D:\\\\markaz-arshy', '');
    content = content.replaceAll('"D:\\\\"', '""');

    // Fix backslash paths in files array
    content = content.replaceAll('.next\\\\', '.next/');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch(e) { return false; }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(js|mjs|json)$/.test(entry.name)) {
      if (fixFile(fullPath)) {
        console.log('Fixed: ' + path.relative('D:/markaz-arshy', fullPath));
      }
    }
  }
}

walkDir('D:/markaz-arshy/.open-next');
console.log('Done!');
