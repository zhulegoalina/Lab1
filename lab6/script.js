const STICK_WIDTH = 15;
const STICK_HEIGHT = 80;
const STICK_DEPTH = 15;

// Функция создания бруска
function createBar(centerX, centerY, centerZ, width, height, depth, angle = 0) {
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;
    
    let vertices = [
        // Передняя грань
        [-halfW, -halfH, halfD],
        [halfW, -halfH, halfD],
        [halfW, halfH, halfD],
        [-halfW, halfH, halfD],
        
        // Задняя грань
        [-halfW, -halfH, -halfD],
        [halfW, -halfH, -halfD],
        [halfW, halfH, -halfD],
        [-halfW, halfH, -halfD]
    ];
    
    // Поворот
    if (angle !== 0) {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        vertices = vertices.map(v => [
            v[0] * cosA - v[1] * sinA,
            v[0] * sinA + v[1] * cosA,
            v[2]
        ]);
    }
    
    // Позиция
    return vertices.map(v => [
        v[0] + centerX,
        v[1] + centerY,
        v[2] + centerZ
    ]);
}

// Создаём 5 брусков для буквы "Ж"
const verticalBar = createBar(0, 0, 0, STICK_WIDTH, STICK_HEIGHT * 1.8, STICK_DEPTH);

const topLeftDiagonal = createBar(
    -STICK_HEIGHT * 0.4,
    STICK_HEIGHT * 0.4,
    0,
    STICK_WIDTH,
    STICK_HEIGHT,
    STICK_DEPTH,
    Math.PI / 4
);

const topRightDiagonal = createBar(
    STICK_HEIGHT * 0.4,
    STICK_HEIGHT * 0.4,
    0,
    STICK_WIDTH,
    STICK_HEIGHT,
    STICK_DEPTH,
    -Math.PI / 4
);

const bottomLeftDiagonal = createBar(
    -STICK_HEIGHT * 0.4,
    -STICK_HEIGHT * 0.4,
    0,
    STICK_WIDTH,
    STICK_HEIGHT,
    STICK_DEPTH,
    -Math.PI / 4
);

const bottomRightDiagonal = createBar(
    STICK_HEIGHT * 0.4,
    -STICK_HEIGHT * 0.4,
    0,
    STICK_WIDTH,
    STICK_HEIGHT,
    STICK_DEPTH,
    Math.PI / 4
);

// Все вершины
const vertices = [
    ...verticalBar,
    ...topLeftDiagonal,
    ...topRightDiagonal,
    ...bottomLeftDiagonal,
    ...bottomRightDiagonal
];

// Рёбра
const edges = [];
const barOffsets = [0, 8, 16, 24, 32];

barOffsets.forEach(offset => {
    edges.push(
        [offset, offset+1], [offset+1, offset+2], [offset+2, offset+3], [offset+3, offset],
        [offset+4, offset+5], [offset+5, offset+6], [offset+6, offset+7], [offset+7, offset+4],
        [offset, offset+4], [offset+1, offset+5], [offset+2, offset+6], [offset+3, offset+7]
    );
});

// ==================== МАТРИЦА ПРЕОБРАЗОВАНИЙ ====================
let transformMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
];

// ==================== УТИЛИТЫ ====================
function multiplyMatrixVector(m, v) {
    return [
        m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2] + m[0][3],
        m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2] + m[1][3],
        m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2] + m[2][3]
    ];
}

function multiplyMatrices(a, b) {
    const result = Array(4).fill().map(() => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    return result;
}

function getTransformedVertices() {
    return vertices.map(v => multiplyMatrixVector(transformMatrix, v));
}

// ==================== ПРЕОБРАЗОВАНИЯ ====================
function applyTranslation() {
    const tx = parseFloat(document.getElementById('translateX').value) || 0;
    const ty = parseFloat(document.getElementById('translateY').value) || 0;
    const tz = parseFloat(document.getElementById('translateZ').value) || 0;
    
    const translationMatrix = [
        [1, 0, 0, tx],
        [0, 1, 0, ty],
        [0, 0, 1, tz],
        [0, 0, 0, 1]
    ];
    
    transformMatrix = multiplyMatrices(translationMatrix, transformMatrix);
    redrawAll();
}

function applyScale() {
    const sx = parseFloat(document.getElementById('scaleX').value) || 1;
    const sy = parseFloat(document.getElementById('scaleY').value) || 1;
    const sz = parseFloat(document.getElementById('scaleZ').value) || 1;
    
    const scaleMatrix = [
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1]
    ];
    
    transformMatrix = multiplyMatrices(scaleMatrix, transformMatrix);
    redrawAll();
}

function applyRotation() {
    const rx = (parseFloat(document.getElementById('rotateX').value) || 0) * Math.PI / 180;
    const ry = (parseFloat(document.getElementById('rotateY').value) || 0) * Math.PI / 180;
    const rz = (parseFloat(document.getElementById('rotateZ').value) || 0) * Math.PI / 180;
    
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    
    const rotX = [[1,0,0,0],[0,cosX,-sinX,0],[0,sinX,cosX,0],[0,0,0,1]];
    const rotY = [[cosY,0,sinY,0],[0,1,0,0],[-sinY,0,cosY,0],[0,0,0,1]];
    const rotZ = [[cosZ,-sinZ,0,0],[sinZ,cosZ,0,0],[0,0,1,0],[0,0,0,1]];
    
    const rotationMatrix = multiplyMatrices(rotZ, multiplyMatrices(rotY, rotX));
    transformMatrix = multiplyMatrices(rotationMatrix, transformMatrix);
    redrawAll();
}

