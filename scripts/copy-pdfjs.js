// Copies the pdf.js runtime (legacy build for wider browser support) into
// public/vendor/pdfjs so it is served as static files and loaded on demand,
// instead of being bundled by webpack. Runs before `start` and `build`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'pdfjs-dist');
const dest = path.join(root, 'public', 'vendor', 'pdfjs');

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

fs.rmSync(dest, { recursive: true, force: true });
copy(path.join(src, 'legacy', 'build', 'pdf.min.mjs'), path.join(dest, 'pdf.min.mjs'));
copy(path.join(src, 'legacy', 'build', 'pdf.worker.min.mjs'), path.join(dest, 'pdf.worker.min.mjs'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  if (fs.existsSync(path.join(src, dir))) copy(path.join(src, dir), path.join(dest, dir));
}

const { version } = require(path.join(src, 'package.json'));
fs.writeFileSync(path.join(dest, 'VERSION'), `${version}\n`);
console.log(`pdf.js ${version} copied to public/vendor/pdfjs`);
