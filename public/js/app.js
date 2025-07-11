const socket = io('http://localhost:3001');

// Chart instances
let salesChart;
let iotChart;
let inventoryTurnoverChart;
let onTimeDeliveryChart;
let supplierOnTimeChart;
let transportCostChart;

let activeAnomaly = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();

    const simulateAnomalyBtn = document.getElementById('simulate-anomaly-btn');
    simulateAnomalyBtn.addEventListener('click', () => {
        const scenario = prompt("Enter anomaly type to simulate (e.g., demand_surge, delivery_delay, warehouse_fire, supplier_strike):");
        if (scenario) {
            socket.emit('simulate_anomaly', { scenario });
        }
    });

    // Log tab switching logic
    document.querySelectorAll('.log-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.log-content').forEach(content => content.style.display = 'none');
            document.getElementById(`log-content-${this.dataset.logCategory}`).style.display = 'block';
        });
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

    const inventoryTurnoverCtx = document.getElementById('inventoryTurnoverChart').getContext('2d');
    inventoryTurnoverChart = new Chart(inventoryTurnoverCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Inventory Turnover',
                data: [],
                backgroundColor: '#0071ce',
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
                    beginAtZero: true,
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

    const onTimeDeliveryCtx = document.getElementById('onTimeDeliveryChart').getContext('2d');
    onTimeDeliveryChart = new Chart(onTimeDeliveryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'On-Time Delivery',
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
                    beginAtZero: true,
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

    const supplierOnTimeCtx = document.getElementById('supplierOnTimeChart').getContext('2d');
    supplierOnTimeChart = new Chart(supplierOnTimeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Supplier On-Time Delivery',
                data: [],
                backgroundColor: '#ffc220',
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
                    beginAtZero: true,
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

    const transportCostCtx = document.getElementById('transportCostChart').getContext('2d');
    transportCostChart = new Chart(transportCostCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Transportation Cost/Mile',
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
                    beginAtZero: true,
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
        addLogEntry('metric-update', `POS Data: Sales - ${data.sales}, Transactions - ${data.transactions}`);
    } else if (data.type === 'iot') {
        updateChart(iotChart, data.timestamp, data.value);
        document.getElementById('current-temp').textContent = `${data.value.toFixed(1)}°C`;
        addLogEntry('metric-update', `IoT Data: Temperature - ${data.value.toFixed(1)}°C`);
    }
});

socket.on('anomaly', (anomaly) => {
    const anomalyAlertsEl = document.getElementById('anomaly-alerts');
    const alertEl = document.createElement('div');
    alertEl.className = 'alert-item';
    alertEl.innerHTML = `<strong>${anomaly.type.replace(/_/g, ' ').toUpperCase()}</strong>: ${anomaly.message}`;
    anomalyAlertsEl.prepend(alertEl);

    highlightMetrics(anomaly.affectedMetrics, 'red');
    activeAnomaly = anomaly;
    addLogEntry('anomaly', `Anomaly Detected: ${anomaly.message}`);
});

socket.on('decision', (decision) => {
    const decisionsDisplayEl = document.getElementById('decisions-display');
    const decisionEl = document.createElement('div');
    decisionEl.className = 'decision-item';
    decisionEl.innerHTML = `<strong>${decision.type.replace(/_/g, ' ').toUpperCase()}</strong>: ${decision.message}`;
    decisionsDisplayEl.prepend(decisionEl);
    addLogEntry('decision', `Decision Made: ${decision.message}`);
});

socket.on('metrics_update', (metrics) => {
    document.getElementById('warehouse-occupancy').textContent = `${(metrics.warehouseOccupancy * 100).toFixed(1)}%`;
    document.getElementById('warehouse-items').textContent = metrics.warehouseItems;
    document.getElementById('waste-saved').textContent = `${metrics.wasteSaved} kg`;
    document.getElementById('carbon-reduced').textContent = `${metrics.carbonReduced} kg`;
    document.getElementById('open-stores').textContent = metrics.openStores;
    document.getElementById('on-time-delivery').textContent = `${metrics.onTimeDelivery}%`;
    document.getElementById('inventory-turnover').textContent = metrics.inventoryTurnover;
    document.getElementById('order-fulfillment-time').textContent = `${metrics.orderFulfillmentTime} hrs`;
    document.getElementById('supplier-on-time').textContent = `${metrics.supplierOnTimeDelivery}%`;
    document.getElementById('supplier-defect-rate').textContent = `${metrics.supplierDefectRate}%`;
    document.getElementById('transport-cost-per-mile').textContent = `$${metrics.transportationCostPerMile}`;
    document.getElementById('warehouse-pick-rate').textContent = metrics.warehousePickRate;
    document.getElementById('return-rate').textContent = `${(metrics.returnRate * 100).toFixed(2)}%`;

    document.getElementById('weather-icon').textContent = getWeatherIcon(metrics.weather.condition);
    document.getElementById('weather-temp').textContent = `${metrics.weather.temperature}°C`;
    document.getElementById('weather-condition').textContent = metrics.weather.condition;
    document.getElementById('humidity').textContent = `${metrics.weather.humidity}%`;

    // Update new charts
    updateChart(inventoryTurnoverChart, new Date().toISOString(), metrics.inventoryTurnover);
    updateChart(onTimeDeliveryChart, new Date().toISOString(), metrics.onTimeDelivery);
    updateChart(supplierOnTimeChart, new Date().toISOString(), metrics.supplierOnTimeDelivery);
    updateChart(transportCostChart, new Date().toISOString(), metrics.transportationCostPerMile);

    // Re-apply anomaly highlighting on metric updates if an anomaly is active
    if (activeAnomaly) {
        highlightMetrics(activeAnomaly.affectedMetrics, 'red');
    }
    addLogEntry('metric-update', `Metrics Updated: Warehouse Occupancy - ${(metrics.warehouseOccupancy * 100).toFixed(1)}%, On-Time Delivery - ${metrics.onTimeDelivery}%`);
});

socket.on('ai_insights', (insight) => {
    document.getElementById('ai-insights-content').textContent = insight.insight;
    addLogEntry('ai-insight', `AI Insight: ${insight.insight}`);
});

socket.on('ai_solution', (data) => {
    const aiInsightsContent = document.getElementById('ai-insights-content');
    const solutionEl = document.createElement('div');
    solutionEl.className = 'ai-solution-item';
    solutionEl.innerHTML = `<strong>AI Solution for ${data.anomaly.type.replace(/_/g, ' ').toUpperCase()}:</strong> ${data.solution}`;
    aiInsightsContent.prepend(solutionEl);

    addLogEntry('ai-insight', `AI Solution: ${data.solution}`);

    // Clear anomaly highlighting after a solution is provided (or after a delay)
    setTimeout(() => {
        clearHighlights();
        activeAnomaly = null;
    }, 10000); // Clear after 10 seconds
});

socket.on('simulation_result', (data) => {
    addLogEntry('simulation', `Simulation Result: ${data.message}`);
    highlightMetrics(data.affectedMetrics, 'red');
    activeAnomaly = data;
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
        case 'stormy': return '⛈️';
        default: return '❓';
    }
}

function highlightMetrics(metricIds, colorClass) {
    // Clear any existing highlights first
    clearHighlights();

    metricIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add(`highlight-${colorClass}`);
            // Also highlight the parent card for better visibility
            let parentCard = element.closest('.card');
            if (parentCard) {
                parentCard.classList.add(`highlight-${colorClass}-border`);
            }
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.highlight-red').forEach(el => el.classList.remove('highlight-red'));
    document.querySelectorAll('.highlight-green').forEach(el => el.classList.remove('highlight-green'));
    document.querySelectorAll('.highlight-red-border').forEach(el => el.classList.remove('highlight-red-border'));
    document.querySelectorAll('.highlight-green-border').forEach(el => el.classList.remove('highlight-green-border'));
}

function addLogEntry(category, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `<div class="log-entry ${category}"><strong>[${timestamp}] [${category.toUpperCase()}]</strong> ${message}</div>`;

    document.getElementById('log-content-all').prepend(htmlToElement(logEntry));
    if (document.getElementById(`log-content-${category}`)) {
        document.getElementById(`log-content-${category}`).prepend(htmlToElement(logEntry));
    }
}

function htmlToElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}
