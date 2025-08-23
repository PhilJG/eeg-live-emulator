// Dependencies
const { Notion } = require("@neurosity/sdk");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Authentication
// const deviceId = process.env.DEVICE_ID || "";
// const email = process.env.EMAIL || "";
// const password = process.env.PASSWORD || "";

// const verifyEnvs = (email, password, deviceId) => {
//   const invalidEnv = (env) => {
//     return env === "" || env === 0;
//   };
//   if (invalidEnv(email) || invalidEnv(password) || invalidEnv(deviceId)) {
//     console.error(
//       "Please verify deviceId, email and password are in .env file, quitting..."
//     );
//     process.exit(0);
//   }
// };

// verifyEnvs(email, password, deviceId);
// console.log(`${email} attempting to authenticate to ${deviceId}`);

// Setup Express server
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track the current dataset path
let currentDatasetPath = '';

// Store the current dataset being streamed
let currentDataset = null;
let isStreaming = false;

// Helper function to get all available datasets
function getAvailableDatasets() {
  const datasets = [];
  const basePath = path.join(__dirname, 'eeg-score');
  
  // Read each category directory
  const categories = fs.readdirSync(basePath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Find all JSON files in each category
  categories.forEach(category => {
    const categoryPath = path.join(basePath, category);
    const files = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file.replace('.json', '').replace(/_/g, ' '),
        path: path.join('eeg-score', category, file).replace(/\\/g, '/')
      }));
    
    if (files.length > 0) {
      datasets.push({
        category,
        files
      });
    }
  });

  return datasets;
}

// Helper function to load a dataset
function loadDataset(filePath) {
  try {
    console.log('Attempting to load dataset from:', filePath);
    const fullPath = path.join(__dirname, filePath);
    console.log('Full path:', fullPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error('File does not exist:', fullPath);
      return null;
    }
    
    // Read file content with explicit error handling
    let fileContent;
    try {
      fileContent = fs.readFileSync(fullPath, 'utf8');
      console.log(`File read successfully, size: ${fileContent.length} bytes`);
    } catch (readError) {
      console.error('Error reading file:', readError);
      return null;
    }
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(fileContent);
      console.log(`Successfully parsed JSON, got ${Array.isArray(data) ? data.length : 'non-array'} items`);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in loadDataset:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      path: error.path,
      stack: error.stack
    });
    return null;
  }
}

// API route to list all available datasets
app.get('/api/datasets', (req, res) => {
  try {
    const datasets = getAvailableDatasets();
    res.json(datasets);
  } catch (error) {
    console.error('Error listing datasets:', error);
    res.status(500).json({ error: 'Failed to list datasets' });
  }
});

// API route to select and start streaming a dataset
app.post('/api/stream', express.json(), (req, res) => {
  console.log('Received stream request with body:', req.body);
  
  if (isStreaming) {
    const error = 'Already streaming a dataset';
    console.error(error);
    return res.status(400).json({ error });
  }

  const { filePath } = req.body;
  
  if (!filePath) {
    const error = 'filePath is required in request body';
    console.error(error);
    return res.status(400).json({ error });
  }
  
  try {
    console.log('Processing file path:', filePath);
    
    // Verify the file exists
    const fullPath = path.join(__dirname, filePath);
    console.log('Full normalized path:', fullPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      const error = `Dataset not found at path: ${fullPath}`;
      console.error(error);
      return res.status(404).json({ error });
    }
    
    console.log('File exists, attempting to load dataset...');
    
    // Load the dataset
    currentDataset = loadDataset(filePath);
    
    if (!currentDataset) {
      const error = 'Failed to load dataset - loadDataset returned null';
      console.error(error);
      return res.status(500).json({ error });
    }
    
    if (!Array.isArray(currentDataset)) {
      const error = `Invalid dataset format: expected array, got ${typeof currentDataset}`;
      console.error(error);
      return res.status(500).json({ error });
    }
    
    if (currentDataset.length === 0) {
      const error = 'Dataset is empty';
      console.error(error);
      return res.status(500).json({ error });
    }

    // Extract the dataset name from the file path
    const datasetName = path.basename(filePath, '.json').replace('_', ' ');
    
    // Start streaming
    startStreaming();
    
    res.json({ 
      status: 'streaming', 
      dataset: datasetName,
      dataPoints: currentDataset.length
    });
  } catch (error) {
    console.error('Error loading dataset:', error);
    res.status(500).json({ error: 'Failed to load dataset' });
  }
});

// Function to broadcast data to all connected WebSocket clients
function broadcast(data) {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonData);
    }
  });
}

