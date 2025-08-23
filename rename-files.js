const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'eeg-score');

// Function to convert a filename to the new format
function formatFilename(filename) {
  // Remove .json extension and split by underscores and spaces
  const baseName = filename.replace(/\.json$/, '');
  const parts = baseName.split(/[ _]+/);
  
  // Extract components (assuming format is "Color Animal_state" or similar)
  const color = parts[0].toLowerCase();
  const animal = parts[1] ? parts[1].toLowerCase() : '';
  const state = parts[2] ? parts[2].toLowerCase() : 'calm';
  
  // Create new filename
  return `${color}-${animal}-${state}.json`;
}

// Process each subdirectory in eeg-score
fs.readdirSync(baseDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dir => {
    const dirPath = path.join(baseDir, dir.name);
    
    // Process each JSON file in the directory
    fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json'))
      .forEach(file => {
        const oldPath = path.join(dirPath, file);
        const newFilename = formatFilename(file);
        const newPath = path.join(dirPath, newFilename);
        
        if (oldPath !== newPath) {
          console.log(`Renaming: ${file} -> ${newFilename}`);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (err) {
            console.error(`Error renaming ${file}:`, err.message);
          }
        }
      });
  });

console.log('File renaming complete!');
