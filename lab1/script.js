class ColorConverter {
    static rgbToCmyk(r, g, b) {
        if (r === 0 && g === 0 && b === 0) {
            return { c: 0, m: 0, y: 0, k: 100 };
        }
        
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;
        
        const k = 1 - Math.max(rNorm, gNorm, bNorm);
        const c = (1 - rNorm - k) / (1 - k);
        const m = (1 - gNorm - k) / (1 - k);
        const y = (1 - bNorm - k) / (1 - k);
        
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    static cmykToRgb(c, m, y, k) {
        const cNorm = c / 100;
        const mNorm = m / 100;
        const yNorm = y / 100;
        const kNorm = k / 100;
        
        const r = 255 * (1 - cNorm) * (1 - kNorm);
        const g = 255 * (1 - mNorm) * (1 - kNorm);
        const b = 255 * (1 - yNorm) * (1 - kNorm);
        
        return {
            r: Math.max(0, Math.min(255, Math.round(r))),
            g: Math.max(0, Math.min(255, Math.round(g))),
            b: Math.max(0, Math.min(255, Math.round(b)))
        };
    }

    static rgbToHls(r, g, b) {
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;
        
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            if (max === rNorm) {
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
            } else if (max === gNorm) {
                h = (bNorm - rNorm) / d + 2;
            } else {
                h = (rNorm - gNorm) / d + 4;
            }
            
            h /= 6;
        }
        
        return { 
            h: Math.round(h * 360), 
            l: Math.round(l * 100), 
            s: Math.round(s * 100) 
        };
    }

    static hlsToRgb(h, l, s) {
        const hNorm = h / 360;
        const lNorm = l / 100;
        const sNorm = s / 100;
        
        let r, g, b;
        
        if (sNorm === 0) {
            r = g = b = lNorm;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
            const p = 2 * lNorm - q;
            
            r = hue2rgb(p, q, hNorm + 1/3);
            g = hue2rgb(p, q, hNorm);
            b = hue2rgb(p, q, hNorm - 1/3);
        }
        
        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b * 255)))
        };
    }
}

class App {
    constructor() {
        this.color = { r: 255, g: 255, b: 255 };
        this.updating = false;
        this.init();
    }

    init() {
        this.setupComponent('r', ['R', 'G', 'B'], this.fromRGB.bind(this));
        
        this.setupComponent('c', ['C', 'M', 'Y', 'K'], this.fromCMYK.bind(this));
        
        this.setupComponent('h', ['H', 'L', 'S'], this.fromHLS.bind(this));
        
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            const hex = e.target.value;
            this.color = {
                r: parseInt(hex.substr(1, 2), 16),
                g: parseInt(hex.substr(3, 2), 16),
                b: parseInt(hex.substr(5, 2), 16)
            };
            this.updateAll();
        });
        
        document.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.getAttribute('data-color');
                this.color = {
                    r: parseInt(color.substr(1, 2), 16),
                    g: parseInt(color.substr(3, 2), 16),
                    b: parseInt(color.substr(5, 2), 16)
                };
                this.updateAll();
            });
        });
        
        this.updateAll();
    }
    
    setupComponent(prefix, components, callback) {
        components.forEach(comp => {
            const slider = document.getElementById(prefix + comp);
            const input = document.getElementById(prefix + comp + 'v');
            const warning = document.getElementById(comp.toLowerCase() + 'Warning');
            
            const update = () => {
                if (this.updating) return;
                
                let value = parseInt(input.value);
                if (isNaN(value)) {
                    warning.style.display = 'block';
                    return;
                }
                
                const min = parseInt(input.min);
                const max = parseInt(input.max);
                
                if (value < min || value > max) {
                    warning.style.display = 'block';
                    value = Math.max(min, Math.min(max, value));
                    input.value = value;
                } else {
                    warning.style.display = 'none';
                }
                
                slider.value = value;
                callback();
            };
            
            slider.addEventListener('input', () => {
                input.value = slider.value;
                document.getElementById(comp.toLowerCase() + 'Warning').style.display = 'none';
                callback();
            });
            
            input.addEventListener('input', update);
            input.addEventListener('change', update);
            input.addEventListener('blur', update);
        });
    }

    updateAll() {
        this.updating = true;
        
        document.getElementById('rR').value = document.getElementById('rRv').value = this.color.r;
        document.getElementById('rG').value = document.getElementById('rGv').value = this.color.g;
        document.getElementById('rB').value = document.getElementById('rBv').value = this.color.b;
        
        const cmyk = ColorConverter.rgbToCmyk(this.color.r, this.color.g, this.color.b);
        document.getElementById('cC').value = document.getElementById('cCv').value = cmyk.c;
        document.getElementById('cM').value = document.getElementById('cMv').value = cmyk.m;
        document.getElementById('cY').value = document.getElementById('cYv').value = cmyk.y;
        document.getElementById('cK').value = document.getElementById('cKv').value = cmyk.k;
        
        const hls = ColorConverter.rgbToHls(this.color.r, this.color.g, this.color.b);
        document.getElementById('hH').value = document.getElementById('hHv').value = hls.h;
        document.getElementById('hL').value = document.getElementById('hLv').value = hls.l;
        document.getElementById('hS').value = document.getElementById('hSv').value = hls.s;
        
        const hex = `#${this.color.r.toString(16).padStart(2, '0')}${this.color.g.toString(16).padStart(2, '0')}${this.color.b.toString(16).padStart(2, '0')}`;
        document.getElementById('colorPreview').style.backgroundColor = hex;
        document.getElementById('colorHex').textContent = hex.toUpperCase();
        document.getElementById('colorPicker').value = hex;
        
        document.querySelectorAll('.warning').forEach(w => w.style.display = 'none');
        
        this.updating = false;
    }

    fromRGB() {
        this.color = {
            r: parseInt(document.getElementById('rRv').value),
            g: parseInt(document.getElementById('rGv').value),
            b: parseInt(document.getElementById('rBv').value)
        };
        this.updateAll();
    }

    fromCMYK() {
        this.color = ColorConverter.cmykToRgb(
            parseInt(document.getElementById('cCv').value),
            parseInt(document.getElementById('cMv').value),
            parseInt(document.getElementById('cYv').value),
            parseInt(document.getElementById('cKv').value)
        );
        this.updateAll();
    }

    fromHLS() {
        this.color = ColorConverter.hlsToRgb(
            parseInt(document.getElementById('hHv').value),
            parseInt(document.getElementById('hLv').value),
            parseInt(document.getElementById('hSv').value)
        );
        this.updateAll();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
