const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const algorithmSelect = document.getElementById('algorithm');
const inputData = document.getElementById('inputData');
const loadDataBtn = document.getElementById('loadData');
const xminInput = document.getElementById('xmin');
const yminInput = document.getElementById('ymin');
const xmaxInput = document.getElementById('xmax');
const ymaxInput = document.getElementById('ymax');
const polygonPointsInput = document.getElementById('polygonPoints');
const rectangleControls = document.getElementById('rectangle-controls');
const polygonControls = document.getElementById('polygon-controls');
const updateAreaBtn = document.getElementById('updateArea');
const clipSegmentsBtn = document.getElementById('clipSegments');
const clearCanvasBtn = document.getElementById('clearCanvas');
const calculationsDiv = document.getElementById('calculations');

let segments = [];
let clippingArea = {
    type: 'rectangle',
    points: [{x: 100, y: 100}, {x: 300, y: 100}, {x: 300, y: 300}, {x: 100, y: 300}]
};

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

function init() {
    drawCoordinateSystem();
    drawClippingArea();
    loadDefaultData();
    setupEventListeners();
}

function setupEventListeners() {
    loadDataBtn.addEventListener('click', parseInputData);
    updateAreaBtn.addEventListener('click', updateClippingArea);
    clipSegmentsBtn.addEventListener('click', performClipping);
    clearCanvasBtn.addEventListener('click', clearCanvas);
    
    algorithmSelect.addEventListener('change', function() {
        const isPolygon = this.value === 'polygon';
        rectangleControls.style.display = isPolygon ? 'none' : 'block';
        polygonControls.style.display = isPolygon ? 'block' : 'none';
        clippingArea.type = isPolygon ? 'polygon' : 'rectangle';
        updateClippingArea();
    });
}

function loadDefaultData() {
    const defaultData = `5
50 50 200 150
100 200 300 100
150 50 250 250
50 200 250 50
200 200 350 100`;
    
    inputData.value = defaultData;
    parseInputData();
}

function parseInputData() {
    const lines = inputData.value.trim().split('\n');
    const n = parseInt(lines[0]);
    
    segments = [];
    for (let i = 1; i <= n; i++) {
        const coords = lines[i].trim().split(/\s+/).map(Number);
        if (coords.length >= 4) {
            segments.push({
                x1: coords[0], y1: coords[1],
                x2: coords[2], y2: coords[3],
                visible: false
            });
        }
    }
    
    redraw();
}

function updateClippingArea() {
    if (clippingArea.type === 'rectangle') {
        const xmin = parseInt(xminInput.value);
        const ymin = parseInt(yminInput.value);
        const xmax = parseInt(xmaxInput.value);
        const ymax = parseInt(ymaxInput.value);
        
        clippingArea.points = [
            {x: xmin, y: ymin},
            {x: xmax, y: ymin},
            {x: xmax, y: ymax},
            {x: xmin, y: ymax}
        ];
    } else {
        const coords = polygonPointsInput.value.trim().split(/\s+/).map(Number);
        clippingArea.points = [];
        for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
                clippingArea.points.push({x: coords[i], y: coords[i + 1]});
            }
        }
        
        if (!isConvexPolygon(clippingArea.points)) {
            calculationsDiv.innerHTML = '<div class="calc-step" style="color: red;">Ошибка: Многоугольник должен быть выпуклым!</div>';
            clippingArea.points = [];
            return;
        }
    }
    redraw();
}

function isConvexPolygon(points) {
    if (points.length < 3) return false;
    
    let sign = 0;
    for (let i = 0; i < points.length; i++) {
        const A = points[i];
        const B = points[(i + 1) % points.length];
        const C = points[(i + 2) % points.length];
        
        const crossProduct = (B.x - A.x) * (C.y - B.y) - (B.y - A.y) * (C.x - B.x);
        
        if (crossProduct !== 0) {
            if (sign === 0) {
                sign = crossProduct > 0 ? 1 : -1;
            } else if ((crossProduct > 0 && sign < 0) || (crossProduct < 0 && sign > 0)) {
                return false;
            }
        }
    }
    return true;
}

