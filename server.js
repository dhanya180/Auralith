const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MessageBroker, DataIngestionService, DataProcessingService, AnomalyDetectionService, SmartAutonomousDecisionMakingService, SimulationService, MetricsService, AIInsightsService } = require('./services.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

// Initialize services
const broker = new MessageBroker(io);
const dataIngestionService = new DataIngestionService(broker);
const dataProcessingService = new DataProcessingService(broker);
const anomalyDetectionService = new AnomalyDetectionService(broker);
const smartAutonomousDecisionMakingService = new SmartAutonomousDecisionMakingService(broker, io);
const simulationService = new SimulationService(broker);
const metricsService = new MetricsService(broker);
const aiInsightsService = new AIInsightsService(broker);

// API Routes
app.post('/api/simulate', (req, res) => {
  const { scenario } = req.body;
  simulationService.run(scenario);
  res.json({ message: `Simulation for ${scenario} started.` });
});

app.post('/api/feedback', (req, res) => {
  const { feedback, decision } = req.body;
  // In a real system, this would be logged to a data lake
  console.log('Feedback received:', { feedback, decision });
  res.json({ message: 'Feedback received.' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('simulate_anomaly', (data) => {
    simulationService.run(data.scenario);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate real-time data
setInterval(() => {
  const posData = {
    type: 'pos',
    timestamp: new Date().toISOString(),
    store_id: `store${Math.floor(Math.random() * 2) + 1}`,
    sales: Math.floor(Math.random() * 300),
    transactions: Math.floor(Math.random() * 50),
  };
  dataIngestionService.ingest(posData);

  const iotData = {
    type: 'iot',
    timestamp: new Date().toISOString(),
    sensor_id: `temp_sensor_${Math.floor(Math.random() * 5) + 1}`,
    sensor_type: 'temperature',
    value: 18 + Math.random() * 15, // 18-33°C
    location: `warehouse_${Math.floor(Math.random() * 3) + 1}`
  };
  dataIngestionService.ingest(iotData);
}, 3000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Auralith Backend running on port ${PORT}`);
});

module.exports = app;