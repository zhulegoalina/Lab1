// Базовые растровые алгоритмы

// Пошаговый алгоритм
function stepAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== ПОШАГОВЫЙ АЛГОРИТМ ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        const k = dy / dx;
        calculations.push(`Угловой коэффициент k = ${k.toFixed(3)}`);
        
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        
        for (let x = startX; x <= endX; x++) {
            const y = y1 + k * (x - x1);
            const cellY = Math.round(y);
            pixels.push({x: x, y: cellY});
            calculations.push(`x=${x}, y=${y.toFixed(3)} → клетка (${x},${cellY})`);
        }
    } else {
        const k = dx / dy;
        calculations.push(`Угловой коэффициент k = ${k.toFixed(3)}`);
        
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);
        
        for (let y = startY; y <= endY; y++) {
            const x = x1 + k * (y - y1);
            const cellX = Math.round(x);
            pixels.push({x: cellX, y: y});
            calculations.push(`y=${y}, x=${x.toFixed(3)} → клетка (${cellX},${y})`);
        }
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм ЦДА
function ddaAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ ЦДА ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    calculations.push(`Δx = ${dx}, Δy = ${dy}`);
    calculations.push(`Количество шагов: ${steps}`);
    
    const xInc = dx / steps;
    const yInc = dy / steps;
    
    let x = x1;
    let y = y1;
    
    for (let i = 0; i <= steps; i++) {
        const cellX = Math.round(x);
        const cellY = Math.round(y);
        pixels.push({x: cellX, y: cellY});
        calculations.push(`Шаг ${i}: (${cellX},${cellY})`);
        
        x += xInc;
        y += yInc;
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм Брезенхема для линии
function bresenhamLine(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ БРЕЗЕНХЕМА (ЛИНИЯ) ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    let x = Math.round(x1);
    let y = Math.round(y1);
    const xEnd = Math.round(x2);
    const yEnd = Math.round(y2);
    
    const dx = Math.abs(xEnd - x);
    const dy = Math.abs(yEnd - y);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    calculations.push(`Δx = ${dx}, Δy = ${dy}`);
    calculations.push(`Начальная ошибка: ${err}`);
    
    pixels.push({x: x, y: y});
    calculations.push(`Начальная клетка: (${x},${y})`);
    
    let step = 1;
    while (!(x === xEnd && y === yEnd)) {
        const err2 = 2 * err;
        
        if (err2 > -dy) {
            err -= dy;
            x += sx;
            calculations.push(`Шаг ${step}: 2*err=${err2} > -Δy → x += ${sx}`);
        }
        
        if (err2 < dx) {
            err += dx;
            y += sy;
            calculations.push(`Шаг ${step}: 2*err=${err2} < Δx → y += ${sy}`);
        }
        
        pixels.push({x: x, y: y});
        calculations.push(`Клетка ${step}: (${x},${y}), ошибка=${err}`);
        step++;
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм Брезенхема для окружности
function bresenhamCircle(xc, yc, r) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ БРЕЗЕНХЕМА (ОКРУЖНОСТЬ) ===");
    calculations.push(`Центр: (${xc},${yc}), Радиус: ${r}`);
    
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;
    
    calculations.push(`Начальные значения: x=0, y=${r}`);
    calculations.push(`Начальное d = 3 - 2*${r} = ${d}`);
    
    const plotCirclePoints = (xc, yc, x, y) => {
        const points = [
            {x: xc + x, y: yc + y}, {x: xc - x, y: yc + y},
            {x: xc + x, y: yc - y}, {x: xc - x, y: yc - y},
            {x: xc + y, y: yc + x}, {x: xc - y, y: yc + x},
            {x: xc + y, y: yc - x}, {x: xc - y, y: yc - x}
        ];
        
        points.forEach(point => {
            if (!pixels.some(p => p.x === point.x && p.y === point.y)) {
                pixels.push(point);
            }
        });
    };
    
    plotCirclePoints(xc, yc, x, y);
    calculations.push(`Октат 1: добавлено 8 симметричных клеток`);
    
    let step = 1;
    while (y >= x) {
        x++;
        
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
            calculations.push(`Шаг ${step}: d>0 → x=${x}, y=${y}, d=${d}`);
        } else {
            d = d + 4 * x + 6;
            calculations.push(`Шаг ${step}: d≤0 → x=${x}, y=${y}, d=${d}`);
        }
        
        plotCirclePoints(xc, yc, x, y);
        calculations.push(`Шаг ${step}: добавлено 8 симметричных клеток`);
        step++;
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм Кастла-Питвея (отсечение отрезка)
function castelPitwayAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ КАСТЛА-ПИТВЕЯ ===");
    calculations.push(`Исходный отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    // Автоматическое определение окна вокруг отрезка
    const padding = 2;
    const xmin = Math.max(-5, Math.min(x1, x2) - padding);
    const ymin = Math.max(-5, Math.min(y1, y2) - padding);
    const xmax = Math.min(15, Math.max(x1, x2) + padding);
    const ymax = Math.min(15, Math.max(y1, y2) + padding);
    
    calculations.push(`Окно отсечения: x=[${xmin},${xmax}], y=[${ymin},${ymax}]`);
    
    function computeCode(x, y) {
        let code = 0;
        if (x < xmin) code |= 1;
        if (x > xmax) code |= 2;
        if (y < ymin) code |= 4;
        if (y > ymax) code |= 8;
        return code;
    }
    
    let code1 = computeCode(x1, y1);
    let code2 = computeCode(x2, y2);
    
    calculations.push(`Код точки P1: ${codeToString(code1)}`);
    calculations.push(`Код точки P2: ${codeToString(code2)}`);
    
    let accept = false;
    let clippedX1 = x1, clippedY1 = y1;
    let clippedX2 = x2, clippedY2 = y2;
    
    let iterations = 0;
    while (true) {
        iterations++;
        calculations.push(`\n--- Итерация ${iterations} ---`);
        
        if ((code1 | code2) === 0) {
            calculations.push("✓ Обе точки внутри окна - отрезок полностью видим");
            accept = true;
            break;
        } else if (code1 & code2) {
            calculations.push("✗ Обе точки с одной стороны окна - отрезок полностью невидим");
            break;
        } else {
            calculations.push("~ Отрезок пересекает границу - находим пересечение");
            
            let codeOut = code1 !== 0 ? code1 : code2;
            let x, y;
            
            if (codeOut & 8) {
                calculations.push("Пересечение с верхней границей");
                x = clippedX1 + (clippedX2 - clippedX1) * (ymax - clippedY1) / (clippedY2 - clippedY1);
                y = ymax;
            } else if (codeOut & 4) {
                calculations.push("Пересечение с нижней границей");
                x = clippedX1 + (clippedX2 - clippedX1) * (ymin - clippedY1) / (clippedY2 - clippedY1);
                y = ymin;
            } else if (codeOut & 2) {
                calculations.push("Пересечение с правой границей");
                y = clippedY1 + (clippedY2 - clippedY1) * (xmax - clippedX1) / (clippedX2 - clippedX1);
                x = xmax;
            } else if (codeOut & 1) {
                calculations.push("Пересечение с левой границей");
                y = clippedY1 + (clippedY2 - clippedY1) * (xmin - clippedX1) / (clippedX2 - clippedX1);
                x = xmin;
            }
            
            if (codeOut === code1) {
                calculations.push(`Обновляем P1: (${clippedX1},${clippedY1}) → (${x.toFixed(2)},${y.toFixed(2)})`);
                clippedX1 = x;
                clippedY1 = y;
                code1 = computeCode(clippedX1, clippedY1);
            } else {
                calculations.push(`Обновляем P2: (${clippedX2},${clippedY2}) → (${x.toFixed(2)},${y.toFixed(2)})`);
                clippedX2 = x;
                clippedY2 = y;
                code2 = computeCode(clippedX2, clippedY2);
            }
        }
        
        if (iterations > 4) break;
    }
    
    if (accept) {
        calculations.push(`\n✓ Видимая часть: (${clippedX1.toFixed(2)},${clippedY1.toFixed(2)}) - (${clippedX2.toFixed(2)},${clippedY2.toFixed(2)})`);
        
        const lineResult = bresenhamLine(
            Math.round(clippedX1), Math.round(clippedY1), 
            Math.round(clippedX2), Math.round(clippedY2)
        );
        pixels.push(...lineResult.pixels);
        
        pixels.originalLine = { x1: x1, y1: y1, x2: x2, y2: y2 };
        pixels.clippedLine = { x1: clippedX1, y1: clippedY1, x2: clippedX2, y2: clippedY2 };
        pixels.clippingWindow = { xmin, ymin, xmax, ymax };
    } else {
        pixels.originalLine = { x1: x1, y1: y1, x2: x2, y2: y2 };
        pixels.clippedLine = null;
        pixels.clippingWindow = { xmin, ymin, xmax, ymax };
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    return { pixels, calculations };
}

function codeToString(code) {
    const bits = [];
    if (code & 1) bits.push("LEFT");
    if (code & 2) bits.push("RIGHT");
    if (code & 4) bits.push("BOTTOM");
    if (code & 8) bits.push("TOP");
    return bits.length ? bits.join("|") : "INSIDE";
}

// Алгоритм сглаживания Ву
function antialiasingAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ СГЛАЖИВАНИЯ ВУ ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        const gradient = dy / dx;
        calculations.push(`Градиент = ${gradient.toFixed(3)}`);
        
        let xpxl1 = Math.round(x1);
        let yend = y1 + gradient * (xpxl1 - x1);
        let xgap = 1 - (x1 + 0.5 - Math.floor(x1 + 0.5));
        
        let ypxl1 = Math.floor(yend);
        
        pixels.push({x: xpxl1, y: ypxl1, intensity: (1 - (yend - ypxl1)) * xgap});
        pixels.push({x: xpxl1, y: ypxl1 + 1, intensity: (yend - ypxl1) * xgap});
        
        calculations.push(`Начальная точка: (${xpxl1},${ypxl1}) интенсивность=${((1 - (yend - ypxl1)) * xgap).toFixed(2)}`);
        calculations.push(`                 (${xpxl1},${ypxl1 + 1}) интенсивность=${((yend - ypxl1) * xgap).toFixed(2)}`);
        
        let intery = yend + gradient;
        
        let xpxl2 = Math.round(x2);
        let yend2 = y2 + gradient * (xpxl2 - x2);
        let xgap2 = (x2 + 0.5 - Math.floor(x2 + 0.5));
        
        let ypxl2 = Math.floor(yend2);
        
        pixels.push({x: xpxl2, y: ypxl2, intensity: (1 - (yend2 - ypxl2)) * xgap2});
        pixels.push({x: xpxl2, y: ypxl2 + 1, intensity: (yend2 - ypxl2) * xgap2});
        
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            const yfloor = Math.floor(intery);
            const intensity1 = 1 - (intery - yfloor);
            const intensity2 = intery - yfloor;
            
            pixels.push({x: x, y: yfloor, intensity: intensity1});
            pixels.push({x: x, y: yfloor + 1, intensity: intensity2});
            
            intery += gradient;
        }
    }
    
    calculations.push(`Итого клеток: ${pixels.length}`);
    calculations.push("Каждая позиция имеет два пикселя с разной интенсивностью");
    
    return { pixels, calculations };
}