class ImageProcessor {
    constructor() {
        this.originalImage = null;
        this.init();
    }

    init() {
        this.setupCanvases();
        this.setupEventListeners();
        this.loadMethod('histogram');
    }

    setupCanvases() {
        this.originalCanvas = document.getElementById('originalCanvas');
        this.processedCanvas = document.getElementById('processedCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.processedCtx = this.processedCanvas.getContext('2d');
        this.originalHistogram = null;
        this.processedHistogram = null;
    }

    setupEventListeners() {
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });

        document.querySelectorAll('.demo-grid img').forEach(img => {
            img.addEventListener('click', (e) => {
                this.loadDemoImage(e.target.dataset.src);
            });
        });

        document.getElementById('methodSelect').addEventListener('change', (e) => {
            this.loadMethod(e.target.value);
            this.process();
        });
    }

    loadImage(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayImage();
                this.process();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadDemoImage(src) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            this.originalImage = img;
            this.displayImage();
            this.process();
        };
        img.src = src + '?' + new Date().getTime();
    }

    displayImage() {
        if (!this.originalImage) return;
        
        const canvas = this.originalCanvas;
        const maxWidth = 450;
        const maxHeight = 350;
        
        let scale = Math.min(maxWidth / this.originalImage.width, maxHeight / this.originalImage.height);
        scale = Math.min(scale, 1);
        
        canvas.width = this.originalImage.width * scale;
        canvas.height = this.originalImage.height * scale;
        
        this.originalCtx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
        document.getElementById('originalInfo').textContent = 
            `Размер: ${this.originalImage.width}×${this.originalImage.height}`;
    }

    loadMethod(method) {
        const panel = document.getElementById('parametersPanel');
        let html = '';

        switch(method) {
            case 'histogram':
                html = `
                    <h4>Метод улучшения контраста</h4>
                    <div class="toggle-group">
                        <div class="toggle active" data-method="linear">Линейный</div>
                        <div class="toggle" data-method="equalize_hsv">Эквализация HSV</div>
                        <div class="toggle" data-method="equalize_rgb">Эквализация RGB</div>
                    </div>
                    <div class="param-group">
                        <label>Минимальная яркость: <span id="minValue">50</span></label>
                        <div class="slider">
                            <input type="range" id="minSlider" min="0" max="255" value="50">
                        </div>
                        <label>Максимальная яркость: <span id="maxValue">200</span></label>
                        <div class="slider">
                            <input type="range" id="maxSlider" min="0" max="255" value="200">
                        </div>
                    </div>
                `;
                break;

            case 'global':
                html = `
                    <h4>Метод бинаризации</h4>
                    <div class="radio-group">
                        <div class="radio">
                            <input type="radio" name="global" value="otsu" checked> Метод Оцу
                        </div>
                        <div class="radio">
                            <input type="radio" name="global" value="manual"> Ручной порог
                        </div>
                    </div>
                    <div class="param-group">
                        <label>Пороговое значение: <span id="thresholdValue">128</span></label>
                        <div class="slider">
                            <input type="range" id="thresholdSlider" min="0" max="255" value="128">
                        </div>
                    </div>
                `;
                break;

            case 'adaptive':
                html = `
                    <h4>Параметры адаптивной обработки</h4>
                    <div class="param-group">
                        <label>Размер окна K: <span id="windowValue">2</span></label>
                        <div class="slider">
                            <input type="range" id="windowSlider" min="1" max="5" value="2">
                        </div>
                        <label>Коэффициент α: <span id="alphaValue">0.67</span></label>
                        <div class="slider">
                            <input type="range" id="alphaSlider" min="0.3" max="0.8" step="0.01" value="0.67">
                        </div>
                        <label>Максимальный K: <span id="maxKValue">5</span></label>
                        <div class="slider">
                            <input type="range" id="maxKSlider" min="3" max="10" value="5">
                        </div>
                    </div>
                `;
                break;

            case 'morphology':
                html = `
                    <h4>Морфологическая операция</h4>
                    <select id="morphOp">
                        <option value="erode">Эрозия</option>
                        <option value="dilate">Дилатация</option>
                        <option value="open">Открытие</option>
                        <option value="close">Закрытие</option>
                    </select>
                    <div class="param-group">
                        <h4>Структурный элемент</h4>
                        <div class="radio-group">
                            <div class="radio">
                                <input type="radio" name="kernelShape" value="rect" checked> Прямоугольник
                            </div>
                            <div class="radio">
                                <input type="radio" name="kernelShape" value="ellipse"> Эллипс
                            </div>
                            <div class="radio">
                                <input type="radio" name="kernelShape" value="cross"> Крест
                            </div>
                        </div>
                        <label>Размер ядра: <span id="kernelValue">3</span></label>
                        <div class="slider">
                            <input type="range" id="kernelSlider" min="3" max="15" step="2" value="3">
                        </div>
                        <label>Порог бинаризации: <span id="morphThresholdValue">128</span></label>
                        <div class="slider">
                            <input type="range" id="morphThresholdSlider" min="0" max="255" value="128">
                        </div>
                    </div>
                `;
                break;
        }

        panel.innerHTML = html;
        this.setupParameterListeners();
    }

    setupParameterListeners() {
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const valueSpan = document.getElementById(e.target.id.replace('Slider', 'Value'));
                if (valueSpan) valueSpan.textContent = e.target.value;
                this.process();
            });
        });

        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.process();
            });
        });

        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', this.process.bind(this));
        });

        const morphOp = document.getElementById('morphOp');
        if (morphOp) {
            morphOp.addEventListener('change', this.process.bind(this));
        }
    }

    process() {
        if (!this.originalImage) return;

        const method = document.getElementById('methodSelect').value;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.originalCanvas.width;
        canvas.height = this.originalCanvas.height;
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        switch(method) {
            case 'histogram':
                this.processHistogram(imageData);
                break;
            case 'global':
                this.processGlobalThreshold(imageData);
                break;
            case 'adaptive':
                this.processAdaptiveThreshold(imageData);
                break;
            case 'morphology':
                this.processMorphology(imageData);
                break;
        }

        this.displayResult(imageData);
        this.updateHistograms();
        this.updateExplanation();
    }

    processHistogram(imageData) {
        const data = imageData.data;
        const activeToggle = document.querySelector('.toggle.active');
        const method = activeToggle ? activeToggle.dataset.method : 'linear';

        if (method === 'linear') {
            const min = parseInt(document.getElementById('minSlider').value);
            const max = parseInt(document.getElementById('maxSlider').value);
            const range = max - min;
            
            if (range <= 0) return;
            
            for (let i = 0; i < data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                    let value = data[i + j];
                    value = ((value - min) / range) * 255;
                    data[i + j] = Math.max(0, Math.min(255, Math.round(value)));
                }
            }
        } else if (method === 'equalize_hsv') {
            this.equalizeHSV(imageData);
        } else {
            this.equalizeRGB(imageData);
        }
    }

    equalizeHSV(imageData) {
        const data = imageData.data;
        const brightness = [];
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
            brightness.push(gray);
        }

        const histogram = new Array(256).fill(0);
        brightness.forEach(val => histogram[val]++);
        
        const cdf = new Array(256);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
            cdf[i] = cdf[i-1] + histogram[i];
        }
        
        const cdfMin = cdf.find(val => val > 0);
        const total = brightness.length;
        
        let idx = 0;
        for (let i = 0; i < data.length; i += 4) {
            const gray = brightness[idx++];
            const equalized = Math.round((cdf[gray] - cdfMin) * 255 / (total - cdfMin));
            
            const ratio = equalized / (gray || 1);
            data[i] = Math.min(255, data[i] * ratio);
            data[i+1] = Math.min(255, data[i+1] * ratio);
            data[i+2] = Math.min(255, data[i+2] * ratio);
        }
    }

    equalizeRGB(imageData) {
        const data = imageData.data;
        
        for (let channel = 0; channel < 3; channel++) {
            const histogram = new Array(256).fill(0);
            
            for (let i = channel; i < data.length; i += 4) {
                histogram[data[i]]++;
            }
            
            const cdf = new Array(256);
            cdf[0] = histogram[0];
            for (let i = 1; i < 256; i++) {
                cdf[i] = cdf[i-1] + histogram[i];
            }
            
            const cdfMin = cdf.find(val => val > 0);
            const total = data.length / 4;
            
            for (let i = channel; i < data.length; i += 4) {
                data[i] = Math.round((cdf[data[i]] - cdfMin) * 255 / (total - cdfMin));
            }
        }
    }

    processGlobalThreshold(imageData) {
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(data.length / 4);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            grayData[j] = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        }

        const method = document.querySelector('input[name="global"]:checked').value;
        let threshold;

        if (method === 'manual') {
            threshold = parseInt(document.getElementById('thresholdSlider').value);
        } else {
            threshold = this.calculateOtsu(grayData);
        }

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const value = grayData[j] > threshold ? 255 : 0;
            data[i] = data[i+1] = data[i+2] = value;
        }

        document.getElementById('processedInfo').textContent = `Порог: ${threshold}`;
    }

    calculateOtsu(grayData) {
        const histogram = new Array(256).fill(0);
        grayData.forEach(val => histogram[val]++);

        const total = grayData.length;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];

        let sumB = 0, wB = 0, wF = 0, maxVariance = 0, threshold = 0;

        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;

            sumB += i * histogram[i];
            let mB = sumB / wB;
            let mF = (sum - sumB) / wF;
            let variance = wB * wF * (mB - mF) * (mB - mF);
            
            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = i;
            }
        }

        return threshold;
    }

    processAdaptiveThreshold(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const K = parseInt(document.getElementById('windowSlider').value);
        const alpha = parseFloat(document.getElementById('alphaSlider').value);
        const maxK = parseInt(document.getElementById('maxKSlider').value);

        const grayData = new Float32Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            grayData[j] = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]) / 255.0;
        }

        const binaryOutput = new Uint8ClampedArray(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let k_current = K;
                let t = 0;
                let P_hat = 0;

                while (k_current <= maxK) {
                    const y_min = Math.max(0, y - k_current);
                    const y_max = Math.min(height, y + k_current + 1);
                    const x_min = Math.max(0, x - k_current);
                    const x_max = Math.min(width, x + k_current + 1);

                    const window = [];
                    for (let wy = y_min; wy < y_max; wy++) {
                        for (let wx = x_min; wx < x_max; wx++) {
                            window.push(grayData[wy * width + wx]);
                        }
                    }

                    if (window.length === 0) break;

                    const f_max = Math.max(...window);
                    const f_min = Math.min(...window);
                    P_hat = window.reduce((sum, val) => sum + val, 0) / window.length;

                    const delta_f_max = Math.abs(f_max - P_hat);
                    const delta_f_min = Math.abs(f_min - P_hat);

                    if (f_max === f_min) {
                        t = alpha * P_hat;
                        break;
                    }

                    if (delta_f_max > delta_f_min) {
                        t = alpha * ((2/3) * f_min + (1/3) * P_hat);
                        break;
                    } else if (delta_f_max < delta_f_min) {
                        t = alpha * ((1/3) * f_min + (2/3) * P_hat);
                        break;
                    } else {
                        k_current += 1;
                    }
                }

                const currentVal = grayData[y * width + x];
                binaryOutput[y * width + x] = Math.abs(P_hat - currentVal) > t ? 1 : 0;
            }
        }

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const value = binaryOutput[j] * 255;
            data[i] = data[i+1] = data[i+2] = value;
        }
    }

    processMorphology(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const threshold = parseInt(document.getElementById('morphThresholdSlider').value);
        const binaryData = new Uint8ClampedArray(width * height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
            binaryData[j] = gray > threshold ? 1 : 0;
        }

        const operation = document.getElementById('morphOp').value;
        const kernelShape = document.querySelector('input[name="kernelShape"]:checked').value;
        const kernelSize = parseInt(document.getElementById('kernelSlider').value);
        
        const kernel = this.createKernel(kernelShape, kernelSize);
        const result = this.applyMorphologicalOperation(binaryData, width, height, operation, kernel);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const value = result[j] * 255;
            data[i] = data[i+1] = data[i+2] = value;
        }
    }

    createKernel(shape, size) {
        const kernel = [];
        const radius = Math.floor(size / 2);
        
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                let include = false;
                
                if (shape === 'rect') {
                    include = true;
                } else if (shape === 'ellipse') {
                    include = (i * i + j * j) <= radius * radius;
                } else if (shape === 'cross') {
                    include = i === 0 || j === 0;
                }
                
                if (include) {
                    kernel.push({i, j});
                }
            }
        }
        
        return kernel;
    }

    applyMorphologicalOperation(data, width, height, operation, kernel) {
        let result = new Uint8ClampedArray(data.length);
        
        switch(operation) {
            case 'erode':
                result = this.erode(data, width, height, kernel);
                break;
            case 'dilate':
                result = this.dilate(data, width, height, kernel);
                break;
            case 'open':
                result = this.erode(data, width, height, kernel);
                result = this.dilate(result, width, height, kernel);
                break;
            case 'close':
                result = this.dilate(data, width, height, kernel);
                result = this.erode(result, width, height, kernel);
                break;
            default:
                result = data.slice();
        }
        
        return result;
    }

    erode(data, width, height, kernel) {
        const result = new Uint8ClampedArray(data.length);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let minVal = 1;
                
                for (const {i, j} of kernel) {
                    const ny = y + i;
                    const nx = x + j;
                    
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        minVal = Math.min(minVal, data[ny * width + nx]);
                    }
                }
                
                result[y * width + x] = minVal;
            }
        }
        
        return result;
    }

    dilate(data, width, height, kernel) {
        const result = new Uint8ClampedArray(data.length);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let maxVal = 0;
                
                for (const {i, j} of kernel) {
                    const ny = y + i;
                    const nx = x + j;
                    
                    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                        maxVal = Math.max(maxVal, data[ny * width + nx]);
                    }
                }
                
                result[y * width + x] = maxVal;
            }
        }
        
        return result;
    }

    displayResult(imageData) {
        this.processedCanvas.width = imageData.width;
        this.processedCanvas.height = imageData.height;
        this.processedCtx.putImageData(imageData, 0, 0);
    }

    updateHistograms() {
        this.updateHistogram('original', this.originalCanvas);
        this.updateHistogram('processed', this.processedCanvas);
    }

    updateHistogram(type, canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
            histogram[gray]++;
        }

        const chartId = type + 'Histogram';
        const chartCanvas = document.getElementById(chartId);
        
        if (type === 'original' && this.originalHistogram) {
            this.originalHistogram.destroy();
        } else if (type === 'processed' && this.processedHistogram) {
            this.processedHistogram.destroy();
        }

        const chart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: Array.from({length: 256}, (_, i) => i),
                datasets: [{
                    data: histogram,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { display: false }, y: { display: true } },
                plugins: { legend: { display: false } }
            }
        });

        if (type === 'original') {
            this.originalHistogram = chart;
        } else {
            this.processedHistogram = chart;
        }
    }

    updateExplanation() {
        const method = document.getElementById('methodSelect').value;
        let text = '';

        switch(method) {
            case 'histogram':
                text = `
                    <div class="method-desc">
                        <h4>📊 Анализ и улучшение гистограмм</h4>
                        <p><strong>Линейное контрастирование:</strong> Растягивание исходного диапазона яркостей на весь доступный диапазон [0, 255].</p>
                        <p><strong>Эквализация в HSV:</strong> Выравнивание гистограммы только компоненты яркости с сохранением цветового тона.</p>
                        <p><strong>Эквализация в RGB:</strong> Независимое выравнивание гистограмм для каждого цветового канала.</p>
                    </div>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Метод</th>
                                <th>Преимущества</th>
                                <th>Недостатки</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Линейное контрастирование</strong></td>
                                <td>Простота, сохранение относительной яркости</td>
                                <td>Может обрезать экстремальные значения</td>
                            </tr>
                            <tr>
                                <td><strong>Эквализация HSV</strong></td>
                                <td>Сохранение цветов, естественный результат</td>
                                <td>Сложнее вычислений</td>
                            </tr>
                            <tr>
                                <td><strong>Эквализация RGB</strong></td>
                                <td>Максимальное использование динамического диапазона</td>
                                <td>Может искажать цвета</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;

            case 'global':
                text = `
                    <div class="method-desc">
                        <h4>Глобальная пороговая обработка</h4>
                        <p><strong>Метод Оцу:</strong> Автоматически вычисляет оптимальный порог, максимизируя межклассовую дисперсию между фоном и объектами.</p>
                        <p><strong>Ручная установка порога:</strong> Позволяет точно настроить пороговое значение на основе визуальной оценки.</p>
                    </div>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Метод</th>
                                <th>Лучшие результаты</th>
                                <th>Ограничения</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Метод Оцу</strong></td>
                                <td>Изображения с бимодальной гистограммой, сканированные документы</td>
                                <td>Не работает при неравномерном освещении</td>
                            </tr>
                            <tr>
                                <td><strong>Ручной порог</strong></td>
                                <td>Когда известны характеристики изображения</td>
                                <td>Требует вмешательства пользователя</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;

            case 'adaptive':
                text = `
                    <div class="method-desc">
                        <h4>Адаптивная пороговая обработка</h4>
                        <p>Алгоритм вычисляет порог для каждого пикселя на основе локальной области вокруг него.</p>
                        <p><strong>Формула из лекции:</strong> f'(m,n) = 1, если |P_hat - f(m,n)| > t, иначе 0</p>
                        <p><strong>Преимущества:</strong> Работает с изображениями с неравномерным освещением, тенями, сложным текстурным фоном.</p>
                        <p><strong>Применение:</strong> Текст на текстурированном фоне, медицинские изображения, изображения с градиентами яркости.</p>
                    </div>
                `;
                break;

            case 'morphology':
                text = `
                    <div class="method-desc">
                        <h4>Морфологическая обработка</h4>
                        <p><strong>Эрозия:</strong> Уменьшает области переднего плана, убирает мелкие объекты и шум.</p>
                        <p><strong>Дилатация:</strong> Увеличивает области переднего плана, заполняет отверстия и пробелы.</p>
                        <p><strong>Открытие:</strong> Эрозия + дилатация - убирает шум, сохраняя основные объекты.</p>
                        <p><strong>Закрытие:</strong> Дилатация + эрозия - заполняет пробелы, сохраняя основные объекты.</p>
                    </div>
                `;
                break;
        }

        document.getElementById('explanationText').innerHTML = text;
    }
}

const processor = new ImageProcessor();