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
        // Более пологий отрезок
        const k = dy / dx;
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        
        calculations.push(`Угловой коэффициент k = Δy/Δx = ${dy}/${dx} = ${k.toFixed(3)}`);
        
        for (let x = startX; x <= endX; x++) {
            const y = y1 + k * (x - x1);
            const roundedY = Math.round(y);
            pixels.push({x: x, y: roundedY});
            calculations.push(`x=${x}, y = ${y1} + ${k.toFixed(3)}*(${x}-${x1}) = ${y.toFixed(3)} → (${x},${roundedY})`);
        }
    } else {
        // Более крутой отрезок
        const k = dx / dy;
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);
        
        calculations.push(`Угловой коэффициент k = Δx/Δy = ${dx}/${dy} = ${k.toFixed(3)}`);
        
        for (let y = startY; y <= endY; y++) {
            const x = x1 + k * (y - y1);
            const roundedX = Math.round(x);
            pixels.push({x: roundedX, y: y});
            calculations.push(`y=${y}, x = ${x1} + ${k.toFixed(3)}*(${y}-${y1}) = ${x.toFixed(3)} → (${roundedX},${y})`);
        }
    }
    
    calculations.push(`Итого точек: ${pixels.length}`);
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
    calculations.push(`Количество шагов: max(|${dx}|, |${dy}|) = ${steps}`);
    
    const xInc = dx / steps;
    const yInc = dy / steps;
    
    calculations.push(`Приращение X: ${xInc.toFixed(3)}`);
    calculations.push(`Приращение Y: ${yInc.toFixed(3)}`);
    
    let x = x1;
    let y = y1;
    
    for (let i = 0; i <= steps; i++) {
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);
        pixels.push({x: roundedX, y: roundedY});
        calculations.push(`Шаг ${i}: x=${x.toFixed(3)}, y=${y.toFixed(3)} → (${roundedX},${roundedY})`);
        
        x += xInc;
        y += yInc;
    }
    
    calculations.push(`Итого точек: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм Брезенхема для линии
function bresenhamLine(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ БРЕЗЕНХЕМА (ЛИНИЯ) ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    let x = x1;
    let y = y1;
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    calculations.push(`Δx = ${dx}, Δy = ${dy}`);
    calculations.push(`Направление: sx=${sx}, sy=${sy}`);
    calculations.push(`Начальная ошибка: err = dx - dy = ${err}`);
    
    pixels.push({x: x, y: y});
    calculations.push(`Начальная точка: (${x},${y}), err=${err}`);
    
    let step = 1;
    while (!(x === x2 && y === y2)) {
        const err2 = 2 * err;
        
        if (err2 > -dy) {
            err -= dy;
            x += sx;
            calculations.push(`Шаг ${step}: 2*err=${err2} > -Δy=${-dy} → x += ${sx}`);
        }
        
        if (err2 < dx) {
            err += dx;
            y += sy;
            calculations.push(`Шаг ${step}: 2*err=${err2} < Δx=${dx} → y += ${sy}`);
        }
        
        pixels.push({x: x, y: y});
        calculations.push(`Точка ${step}: (${x},${y}), err=${err}`);
        step++;
    }
    
    calculations.push(`Итого точек: ${pixels.length}`);
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
    
    // Функция добавления точек по симметрии
    const plotCirclePoints = (xc, yc, x, y) => {
        const points = [
            {x: xc + x, y: yc + y},
            {x: xc - x, y: yc + y},
            {x: xc + x, y: yc - y},
            {x: xc - x, y: yc - y},
            {x: xc + y, y: yc + x},
            {x: xc - y, y: yc + x},
            {x: xc + y, y: yc - x},
            {x: xc - y, y: yc - x}
        ];
        
        points.forEach(point => {
            if (!pixels.some(p => p.x === point.x && p.y === point.y)) {
                pixels.push(point);
            }
        });
    };
    
    plotCirclePoints(xc, yc, x, y);
    calculations.push(`Октат 1: добавлено 8 симметричных точек`);
    
    let step = 1;
    while (y >= x) {
        x++;
        
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
            calculations.push(`Шаг ${step}: d=${d} > 0 → x=${x}, y=${y}, d=d+4(x-y)+10=${d}`);
        } else {
            d = d + 4 * x + 6;
            calculations.push(`Шаг ${step}: d=${d} ≤ 0 → x=${x}, y=${y}, d=d+4x+6=${d}`);
        }
        
        plotCirclePoints(xc, yc, x, y);
        calculations.push(`Шаг ${step}: добавлено 8 симметричных точек`);
        step++;
    }
    
    calculations.push(`Итого точек: ${pixels.length}`);
    return { pixels, calculations };
}

// Алгоритм Кастла-Питвея
function castelPitwayAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ КАСТЛА-ПИТВЕЯ ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    // Границы окна
    const xmin = -5, ymin = -5, xmax = 15, ymax = 15;
    
    calculations.push(`Окно отсечения: x=[${xmin},${xmax}], y=[${ymin},${ymax}]`);
    
    let code1 = computeCode(x1, y1, xmin, ymin, xmax, ymax);
    let code2 = computeCode(x2, y2, xmin, ymin, xmax, ymax);
    
    calculations.push(`Код точки P1: ${codeToString(code1)}`);
    calculations.push(`Код точки P2: ${codeToString(code2)}`);
    
    let accept = false;
    
    while (true) {
        if ((code1 | code2) === 0) {
            calculations.push("Обе точки внутри окна - отрезок полностью видим");
            accept = true;
            break;
        } else if (code1 & code2) {
            calculations.push("Обе точки с одной стороны окна - отрезок невидим");
            break;
        } else {
            let codeOut = code1 !== 0 ? code1 : code2;
            let x, y;
            
            if (codeOut & 8) {
                calculations.push("Пересечение с верхней границей");
                x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
                y = ymax;
            } else if (codeOut & 4) {
                calculations.push("Пересечение с нижней границей");
                x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
                y = ymin;
            } else if (codeOut & 2) {
                calculations.push("Пересечение с правой границей");
                y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
                x = xmax;
            } else {
                calculations.push("Пересечение с левой границей");
                y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                x = xmin;
            }
            
            if (codeOut === code1) {
                calculations.push(`Обновляем P1: (${x1},${y1}) → (${x.toFixed(1)},${y.toFixed(1)})`);
                x1 = x;
                y1 = y;
                code1 = computeCode(x1, y1, xmin, ymin, xmax, ymax);
            } else {
                calculations.push(`Обновляем P2: (${x2},${y2}) → (${x.toFixed(1)},${y.toFixed(1)})`);
                x2 = x;
                y2 = y;
                code2 = computeCode(x2, y2, xmin, ymin, xmax, ymax);
            }
        }
    }
    
    if (accept) {
        const lineResult = bresenhamLine(Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2));
        pixels.push(...lineResult.pixels);
        calculations.push(...lineResult.calculations);
    }
    
    return { pixels, calculations };
}

function computeCode(x, y, xmin, ymin, xmax, ymax) {
    let code = 0;
    if (x < xmin) code |= 1;
    if (x > xmax) code |= 2;
    if (y < ymin) code |= 4;
    if (y > ymax) code |= 8;
    return code;
}

function codeToString(code) {
    const bits = [];
    if (code & 1) bits.push("LEFT");
    if (code & 2) bits.push("RIGHT");
    if (code & 4) bits.push("BOTTOM");
    if (code & 8) bits.push("TOP");
    return bits.length ? bits.join("|") : "INSIDE";
}

// Алгоритм сглаживания
function antialiasingAlgorithm(x1, y1, x2, y2) {
    const pixels = [];
    const calculations = [];
    
    calculations.push("=== АЛГОРИТМ СГЛАЖИВАНИЯ ===");
    calculations.push(`Отрезок: (${x1},${y1}) - (${x2},${y2})`);
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    calculations.push(`Δx = ${dx}, Δy = ${dy}`);
    
    if (Math.abs(dx) > Math.abs(dy)) {
        const gradient = dy / dx;
        let xend = Math.round(x1);
        let yend = y1 + gradient * (xend - x1);
        let xgap = 1 - (x1 + 0.5 - Math.floor(x1 + 0.5));
        
        let xpxl1 = xend;
        let ypxl1 = Math.floor(yend);
        
        pixels.push({x: xpxl1, y: ypxl1, intensity: (1 - (yend - Math.floor(yend))) * xgap});
        pixels.push({x: xpxl1, y: ypxl1 + 1, intensity: (yend - Math.floor(yend)) * xgap});
        
        calculations.push(`Начальная точка: (${xpxl1},${ypxl1}) интенсивность=${((1 - (yend - Math.floor(yend))) * xgap).toFixed(2)}`);
        
        let intery = yend + gradient;
        
        xend = Math.round(x2);
        yend = y2 + gradient * (xend - x2);
        xgap = (x2 + 0.5 - Math.floor(x2 + 0.5));
        
        let xpxl2 = xend;
        let ypxl2 = Math.floor(yend);
        
        pixels.push({x: xpxl2, y: ypxl2, intensity: (1 - (yend - Math.floor(yend))) * xgap});
        pixels.push({x: xpxl2, y: ypxl2 + 1, intensity: (yend - Math.floor(yend)) * xgap});
        
        calculations.push(`Конечная точка: (${xpxl2},${ypxl2}) интенсивность=${((1 - (yend - Math.floor(yend))) * xgap).toFixed(2)}`);
        
        for (let x = xpxl1 + 1; x < xpxl2; x++) {
            pixels.push({x: x, y: Math.floor(intery), intensity: 1 - (intery - Math.floor(intery))});
            pixels.push({x: x, y: Math.floor(intery) + 1, intensity: intery - Math.floor(intery)});
            
            calculations.push(`Точка: (${x},${Math.floor(intery)}) интенсивность=${(1 - (intery - Math.floor(intery))).toFixed(2)}`);
            
            intery += gradient;
        }
    }
    
    calculations.push(`Итого точек: ${pixels.length}`);
    return { pixels, calculations };
}