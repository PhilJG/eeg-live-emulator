# Neurosity Live Emulator

A local development tool that emulates Neurosity headset data for testing and development purposes. This emulator provides realistic brain activity data streams that mimic the behavior of a real Neurosity headset, allowing developers to test their applications without requiring physical hardware.

## Features

- Simulates various brain activity metrics (calm, focus, etc.)
- Real-time data streaming via WebSocket
- Multiple visualization modes for data monitoring
- Configurable data generation parameters
- No physical Neurosity device required

## Project Structure

```
.
├── index.js              # Backend server and data emulation
├── public/               # Frontend files
│   ├── index.html        # Main HTML interface
│   ├── sketch.js         # Main visualization code
│   └── visualizations/   # Visualization components
│       ├── circle.js     # Circular visualization
│       └── wave.js       # Waveform visualization
├── .env                  # Environment configuration
└── package.json          # Project dependencies
```

## How It Works

1. **Data Generation**:

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