function resetAll() {
    transformMatrix = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
    
    document.getElementById('translateX').value = 0;
    document.getElementById('translateY').value = 0;
    document.getElementById('translateZ').value = 0;
    document.getElementById('scaleX').value = 1;
    document.getElementById('scaleY').value = 1;
    document.getElementById('scaleZ').value = 1;
    document.getElementById('rotateX').value = 0;
    document.getElementById('rotateY').value = 0;
    document.getElementById('rotateZ').value = 0;
    
    redrawAll();
}

// ==================== ОТРИСОВКА С ЦВЕТАМИ И РАЗМЫТИЕМ ====================
function projectPoint(v, width, height) {
    const fov = 400;
    const distance = 500;
    const factor = fov / (distance + v[2]);
    return {
        x: v[0] * factor + width / 2,
        y: -v[1] * factor + height / 2,
        z: v[2]
    };
}

function draw3DView() {
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Очистка с размытием
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Оси с размытием
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
    
    const transformed = getTransformedVertices();
    
    // Цвета для разных элементов буквы
    const barColors = [
        'rgba(52, 152, 219, 0.8)',    // синий - вертикаль
        'rgba(231, 76, 60, 0.8)',     // красный - верхняя левая
        'rgba(46, 204, 113, 0.8)',    // зелёный - верхняя правая
        'rgba(243, 156, 18, 0.8)',    // оранжевый - нижняя левая
        'rgba(155, 89, 182, 0.8)'     // фиолетовый - нижняя правая
    ];
    
    // Сортируем рёбра по глубине
    const sortedEdges = edges.map((edge, index) => {
        const p1 = projectPoint(transformed[edge[0]], width, height);
        const p2 = projectPoint(transformed[edge[1]], width, height);
        const avgZ = (p1.z + p2.z) / 2;
        const barIndex = Math.floor(index / 12); // 12 рёбер на брусок
        return { edge, avgZ, p1, p2, color: barColors[barIndex] };
    }).sort((a, b) => b.avgZ - a.avgZ);
    
    sortedEdges.forEach(({ edge: [i1, i2], p1, p2, color }) => {
        ctx.shadowColor = color.replace('0.8', '0.3');
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        
        // Сбрасываем тень
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    });
    
    // Центральная точка пересечения
    const center = projectPoint([0, 0, 0], width, height);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
    ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawProjections() {
    const transformed = getTransformedVertices();
    
    // Проекции с подписями на самих canvas
    const projections = [
        { id: 'oxyCanvas', plane: 'xy', label: 'Oxy' },
        { id: 'oxzCanvas', plane: 'xz', label: 'Oxz' },
        { id: 'oyzCanvas', plane: 'yz', label: 'Oyz' }
    ];
    
    projections.forEach(({id, plane, label}) => {
        const canvas = document.getElementById(id);
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, width, height);
        
        // Оси
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.stroke();
        
        // Подпись проекции (прямо на canvas)
        ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(label, 10, 10);
        
        // Рисуем проекцию с цветами
        edges.forEach(([i1, i2], index) => {
            const barIndex = Math.floor(index / 12);
            const colors = [
                'rgba(52, 152, 219, 0.7)',    // синий
                'rgba(231, 76, 60, 0.7)',     // красный
                'rgba(46, 204, 113, 0.7)',    // зелёный
                'rgba(243, 156, 18, 0.7)',    // оранжевый
                'rgba(155, 89, 182, 0.7)'     // фиолетовый
            ];
            
            ctx.strokeStyle = colors[barIndex] || colors[0];
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            const p1 = projectToPlane(transformed[i1], plane, width, height);
            const p2 = projectToPlane(transformed[i2], plane, width, height);
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        });
    });
}

function projectToPlane(v, plane, width, height) {
    const scale = 1.5;
    switch(plane) {
        case 'xy':
            return { x: v[0]*scale + width/2, y: -v[1]*scale + height/2 };
        case 'xz':
            return { x: v[0]*scale + width/2, y: -v[2]*scale + height/2 };
        case 'yz':
            return { x: v[1]*scale + width/2, y: -v[2]*scale + height/2 };
    }
}

function updateMatrixDisplay() {
    const matrixElement = document.getElementById('matrixDisplay');
    let text = '';
    for (let i = 0; i < 4; i++) {
        text += transformMatrix[i].map(v => v.toFixed(3).padStart(8)).join(' ') + '\n';
    }
    matrixElement.textContent = text;
}

function redrawAll() {
    draw3DView();
    drawProjections();
    updateMatrixDisplay();
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', () => {
    redrawAll();
    
    // Добавляем немного вращения для демонстрации 3D
    setTimeout(() => {
        document.getElementById('rotateY').value = 25;
        applyRotation();
    }, 500);
});