const { GoogleGenerativeAI } = require('@google/generative-ai');

class MessageBroker {
    constructor(io) {
        this.topics = {};
        this.io = io;
    }

    subscribe(topic, subscriber) {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }
        this.topics[topic].push(subscriber);
    }

    publish(topic, data) {
        if (this.topics[topic]) {
            this.topics[topic].forEach(subscriber => {
                subscriber.notify(topic, data);
            });
        }
        this.io.emit(topic, data);
    }
}

class DataIngestionService {
    constructor(broker) {
        this.broker = broker;
    }

    ingest(data) {
        console.log('Data Ingestion: Writing to data lake', data);
        this.broker.publish('raw_data', data);
    }
}

class DataProcessingService {
    constructor(broker) {
        this.broker = broker;
        this.broker.subscribe('raw_data', this);
    }

    notify(topic, data) {
        if (topic === 'raw_data') {
            console.log('Data Processing: Writing to data warehouse', data);
            this.broker.publish('processed_data', data);
            this.broker.publish('update', data);
        }
    }
}

class AnomalyDetectionService {
    constructor(broker) {
        this.broker = broker;
        this.broker.subscribe('processed_data', this);
    }

    notify(topic, data) {
        if (topic === 'processed_data') {
            const anomaly = this.detect(data);
            if (anomaly) {
                this.broker.publish('anomaly', anomaly);
            }
        }
    }

    detect(data) {
        if (data.type === 'pos' && data.sales > 200) {
            return {
                type: 'demand_surge',
                severity: 'high',
                message: `Unusual high demand detected: ${data.sales} units`,
                timestamp: new Date().toISOString(),
                location: data.store_id,
            };
        }
        return null;
    }
}

class SmartAutonomousDecisionMakingService {
    constructor(broker, io) {
        this.broker = broker;
        this.io = io;
        this.broker.subscribe('anomaly', this);
        this.broker.subscribe('simulation_result', this);
    }

    notify(topic, data) {
        if (topic === 'anomaly' || topic === 'simulation_result') {
            const decision = this.makeDecision(data);
            this.io.emit('decision', decision);
        }
    }

    makeDecision(data) {
        return {
            type: 'restock_order',
            message: 'Automatically ordered additional inventory',
            timestamp: new Date().toISOString(),
            details: { quantity: 50, eta: '2 hours' },
            anomaly: data,
        };
    }
}

class SimulationService {
    constructor(broker) {
        this.broker = broker;
    }

    run(scenario) {
        const result = {
            type: 'simulation_result',
            message: `Simulation for ${scenario} complete.`,
            timestamp: new Date().toISOString(),
            scenario: scenario,
        };
        this.broker.publish('simulation_result', result);
    }
}

class MetricsService {
    constructor(broker) {
        this.broker = broker;
        this.warehouseOccupancy = 0.75;
        this.warehouseItems = 15000;
        this.wasteSaved = 1200;
        this.carbonReduced = 800;
        this.openStores = 4500;
        this.onTimeDelivery = 98.5;
        this.weather = {
            temperature: 25,
            condition: 'Sunny',
            humidity: 60,
            wind: 15
        };

        setInterval(() => this.generateMetrics(), 5000);
    }

    generateMetrics() {
        this.warehouseOccupancy = Math.min(1, this.warehouseOccupancy + (Math.random() * 0.05 - 0.02));
        this.warehouseItems = Math.floor(this.warehouseItems + (Math.random() * 100 - 50));
        this.wasteSaved = Math.floor(this.wasteSaved + (Math.random() * 10 - 5));
        this.carbonReduced = Math.floor(this.carbonReduced + (Math.random() * 8 - 4));
        this.openStores = Math.floor(this.openStores + (Math.random() * 2 - 1));
        this.onTimeDelivery = Math.min(100, Math.max(95, this.onTimeDelivery + (Math.random() * 0.5 - 0.25)));
        this.weather.temperature = Math.floor(20 + Math.random() * 15);
        this.weather.humidity = Math.floor(40 + Math.random() * 40);
        this.weather.wind = Math.floor(5 + Math.random() * 20);

        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
        this.weather.condition = conditions[Math.floor(Math.random() * conditions.length)];

        this.broker.publish('metrics_update', {
            warehouseOccupancy: this.warehouseOccupancy.toFixed(2),
            warehouseItems: this.warehouseItems,
            wasteSaved: this.wasteSaved,
            carbonReduced: this.carbonReduced,
            openStores: this.openStores,
            onTimeDelivery: this.onTimeDelivery.toFixed(2),
            weather: this.weather
        });
    }
}

class AIInsightsService {
    constructor(broker) {
        this.broker = broker;
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDp5ydkxeutrb_WRl6zB21NWkPv-C9fsq4');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        setInterval(() => this.generateInsights(), 10000);
    }

    async generateInsights() {
        try {
            const prompt = "Generate a concise supply chain insight based on current trends or potential anomalies. Keep it under 30 words.";
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            this.broker.publish('ai_insights', { insight: text });
        } catch (error) {
            console.error("Error generating AI insights:", error);
            this.broker.publish('ai_insights', { insight: "Error generating insights." });
        }
    }
}

module.exports = { MessageBroker, DataIngestionService, DataProcessingService, AnomalyDetectionService, SmartAutonomousDecisionMakingService, SimulationService, MetricsService, AIInsightsService };