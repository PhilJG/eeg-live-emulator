const fs = require('fs');
const path = require('path');

const filePath = 'eeg-score/eyes-closed/Crimson hawk_calm.json';
const fullPath = path.join(__dirname, filePath);

console.log('Testing file loading for:', fullPath);

// Check if file exists
if (!fs.existsSync(fullPath)) {
  console.error('Error: File does not exist at path:', fullPath);
  process.exit(1);
}

console.log('File exists. Checking read permissions...');

try {
  // Check file permissions
  fs.accessSync(fullPath, fs.constants.R_OK);
  console.log('Read permission granted.');
  
  // Try to read the file
  console.log('Attempting to read file...');
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  console.log('File read successfully. File size:', fileContent.length, 'bytes');
  
  // Try to parse JSON
  console.log('Attempting to parse JSON...');
  const data = JSON.parse(fileContent);
  console.log('JSON parsed successfully. Data type:', typeof data);
  
  if (Array.isArray(data)) {
    console.log('Data is an array with length:', data.length);
    if (data.length > 0) {
      console.log('First item:', JSON.stringify(data[0], null, 2));
    }
  } else {
    console.log('Data is not an array.');
  }
  
} catch (error) {
  console.error('Error during file operations:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    path: error.path,
    stack: error.stack
  });
  process.exit(1);
}
