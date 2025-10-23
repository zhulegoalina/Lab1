document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('rasterCanvas');
    const ctx = canvas.getContext('2d');
    const algorithmButtons = document.querySelectorAll('.algorithm-btn');
    const drawButton = document.getElementById('draw-btn');
    const clearButton = document.getElementById('clear-btn');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetViewButton = document.getElementById('reset-view');
    const gridSizeInput = document.getElementById('grid-size');
    const gridSizeValue = document.getElementById('grid-size-value');
    const x1Input = document.getElementById('x1');
    const y1Input = document.getElementById('y1');
    const x2Input = document.getElementById('x2');
    const y2Input = document.getElementById('y2');
    const radiusInput = document.getElementById('radius');
    const radiusRow = document.getElementById('radius-row');
    const timeResult = document.getElementById('time-result');
    const pixelCount = document.getElementById('pixel-count');
    const calculationsElement = document.getElementById('calculations');
    
    let gridSize = 40;
    let offsetX = canvas.width / 2;
    let offsetY = canvas.height / 2;
    let currentAlgorithm = 'step';
    let currentPixels = [];
    let currentLine = null;
    
    function init() {
        drawGrid();
        setupEventListeners();
        gridSizeInput.value = gridSize;
        gridSizeValue.textContent = gridSize + 'px';
    }
    
    function setupEventListeners() {
        algorithmButtons.forEach(button => {
            button.addEventListener('click', () => {
                algorithmButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentAlgorithm = button.dataset.algorithm;
                
                radiusRow.style.display = currentAlgorithm === 'circle' ? 'flex' : 'none';
                
                drawGrid();
                if (currentPixels.length > 0) {
                    redrawEverything();
                }
            });
        });
        
        drawButton.addEventListener('click', () => {
            drawGrid();
            drawWithAlgorithm();
        });
        
        clearButton.addEventListener('click', () => {
            currentPixels = [];
            currentLine = null;
            drawGrid();
            timeResult.textContent = 'Время выполнения: -';
            pixelCount.textContent = 'Количество пикселей: -';
            calculationsElement.innerHTML = '<p>Выберите алгоритм и нажмите "Нарисовать"</p>';
        });
        
        zoomInButton.addEventListener('click', () => {
            if (gridSize < 60) {
                gridSize += 5;
                updateGridSize();
            }
        });
        
        zoomOutButton.addEventListener('click', () => {
            if (gridSize > 20) {
                gridSize -= 5;
                updateGridSize();
            }
        });
        
        resetViewButton.addEventListener('click', () => {
            gridSize = 40;
            offsetX = canvas.width / 2;
            offsetY = canvas.height / 2;
            updateGridSize();
        });
        
        gridSizeInput.addEventListener('input', () => {
            gridSize = parseInt(gridSizeInput.value);
            updateGridSize();
        });
    }
    
    function updateGridSize() {
        gridSizeInput.value = gridSize;
        gridSizeValue.textContent = gridSize + 'px';
        drawGrid();
        if (currentPixels.length > 0) {
            redrawEverything();
        }
    }
    
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        for (let x = offsetX % gridSize; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = offsetY % gridSize; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        ctx.lineTo(canvas.width, offsetY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX, canvas.height);
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        
        for (let x = offsetX + gridSize; x < canvas.width; x += gridSize) {
            const value = Math.round((x - offsetX) / gridSize);
            ctx.fillText(value, x - 5, offsetY + 15);
        }
        for (let x = offsetX - gridSize; x > 0; x -= gridSize) {
            const value = Math.round((x - offsetX) / gridSize);
            ctx.fillText(value, x - 5, offsetY + 15);
        }
        
        for (let y = offsetY + gridSize; y < canvas.height; y += gridSize) {
            const value = -Math.round((y - offsetY) / gridSize);
            ctx.fillText(value, offsetX + 5, y + 5);
        }
        for (let y = offsetY - gridSize; y > 0; y -= gridSize) {
            const value = -Math.round((y - offsetY) / gridSize);
            ctx.fillText(value, offsetX + 5, y + 5);
        }
        
        ctx.fillText('0', offsetX + 5, offsetY + 15);
        
        if (currentAlgorithm === 'castel' && currentPixels.clippingWindow) {
            drawClippingWindow(currentPixels.clippingWindow);
        }
    }
    
    function toCanvasX(x) {
        return offsetX + x * gridSize;
    }
    
    function toCanvasY(y) {
        return offsetY - y * gridSize;
    }
    
    function drawPixel(x, y) {
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);
        
        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.fillRect(canvasX - gridSize/2, canvasY - gridSize/2, gridSize, gridSize);
        
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvasX - gridSize/2, canvasY - gridSize/2, gridSize, gridSize);
    }
    
    function drawPixelWithIntensity(x, y, intensity) {
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);
        
        const alpha = intensity * 0.8;
        ctx.fillStyle = `rgba(52, 152, 219, ${alpha})`;
        ctx.fillRect(canvasX - gridSize/2, canvasY - gridSize/2, gridSize, gridSize);
        
        ctx.strokeStyle = `rgba(52, 152, 219, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(canvasX - gridSize/2, canvasY - gridSize/2, gridSize, gridSize);
    }
    
    function drawLine(x1, y1, x2, y2, color = '#e74c3c') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
        ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
        ctx.stroke();
    }
    
    function drawCircle(xc, yc, r) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toCanvasX(xc), toCanvasY(yc), r * gridSize, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    function drawClippingWindow(clippingWindow) {
        const { xmin, ymin, xmax, ymax } = clippingWindow;
        
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            toCanvasX(xmin) - gridSize/2,
            toCanvasY(ymax) - gridSize/2,
            (xmax - xmin + 1) * gridSize,
            (ymin - ymax - 1) * gridSize
        );
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#27ae60';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Окно отсечения: [${Math.round(xmin)},${Math.round(ymin)}]-[${Math.round(xmax)},${Math.round(ymax)}]`, 20, 30);
    }
    
    function redrawEverything() {
        drawGrid();
        
        if (currentLine) {
            if (currentAlgorithm === 'circle') {
                drawCircle(currentLine.x1, currentLine.y1, currentLine.radius);
            } else if (currentAlgorithm === 'castel') {
                if (currentPixels.clippingWindow) {
                    drawClippingWindow(currentPixels.clippingWindow);
                }
                if (currentPixels.originalLine) {
                    drawLine(currentPixels.originalLine.x1, currentPixels.originalLine.y1, 
                            currentPixels.originalLine.x2, currentPixels.originalLine.y2, '#999');
                }
                if (currentPixels.clippedLine) {
                    drawLine(currentPixels.clippedLine.x1, currentPixels.clippedLine.y1, 
                            currentPixels.clippedLine.x2, currentPixels.clippedLine.y2, '#e74c3c');
                }
            } else {
                drawLine(currentLine.x1, currentLine.y1, currentLine.x2, currentLine.y2);
            }
        }
        
        currentPixels.forEach(pixel => {
            if (currentAlgorithm === 'antialiasing' && pixel.intensity !== undefined) {
                drawPixelWithIntensity(pixel.x, pixel.y, pixel.intensity);
            } else {
                drawPixel(pixel.x, pixel.y);
            }
        });
    }
    
    function drawWithAlgorithm() {
        const x1 = parseInt(x1Input.value);
        const y1 = parseInt(y1Input.value);
        const x2 = parseInt(x2Input.value);
        const y2 = parseInt(y2Input.value);
        const radius = parseInt(radiusInput.value);
        
        let result = { pixels: [], calculations: [] };
        let startTime, endTime;
        
        startTime = performance.now();
        
        switch (currentAlgorithm) {
            case 'step':
                result = stepAlgorithm(x1, y1, x2, y2);
                currentLine = { x1, y1, x2, y2 };
                break;
            case 'dda':
                result = ddaAlgorithm(x1, y1, x2, y2);
                currentLine = { x1, y1, x2, y2 };
                break;
            case 'bresenham':
                result = bresenhamLine(x1, y1, x2, y2);
                currentLine = { x1, y1, x2, y2 };
                break;
            case 'circle':
                result = bresenhamCircle(x1, y1, radius);
                currentLine = { x1, y1, radius: radius };
                break;
            case 'castel':
                result = castelPitwayAlgorithm(x1, y1, x2, y2);
                currentLine = { 
                    x1: result.pixels.originalLine?.x1 || x1, 
                    y1: result.pixels.originalLine?.y1 || y1, 
                    x2: result.pixels.originalLine?.x2 || x2, 
                    y2: result.pixels.originalLine?.y2 || y2 
                };
                break;
            case 'antialiasing':
                result = antialiasingAlgorithm(x1, y1, x2, y2);
                currentLine = { x1, y1, x2, y2 };
                break;
        }
        
        endTime = performance.now();
        
        currentPixels = result.pixels;
        redrawEverything();
        
        timeResult.textContent = `Время выполнения: ${(endTime - startTime).toFixed(2)} мс`;
        pixelCount.textContent = `Количество пикселей: ${currentPixels.length}`;
        displayCalculations(result.calculations);
    }
    
    function displayCalculations(calculations) {
        calculationsElement.innerHTML = '';
        calculations.forEach(calc => {
            const p = document.createElement('p');
            p.textContent = calc;
            calculationsElement.appendChild(p);
        });
        calculationsElement.scrollTop = calculationsElement.scrollHeight;
    }
    
    init();
});