// Function to start streaming the current dataset
function startStreaming() {
  if (!currentDataset || currentDataset.length === 0) {
    console.error('No dataset loaded for streaming');
    return;
  }

  isStreaming = true;
  let currentIndex = 0;
  let lastTimestamp = currentDataset[0].timestamp;
  const startTime = Date.now();
  
  // Notify all clients that streaming has started
  broadcast({
    type: 'stream_started',
    timestamp: startTime,
    dataset: path.basename(currentDatasetPath, '.json').replace('_', ' '),
    totalPoints: currentDataset.length
  });

  function streamNextDataPoint() {
    if (currentIndex >= currentDataset.length || !isStreaming) {
      console.log('End of dataset reached or streaming stopped');
      isStreaming = false;
      return;
    }

    const dataPoint = currentDataset[currentIndex];
    const now = Date.now();
    
    // Broadcast the data point with additional timing information
    broadcast({
      type: 'eeg',
      timestamp: dataPoint.timestamp,
      value: dataPoint.value,
      index: currentIndex,
      total: currentDataset.length
    });
    
    // Log to console with color indicators (less frequent to reduce noise)
    if (currentIndex % 100 === 0) {
      console.log(`[${new Date(now).toISOString()}] Sending point ${currentIndex + 1}/${currentDataset.length}: ${dataPoint.value.toFixed(4)}`);
    }
    
    // Calculate when the next data point should be sent
    currentIndex++;
    
    if (currentIndex < currentDataset.length) {
      const nextDataPoint = currentDataset[currentIndex];
      const timeToNextPoint = nextDataPoint.timestamp - dataPoint.timestamp;
      
      // Ensure minimum delay of 1ms to prevent immediate execution
      const delay = Math.max(1, timeToNextPoint);
      
      // Schedule the next data point
      setTimeout(streamNextDataPoint, delay);
    } else {
      // End of dataset
      isStreaming = false;
      console.log('Dataset streaming completed');
      broadcast({ 
        type: 'stream_completed',
        timestamp: Date.now(),
        totalPoints: currentDataset.length
      });
    }
  }

  // Start streaming
  console.log(`Starting to stream dataset (${currentDataset.length} data points)`);
  streamNextDataPoint();
}

// Stop streaming the current dataset
function stopStreaming() {
  isStreaming = false;
  console.log('Stopped streaming dataset');
}

// API route to stop streaming
app.post('/api/stop', (req, res) => {
  stopStreaming();
  res.json({ status: 'stopped' });
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// WebSocket server connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket client connected');
  
  // Parse URL to check for dataset selection
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(segment => segment);
  
  // Check if the URL follows the pattern /select-dataset/category/filename
  if (pathSegments[0] === 'select-dataset' && pathSegments.length >= 3) {
    const category = decodeURIComponent(pathSegments[1]);
    const filename = decodeURIComponent(pathSegments[2]);
    const datasetPath = path.join('eeg-score', category, filename);
    
    console.log('Attempting to load dataset from:', datasetPath);
    console.log('Full path:', path.resolve(datasetPath));
    
    // Load the requested dataset
    const dataset = loadDataset(datasetPath);
    if (dataset) {
      currentDataset = dataset;
      currentDatasetPath = datasetPath;
      console.log(`Loaded dataset from URL: ${datasetPath}`);
      
      // Start streaming automatically
      if (!isStreaming) {
        startStreaming();
      }
    } else {
      console.error(`Failed to load dataset from URL: ${datasetPath}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to load dataset: ${category}/${filename}`,
        timestamp: Date.now()
      }));
      return;
    }
  }
  
  // Send current status to newly connected client
  ws.send(JSON.stringify({
    type: 'status',
    isStreaming,
    currentDataset: currentDataset ? {
      name: path.basename(currentDatasetPath, '.json').replace('_', ' '),
      length: currentDataset.length,
      path: currentDatasetPath
    } : null,
    timestamp: Date.now()
  }));
  
  // Handle incoming messages from clients (if needed)
  ws.on('message', (message) => {
    try {
const data = JSON.parse(message);
console.log('Received message from client:', data);
} catch (error) {
console.error('Error parsing message from client:', error);
}
});
  
ws.on('error', (error) => {
console.error('WebSocket error:', error);
});
  
ws.on('close', () => {
console.log('WebSocket client disconnected');
});
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available API endpoints:');
  console.log(`  GET  /api/datasets - List all available datasets`);
  console.log(`  POST /api/stream/:category/:file - Start streaming a specific dataset`);
  console.log(`  POST /api/stop - Stop the current stream`);
  console.log('\nVisit http://localhost:3000 in your browser to use the web interface');
});
