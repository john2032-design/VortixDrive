// script.js
import SpeedTest from 'https://cdn.jsdelivr.net/npm/@cloudflare/speedtest@latest/index.js';

const startBtn = document.getElementById('startBtn');
const progressContainer = document.getElementById('progressContainer');
const progressLabel = document.getElementById('progressLabel');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const status = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const canvas = document.getElementById('speedometer');
const ctx = canvas.getContext('2d');
const phaseIndicator = document.getElementById('phaseIndicator');

let speedTest;
let currentSpeed = 0;
let targetSpeed = 0;
let animationId;
let testPhase = 'latency'; // Track phase roughly

function drawSpeedometer() {
    ctx.clearRect(0, 0, 300, 300);
    
    // Outer arc
    ctx.beginPath();
    ctx.arc(150, 150, 140, Math.PI * 0.75, Math.PI * 2.25);
    const grad = ctx.createLinearGradient(0, 0, 300, 300);
    grad.addColorStop(0, '#0074D9');
    grad.addColorStop(1, '#B10DC9');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 20;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00FFFF';
    ctx.stroke();
    
    // Ticks
    for (let i = 0; i <= 10; i++) {
        const angle = Math.PI * 0.75 + (Math.PI * 1.5 / 10) * i;
        const x1 = 150 + 120 * Math.cos(angle);
        const y1 = 150 + 120 * Math.sin(angle);
        const x2 = 150 + 140 * Math.cos(angle);
        const y2 = 150 + 140 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00FFFF';
        ctx.stroke();
    }
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Orbitron';
    ctx.shadowBlur = 0;
    for (let i = 0; i <= 10; i += 2) {
        const angle = Math.PI * 0.75 + (Math.PI * 1.5 / 10) * i;
        const x = 150 + 100 * Math.cos(angle) - 15;
        const y = 150 + 100 * Math.sin(angle) + 5;
        ctx.fillText((i * 100).toString(), x, y);
    }
    
    // Needle
    const angle = Math.PI * 0.75 + (Math.PI * 1.5 * Math.min(currentSpeed, 1000) / 1000);
    const nx = 150 + 120 * Math.cos(angle);
    const ny = 150 + 120 * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();
    
    // Center
    ctx.beginPath();
    ctx.arc(150, 150, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#001f3f';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 150, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.fill();
}

function animate() {
    currentSpeed += (targetSpeed - currentSpeed) * 0.1;
    drawSpeedometer();
    if (Math.abs(targetSpeed - currentSpeed) > 0.1) {
        animationId = requestAnimationFrame(animate);
    }
}

function updatePhase(phase) {
    phaseIndicator.textContent = phase;
    phaseIndicator.style.display = 'block';
}

startBtn.addEventListener('click', () => {
    if (animationId) cancelAnimationFrame(animationId);
    startBtn.disabled = true;
    startBtn.textContent = 'Testing...';
    progressContainer.style.display = 'block';
    status.textContent = 'Initializing...';
    resultsDiv.style.display = 'none';
    canvas.style.display = 'block';
    phaseIndicator.style.display = 'none';
    currentSpeed = 0;
    targetSpeed = 0;
    progressBar.style.width = '0%';
    testPhase = 'latency';
    
    updatePhase('Measuring Latency...');
    
    speedTest = new SpeedTest({
        autoStart: true,
        measureDownloadLoadedLatency: true,
        measureUploadLoadedLatency: true
    });
    
    speedTest.onRunningChange = (running) => {
        if (running) {
            status.textContent = 'Running speed test...';
        } else {
            status.textContent = 'Test complete!';
            phaseIndicator.style.display = 'none';
        }
    };
    
    speedTest.onResultsChange = (change) => {
        const downloadBw = speedTest.results.getDownloadBandwidth();
        if (downloadBw > 0) {
            targetSpeed = downloadBw / 1000000; // Mbps
            animate();
        }
        
        // Update progress roughly
        const totalProgress = Math.min(100, (downloadBw / 10000000) * 50 + 50); // Assume half for download
        progressBar.style.width = totalProgress + '%';
        
        // Rough phase detection
        if (testPhase === 'latency' && speedTest.results.getDownloadBandwidthPoints().length > 0) {
            testPhase = 'download';
            updatePhase('Measuring Download...');
        } else if (testPhase === 'download' && speedTest.results.getUploadBandwidthPoints().length > 0) {
            testPhase = 'upload';
            updatePhase('Measuring Upload...');
        }
    };
    
    speedTest.onFinish = (results) => {
        displayResults(results);
        targetSpeed = results.getSummary().download / 1000000;
        animate();
        startBtn.disabled = false;
        startBtn.textContent = 'Retest';
        progressContainer.style.display = 'none';
        resultsDiv.style.display = 'block';
    };
    
    speedTest.onError = (error) => {
        status.textContent = `Error: ${error.message || error}`;
        startBtn.disabled = false;
        startBtn.textContent = 'Start Test';
        progressContainer.style.display = 'none';
        canvas.style.display = 'none';
        phaseIndicator.style.display = 'none';
        if (animationId) cancelAnimationFrame(animationId);
    };
});

function displayResults(results) {
    const summary = results.getSummary();
    document.getElementById('download').textContent = (summary.download / 1000000).toFixed(1) + ' Mbps';
    document.getElementById('upload').textContent = (summary.upload / 1000000).toFixed(1) + ' Mbps';
    document.getElementById('latency').textContent = summary.unloadedLatency.toFixed(0) + ' ms';
    document.getElementById('jitter').textContent = summary.unloadedJitter.toFixed(0) + ' ms';
    document.getElementById('packetLoss').textContent = (summary.packetLoss * 100).toFixed(1) + '%';
    document.getElementById('downLoaded').textContent = results.getDownLoadedLatency().toFixed(0) + ' ms';
    document.getElementById('upLoaded').textContent = results.getUpLoadedLatency().toFixed(0) + ' ms';
    const scores = results.getScores();
    document.getElementById('streaming').textContent = scores.streaming.toFixed(0);
    document.getElementById('gaming').textContent = scores.gaming.toFixed(0);
    document.getElementById('rtc').textContent = scores.rtc.toFixed(0);
}
