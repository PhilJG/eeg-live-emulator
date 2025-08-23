# Neurosity Live Emulator

A local development tool that emulates Neurosity headset data for testing and development purposes. This emulator provides realistic brain activity data streams that mimic the behavior of a real Neurosity headset, allowing developers to test their applications without requiring physical hardware.

**New Feature**: Now includes the ability to stream real EEG data from pre-recorded datasets, providing more realistic testing scenarios.

## Features

- Simulates various brain activity metrics (calm, focus, etc.)
- Real-time data streaming via WebSocket
- Stream real EEG data from pre-recorded datasets
- Multiple visualization modes for data monitoring
- Configurable data generation parameters
- No physical Neurosity device required
- Web interface for dataset selection and playback control

## Project Structure

```
.
├── index.js                  # Backend server and data emulation
├── eeg-score/                # Pre-recorded EEG datasets
│   └── [category]/           # Dataset categories (e.g., eyes-closed, alpha-resting-state)
│       └── *.json            # EEG data files (timestamp and value pairs)
├── public/                   # Frontend files
│   ├── index.html            # Main visualization interface
│   ├── select-dataset.html   # Dataset selection interface
│   ├── sketch.js             # Main visualization code
│   └── visualizations/       # Visualization components
│       ├── circle.js         # Circular visualization
│       └── wave.js           # Waveform visualization
├── .env                      # Environment configuration
└── package.json              # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```
4. Open your browser to:
   - `http://localhost:3000` - Main visualization
   - `http://localhost:3000/select-dataset.html` - Dataset selection interface

## Using the EEG Dataset Player

The EEG Dataset Player allows you to stream pre-recorded EEG data through the same WebSocket interface as the live emulator, making it perfect for testing and development.

### Features

- Browse available EEG datasets organized by category
- Stream datasets at their original recording speed
- Real-time visualization of the data stream
- Progress tracking and playback controls
- Works with existing Neurosity client code

### How to Use

1. Open the Dataset Player at `http://localhost:3000/select-dataset.html`
2. Browse the available datasets
3. Click "Play" on any dataset to start streaming
4. Use the "Stop" button to halt playback
5. The data will be available via WebSocket at `ws://localhost:3000`

### API Endpoints

- `GET /api/datasets` - List all available datasets
- `POST /api/stream` - Start streaming a dataset
  ```json
  {
    "filePath": "eeg-score/eyes-closed/example.json"
  }
  ```
- `POST /api/stop` - Stop the current stream

## How It Works

1. **Data Generation**:
   - Synthetic data generation (original)
   - OR streaming from pre-recorded EEG datasets (new)

   - The server generates synthetic brain activity data that mimics real Neurosity headset output
   - Data includes simulated metrics like calm, focus, and other brain activity indicators
   - Data is normalized and formatted to match the Neurosity API structure

2. **Data Streaming**:

   - Data is broadcast to all connected WebSocket clients in real-time
   - The data stream includes timestamps and normalized values for all metrics

3. **Visualization**:
   - The frontend establishes a WebSocket connection to the server
   - Multiple visualization components can be toggled via the UI
   - Visualizations update in real-time based on the emulated data

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser to view the emulator interface

## Available Visualizations

- **Circle Visualization**: Displays emulated brain activity in a circular pattern
- **Wave Visualization**: Shows the data stream as a dynamic waveform
- **Metric Display**: Real-time numerical readouts of all simulated metrics

## Development

This emulator is designed to be easily extensible. You can:

- Add new visualization components in the `public/visualizations` directory
- Modify the data generation algorithms in `index.js`
- Customize the simulation parameters in `.env`

## Dependencies

- **Backend**:

  - `express`: Web server
  - `ws`: WebSocket server
  - `dotenv`: Environment variable management
  - `canvas-sketch`: For advanced visualizations

- **Frontend**:
  - HTML5 Canvas for rendering
  - Vanilla JavaScript

## Use Cases

- Testing Neurosity applications without a physical device
- Demonstrating Neurosity applications in environments without hardware
- Developing and debugging visualization components
- Running automated tests against consistent data patterns
