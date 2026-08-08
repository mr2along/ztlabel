// Canvas Manager
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.objects = [];
        this.selectedObject = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.currentColor = '#000000';
        this.currentFontSize = 12;
        this.currentStrokeWidth = 2;
        this.currentOpacity = 1;
        
        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.isDrawing = true;

        if (this.currentTool === 'select') {
            this.selectObject(pos);
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.currentTool === 'select' && this.selectedObject && this.isDrawing) {
            const dx = pos.x - this.startX;
            const dy = pos.y - this.startY;
            this.selectedObject.x += dx;
            this.selectedObject.y += dy;
            this.startX = pos.x;
            this.startY = pos.y;
            this.draw();
        }
    }

    handleMouseUp(e) {
        this.isDrawing = false;
    }

    handleClick(e) {
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'text') {
            const text = prompt('Nhập văn bản:');
            if (text) {
                this.addText(pos.x, pos.y, text);
            }
        } else if (this.currentTool === 'image') {
            document.getElementById('imageInput').click();
            this.lastClickPos = pos;
        } else if (this.currentTool === 'rect') {
            this.addRect(pos.x, pos.y);
        }
    }

    selectObject(pos) {
        this.selectedObject = null;
        for (let i = this.objects.length - 1; i >= 0; i--) {
            if (this.objects[i].contains(pos.x, pos.y)) {
                this.selectedObject = this.objects[i];
                break;
            }
        }
        this.draw();
    }

    addText(x, y, text) {
        const obj = {
            type: 'text',
            x: x,
            y: y,
            text: text,
            fontSize: this.currentFontSize,
            color: this.currentColor,
            opacity: this.currentOpacity,
            contains: function(px, py) {
                const w = this.text.length * this.fontSize * 0.6;
                const h = this.fontSize;
                return px >= this.x && px <= this.x + w && py >= this.y - h && py <= this.y;
            }
        };
        this.objects.push(obj);
        this.selectedObject = obj;
        this.draw();
    }

    addImage(x, y, imgData) {
        const obj = {
            type: 'image',
            x: x,
            y: y,
            width: 80,
            height: 80,
            imgData: imgData,
            opacity: this.currentOpacity,
            contains: function(px, py) {
                return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
            }
        };
        this.objects.push(obj);
        this.selectedObject = obj;
        this.draw();
    }

    addRect(x, y) {
        const obj = {
            type: 'rect',
            x: x,
            y: y,
            width: 60,
            height: 40,
            color: this.currentColor,
            strokeWidth: this.currentStrokeWidth,
            opacity: this.currentOpacity,
            contains: function(px, py) {
                return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
            }
        };
        this.objects.push(obj);
        this.selectedObject = obj;
        this.draw();
    }

    addQR(x, y, data) {
        const obj = {
            type: 'qr',
            x: x,
            y: y,
            size: 80,
            data: data,
            opacity: this.currentOpacity,
            contains: function(px, py) {
                return px >= this.x && px <= this.x + this.size && py >= this.y && py <= this.y + this.size;
            }
        };
        this.objects.push(obj);
        this.selectedObject = obj;
        this.draw();
    }

    deleteSelected() {
        if (this.selectedObject) {
            this.objects = this.objects.filter(obj => obj !== this.selectedObject);
            this.selectedObject = null;
            this.draw();
        }
    }

    clear() {
        this.objects = [];
        this.selectedObject = null;
        this.draw();
    }

    duplicate() {
        if (this.selectedObject) {
            const newObj = JSON.parse(JSON.stringify(this.selectedObject));
            newObj.x += 10;
            newObj.y += 10;
            this.objects.push(newObj);
            this.selectedObject = newObj;
            this.draw();
        }
    }

    bringForward() {
        if (this.selectedObject) {
            const idx = this.objects.indexOf(this.selectedObject);
            if (idx < this.objects.length - 1) {
                [this.objects[idx], this.objects[idx + 1]] = [this.objects[idx + 1], this.objects[idx]];
                this.draw();
            }
        }
    }

    sendBackward() {
        if (this.selectedObject) {
            const idx = this.objects.indexOf(this.selectedObject);
            if (idx > 0) {
                [this.objects[idx], this.objects[idx - 1]] = [this.objects[idx - 1], this.objects[idx]];
                this.draw();
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw border
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw objects
        this.objects.forEach((obj) => {
            this.ctx.globalAlpha = obj.opacity || 1;
            
            if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color;
                this.ctx.font = `${obj.fontSize}px Arial`;
                this.ctx.fillText(obj.text, obj.x, obj.y);
            } else if (obj.type === 'rect') {
                this.ctx.strokeStyle = obj.color;
                this.ctx.lineWidth = obj.strokeWidth;
                this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'image' && obj.imgData) {
                this.ctx.drawImage(obj.imgData, obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'qr') {
                this.drawQRCode(obj);
            }

            // Draw selection border
            if (obj === this.selectedObject) {
                this.ctx.globalAlpha = 1;
                this.ctx.strokeStyle = '#667eea';
                this.ctx.lineWidth = 2;
                if (obj.type === 'text') {
                    const w = obj.text.length * obj.fontSize * 0.6;
                    const h = obj.fontSize;
                    this.ctx.strokeRect(obj.x, obj.y - h, w, h);
                } else if (obj.type === 'image') {
                    this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                } else if (obj.type === 'qr') {
                    this.ctx.strokeRect(obj.x, obj.y, obj.size, obj.size);
                } else {
                    this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                }
            }
        });

        this.ctx.globalAlpha = 1;
    }

    drawQRCode(obj) {
        // Placeholder for QR code (actual rendering handled by qrcode.js)
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
        this.ctx.fillStyle = '#999';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('QR', obj.x + obj.size/2, obj.y + obj.size/2);
        this.ctx.textAlign = 'left';
    }

    getImageData() {
        return this.canvas.toDataURL('image/png');
    }

    exportJSON() {
        return JSON.stringify(this.objects);
    }

    importJSON(jsonStr) {
        try {
            this.objects = JSON.parse(jsonStr);
            this.selectedObject = null;
            this.draw();
        } catch (e) {
            console.error('Import error:', e);
        }
    }
}