function computeCode(x, y) {
    let code = INSIDE;
    const bounds = clippingArea.points;
    const xmin = Math.min(bounds[0].x, bounds[1].x, bounds[2].x, bounds[3].x);
    const xmax = Math.max(bounds[0].x, bounds[1].x, bounds[2].x, bounds[3].x);
    const ymin = Math.min(bounds[0].y, bounds[1].y, bounds[2].y, bounds[3].y);
    const ymax = Math.max(bounds[0].y, bounds[1].y, bounds[2].y, bounds[3].y);
    
    if (x < xmin) code |= LEFT;
    if (x > xmax) code |= RIGHT;
    if (y < ymin) code |= BOTTOM;
    if (y > ymax) code |= TOP;
    return code;
}

function midpointClip(x1, y1, x2, y2) {
    let steps = [];
    
    function clip(x1, y1, x2, y2, depth = 0) {
        if (depth > 10) {
            steps.push("Максимальная глубина рекурсии");
            return null;
        }
        
        const code1 = computeCode(x1, y1);
        const code2 = computeCode(x2, y2);
        
        steps.push(`Глубина ${depth}: P1(${Math.round(x1)},${Math.round(y1)}) код=${code1}, P2(${Math.round(x2)},${Math.round(y2)}) код=${code2}`);
        
        if (code1 === 0 && code2 === 0) {
            steps.push("Обе точки внутри - отрезок видим");
            return { x1, y1, x2, y2 };
        }
        
        if (code1 & code2) {
            steps.push("Обе точки с одной стороны - отрезок невидим");
            return null;
        }
        
        const midX = Math.round((x1 + x2) / 2);
        const midY = Math.round((y1 + y2) / 2);
        
        if (Math.abs(x1 - midX) < 1 && Math.abs(y1 - midY) < 1) {
            steps.push("Отрезок выродился в точку");
            return computeCode(midX, midY) === 0 ? 
                { x1: midX, y1: midY, x2: midX, y2: midY } : null;
        }
        
        steps.push(`Средняя точка: M(${midX},${midY})`);
        
        const leftPart = clip(x1, y1, midX, midY, depth + 1);
        const rightPart = clip(midX, midY, x2, y2, depth + 1);
        
        if (leftPart && rightPart) {
            return {
                x1: leftPart.x1, y1: leftPart.y1,
                x2: rightPart.x2, y2: rightPart.y2
            };
        }
        
        return leftPart || rightPart;
    }
    
    const result = clip(x1, y1, x2, y2);
    return { result, steps };
}

