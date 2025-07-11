const socket = io('http://localhost:3001');

// Chart instances
let salesChart;
let iotChart;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();

    const simulateAnomalyBtn = document.getElementById('simulate-anomaly-btn');
    simulateAnomalyBtn.addEventListener('click', () => {
        const scenario = prompt("Enter anomaly type to simulate (e.g., demand_surge):");
        if (scenario) {
            socket.emit('simulate_anomaly', { scenario });
        }
    });
});

function initializeCharts() {
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sales',
                data: [],
                borderColor: '#0071ce',
                backgroundColor: 'rgba(0, 113, 206, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#666' },
                    grid: { color: '#eee' }
                },
                y: {
                    ticks: { color: '#666' },
                    grid: { color: '#eee' }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const iotCtx = document.getElementById('iotChart').getContext('2d');
    iotChart = new Chart(iotCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#ffc220',
                backgroundColor: 'rgba(255, 194, 32, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#666' },
                    grid: { color: '#eee' }
                },
                y: {
                    ticks: { color: '#666' },
                    grid: { color: '#eee' }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

socket.on('update', (data) => {
    const lastUpdateEl = document.getElementById('last-update');
    lastUpdateEl.textContent = new Date().toLocaleTimeString();

    if (data.type === 'pos') {
        updateChart(salesChart, data.timestamp, data.sales);
        document.getElementById('total-sales').textContent = data.sales;
        document.getElementById('avg-transaction').textContent = data.transactions;
    } else if (data.type === 'iot') {
        updateChart(iotChart, data.timestamp, data.value);
        document.getElementById('current-temp').textContent = `${data.value.toFixed(1)}°C`;
    }
});

socket.on('anomaly', (anomaly) => {
    const anomalyAlertsEl = document.getElementById('anomaly-alerts');
    const alertEl = document.createElement('div');
    alertEl.className = 'alert-item';
    alertEl.innerHTML = `<strong>${anomaly.type.replace(/_/g, ' ').toUpperCase()}</strong>: ${anomaly.message}`;
    anomalyAlertsEl.prepend(alertEl);
});

socket.on('decision', (decision) => {
    const decisionsDisplayEl = document.getElementById('decisions-display');
    const decisionEl = document.createElement('div');
    decisionEl.className = 'decision-item';
    decisionEl.innerHTML = `<strong>${decision.type.replace(/_/g, ' ').toUpperCase()}</strong>: ${decision.message}`;
    decisionsDisplayEl.prepend(decisionEl);
});

socket.on('metrics_update', (metrics) => {
    document.getElementById('warehouse-occupancy').textContent = `${(metrics.warehouseOccupancy * 100).toFixed(1)}%`;
    document.getElementById('warehouse-items').textContent = metrics.warehouseItems;
    document.getElementById('waste-saved').textContent = `${metrics.wasteSaved} kg`;
    document.getElementById('carbon-reduced').textContent = `${metrics.carbonReduced} kg`;
    document.getElementById('open-stores').textContent = metrics.openStores;
    document.getElementById('on-time-delivery').textContent = `${metrics.onTimeDelivery}%`;

    document.getElementById('weather-icon').textContent = getWeatherIcon(metrics.weather.condition);
    document.getElementById('weather-temp').textContent = `${metrics.weather.temperature}°C`;
    document.getElementById('weather-condition').textContent = metrics.weather.condition;
    document.getElementById('humidity').textContent = `${metrics.weather.humidity}%`;
});

socket.on('ai_insights', (insight) => {
    document.getElementById('ai-insights-content').textContent = insight.insight;
});

function updateChart(chart, label, newData) {
    chart.data.labels.push(new Date(label).toLocaleTimeString());
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newData);
    });
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((dataset) => {
            dataset.data.shift();
        });
    }
    chart.update();
}

function getWeatherIcon(condition) {
    switch (condition.toLowerCase()) {
        case 'sunny': return '☀️';
        case 'cloudy': return '☁️';
        case 'rainy': return '🌧️';
        case 'partly cloudy': return '⛅';
        default: return '❓';
    }
}