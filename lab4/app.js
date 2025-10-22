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
    
    let gridSize = 30;
    let offsetX = canvas.width / 2;
    let offsetY = canvas.height / 2;
    let currentAlgorithm = 'step';
    let currentPixels = [];
    
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
                    drawPixels(currentPixels);
                }
            });
        });
        
        drawButton.addEventListener('click', () => {
            drawGrid();
            drawWithAlgorithm();
        });
        
        clearButton.addEventListener('click', () => {
            currentPixels = [];
            drawGrid();
            timeResult.textContent = 'Время выполнения: -';
            pixelCount.textContent = 'Количество пикселей: -';
            calculationsElement.innerHTML = '<p>Выберите алгоритм и нажмите "Нарисовать"</p>';
        });
        
        zoomInButton.addEventListener('click', () => {
            if (gridSize < 50) {
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
            gridSize = 30;
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
            drawPixels(currentPixels);
        }
    }
    
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Сетка
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Оси координат
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Ось X
        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        ctx.lineTo(canvas.width, offsetY);
        ctx.stroke();
        
        // Ось Y
        ctx.beginPath();
        ctx.moveTo(offsetX, 0);
        ctx.lineTo(offsetX, canvas.height);
        ctx.stroke();
        
        // Подписи
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        
        // Ось X
        for (let x = offsetX + gridSize; x < canvas.width; x += gridSize) {
            const value = (x - offsetX) / gridSize;
            ctx.fillText(value, x - 5, offsetY + 15);
        }
        for (let x = offsetX - gridSize; x > 0; x -= gridSize) {
            const value = (x - offsetX) / gridSize;
            ctx.fillText(value, x - 5, offsetY + 15);
        }
        
        // Ось Y
        for (let y = offsetY + gridSize; y < canvas.height; y += gridSize) {
            const value = -(y - offsetY) / gridSize;
            ctx.fillText(value, offsetX + 5, y + 5);
        }
        for (let y = offsetY - gridSize; y > 0; y -= gridSize) {
            const value = -(y - offsetY) / gridSize;
            ctx.fillText(value, offsetX + 5, y + 5);
        }
        
        // Ноль
        ctx.fillText('0', offsetX + 5, offsetY + 15);
        
        // Окно отсечения для Кастла-Питвея
        if (currentAlgorithm === 'castel') {
            const xmin = -5, ymin = -5, xmax = 15, ymax = 15;
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                toCanvasX(xmin),
                toCanvasY(ymax),
                (xmax - xmin) * gridSize,
                (ymin - ymax) * gridSize
            );
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(`Окно: [${xmin},${ymin}]-[${xmax},${ymax}]`, 20, 30);
        }
    }
    
    function toCanvasX(x) {
        return offsetX + x * gridSize;
    }
    
    function toCanvasY(y) {
        return offsetY - y * gridSize;
    }
    
    function drawPixel(x, y, color = '#3498db', intensity = 1) {
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);
        
        if (intensity < 1) {
            ctx.fillStyle = `rgba(52, 152, 219, ${intensity})`;
        } else {
            ctx.fillStyle = color;
        }
        
        ctx.fillRect(
            canvasX - gridSize/2 + 1,
            canvasY - gridSize/2 + 1,
            gridSize - 2,
            gridSize - 2
        );
    }
    
    function drawPixels(pixels) {
        pixels.forEach((pixel, index) => {
            if (pixel.intensity !== undefined) {
                drawPixel(pixel.x, pixel.y, '#3498db', pixel.intensity);
            } else {
                drawPixel(pixel.x, pixel.y, index === 0 ? '#e74c3c' : '#3498db');
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
                break;
            case 'dda':
                result = ddaAlgorithm(x1, y1, x2, y2);
                break;
            case 'bresenham':
                result = bresenhamLine(x1, y1, x2, y2);
                break;
            case 'circle':
                result = bresenhamCircle(x1, y1, radius);
                break;
            case 'castel':
                result = castelPitwayAlgorithm(x1, y1, x2, y2);
                break;
            case 'antialiasing':
                result = antialiasingAlgorithm(x1, y1, x2, y2);
                break;
        }
        
        endTime = performance.now();
        
        currentPixels = result.pixels;
        drawPixels(result.pixels);
        
        timeResult.textContent = `Время выполнения: ${(endTime - startTime).toFixed(2)} мс`;
        pixelCount.textContent = `Количество пикселей: ${result.pixels.length}`;
        
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