function polygonClip(x1, y1, x2, y2) {
    let steps = [];
    let tEnter = 0;
    let tLeave = 1;
    
    const p1 = { x: x1, y: y1 };
    const p2 = { x: x2, y: y2 };
    const D = { x: p2.x - p1.x, y: p2.y - p1.y };
    
    steps.push(`Отрезок: P1(${x1},${y1}) - P2(${x2},${y2})`);
    steps.push(`Вектор направления: D(${D.x},${D.y})`);
    
    for (let i = 0; i < clippingArea.points.length; i++) {
        const A = clippingArea.points[i];
        const B = clippingArea.points[(i + 1) % clippingArea.points.length];
        
        const edge = { x: B.x - A.x, y: B.y - A.y };
        const normal = { x: -edge.y, y: edge.x };
        
        steps.push(`Ребро ${i}: (${A.x},${A.y})-(${B.x},${B.y})`);
        steps.push(`Нормаль: N(${normal.x},${normal.y})`);
        
        const w = { x: p1.x - A.x, y: p1.y - A.y };
        const DdotN = D.x * normal.x + D.y * normal.y;
        const WdotN = w.x * normal.x + w.y * normal.y;
        
        steps.push(`D·N = ${DdotN}, W·N = ${WdotN}`);
        
        if (Math.abs(DdotN) > 1e-10) {
            const t = -WdotN / DdotN;
            steps.push(`t = ${t.toFixed(3)}`);
            
            if (DdotN > 0) {
                if (t > tEnter) {
                    tEnter = t;
                    steps.push(`Новое tEnter = ${t.toFixed(3)}`);
                }
            } else {
                if (t < tLeave) {
                    tLeave = t;
                    steps.push(`Новое tLeave = ${t.toFixed(3)}`);
                }
            }
        } else if (WdotN < 0) {
            steps.push("Отрезок параллелен и снаружи - отбрасываем");
            return { result: null, steps };
        }
        
        steps.push(`Текущие: tEnter = ${tEnter.toFixed(3)}, tLeave = ${tLeave.toFixed(3)}`);
    }
    
    if (tEnter <= tLeave && tEnter <= 1 && tLeave >= 0) {
        const clippedX1 = p1.x + tEnter * D.x;
        const clippedY1 = p1.y + tEnter * D.y;
        const clippedX2 = p1.x + tLeave * D.x;
        const clippedY2 = p1.y + tLeave * D.y;
        
        steps.push(`Видимая часть: (${clippedX1.toFixed(1)},${clippedY1.toFixed(1)})-(${clippedX2.toFixed(1)},${clippedY2.toFixed(1)})`);
        return {
            result: { x1: clippedX1, y1: clippedY1, x2: clippedX2, y2: clippedY2 },
            steps
        };
    } else {
        steps.push("Отрезок полностью невидим");
        return { result: null, steps };
    }
}

function performClipping() {
    const algorithm = algorithmSelect.value;
    calculationsDiv.innerHTML = '';

    segments.forEach((segment, index) => {
        const calcDiv = document.createElement('div');
        calcDiv.className = 'calc-step';
        calcDiv.innerHTML = `<strong>Отрезок ${index + 1}: (${segment.x1},${segment.y1})-(${segment.x2},${segment.y2})</strong>`;
        calculationsDiv.appendChild(calcDiv);

        let result;
        
        if (algorithm === 'midpoint') {
            result = midpointClip(segment.x1, segment.y1, segment.x2, segment.y2);
        } else {
            result = polygonClip(segment.x1, segment.y1, segment.x2, segment.y2);
        }

        if (result.result) {
            segment.visible = true;
            segment.clippedX1 = result.result.x1;
            segment.clippedY1 = result.result.y1;
            segment.clippedX2 = result.result.x2;
            segment.clippedY2 = result.result.y2;
        } else {
            segment.visible = false;
        }

        result.steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'calc-step';
            stepDiv.textContent = step;
            calculationsDiv.appendChild(stepDiv);
        });

        const resultDiv = document.createElement('div');
        resultDiv.className = 'calc-step';
        resultDiv.innerHTML = `<strong>Результат: ${segment.visible ? 'ВИДИМ' : 'НЕВИДИМ'}</strong>`;
        calculationsDiv.appendChild(resultDiv);
        
        calculationsDiv.appendChild(document.createElement('br'));
    });

    redraw();
}

function drawCoordinateSystem() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawClippingArea() {
    if (clippingArea.points.length < 2) return;
    
    ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(clippingArea.points[0].x, clippingArea.points[0].y);
    for (let i = 1; i < clippingArea.points.length; i++) {
        ctx.lineTo(clippingArea.points[i].x, clippingArea.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#0066ff';
    clippingArea.points.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawSegments() {
    segments.forEach(segment => {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.stroke();
        
        if (segment.visible) {
            ctx.strokeStyle = 'rgba(0, 180, 0, 0.9)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.moveTo(segment.clippedX1, segment.clippedY1);
            ctx.lineTo(segment.clippedX2, segment.clippedY2);
            ctx.stroke();
        }
    });
}

function redraw() {
    drawCoordinateSystem();
    drawClippingArea();
    drawSegments();
}

function clearCanvas() {
    segments.forEach(segment => {
        segment.visible = false;
    });
    calculationsDiv.innerHTML = '';
    redraw();
}

init();