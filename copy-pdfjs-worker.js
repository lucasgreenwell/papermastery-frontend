// Script to copy PDF.js worker files to public directory
import { promises as fs } from 'fs';
import fs_sync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source files in node_modules
const PDFJS_VERSION = '4.4.168';
const sourceDir = path.resolve(__dirname, 'node_modules', 'pdfjs-dist', 'build');
const files = [
  'pdf.worker.min.js',
  'pdf.worker.min.js.map',
  'pdf.worker.min.mjs',
  'pdf.worker.min.mjs.map'
];

// Target directory in public
const targetDir = path.resolve(__dirname, 'public', 'pdf-worker');

// Main function
async function copyPdfJsWorkerFiles() {
  try {
    // Ensure target directory exists
    if (!fs_sync.existsSync(targetDir)) {
      await fs.mkdir(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
    }

    // Copy each file
    for (const file of files) {
      try {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        if (!fs_sync.existsSync(sourcePath)) {
          console.error(`Source file does not exist: ${sourcePath}`);
          continue;
        }
        
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Successfully copied: ${file}`);
      } catch (error) {
        console.error(`Error copying file ${file}:`, error.message);
      }
    }

    console.log('PDF.js worker files copied successfully!');
  } catch (error) {
    console.error('Failed to copy PDF.js worker files:', error.message);
  }
}

// Run the function
copyPdfJsWorkerFiles(); 