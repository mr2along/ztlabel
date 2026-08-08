// Application Main Logic
const canvas1 = new CanvasManager('canvas1');
const canvas2 = new CanvasManager('canvas2');
let currentCanvas = canvas1;
let currentTool = 'select';

// Tool Selection
document.getElementById('toolSelect').addEventListener('click', () => selectTool('select'));
document.getElementById('toolText').addEventListener('click', () => selectTool('text'));
document.getElementById('toolImage').addEventListener('click', () => selectTool('image'));
document.getElementById('toolRect').addEventListener('click', () => selectTool('rect'));
document.getElementById('toolQR').addEventListener('click', () => selectTool('qr'));

function selectTool(tool) {
    currentTool = tool;
    canvas1.currentTool = tool;
    canvas2.currentTool = tool;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tool-btn').classList.add('active');
    
    // Handle QR code modal
    if (tool === 'qr') {
        document.getElementById('qrModal').style.display = 'block';
    }
}

// Canvas Selection
document.getElementById('canvas1').addEventListener('click', () => {
    currentCanvas = canvas1;
    document.getElementById('canvas1').parentElement.classList.add('selected');
    document.getElementById('canvas2').parentElement.classList.remove('selected');
});

document.getElementById('canvas2').addEventListener('click', () => {
    currentCanvas = canvas2;
    document.getElementById('canvas2').parentElement.classList.add('selected');
    document.getElementById('canvas1').parentElement.classList.remove('selected');
});

// Property Controls
document.getElementById('colorPicker').addEventListener('change', (e) => {
    canvas1.currentColor = e.target.value;
    canvas2.currentColor = e.target.value;
    currentCanvas.draw();
});

document.getElementById('fontSize').addEventListener('change', (e) => {
    canvas1.currentFontSize = parseInt(e.target.value);
    canvas2.currentFontSize = parseInt(e.target.value);
});

document.getElementById('strokeWidth').addEventListener('change', (e) => {
    canvas1.currentStrokeWidth = parseInt(e.target.value);
    canvas2.currentStrokeWidth = parseInt(e.target.value);
});

document.getElementById('opacity').addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    canvas1.currentOpacity = opacity;
    canvas2.currentOpacity = opacity;
    document.getElementById('opacityValue').textContent = e.target.value + '%';
});

// Image Upload
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                currentCanvas.addImage(50, 50, img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Action Buttons
document.getElementById('btnDelete').addEventListener('click', () => {
    currentCanvas.deleteSelected();
});

document.getElementById('btnClear').addEventListener('click', () => {
    if (confirm('Xóa tất cả nội dung?')) {
        canvas1.clear();
        canvas2.clear();
    }
});

document.getElementById('btnDuplicate').addEventListener('click', () => {
    currentCanvas.duplicate();
});

document.getElementById('btnBringForward').addEventListener('click', () => {
    currentCanvas.bringForward();
});

document.getElementById('btnSendBackward').addEventListener('click', () => {
    currentCanvas.sendBackward();
});

// Save Label Design
document.getElementById('btnSave').addEventListener('click', () => {
    const data = {
        label1: canvas1.exportJSON(),
        label2: canvas2.exportJSON(),
        timestamp: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// Load Label Design
document.getElementById('btnLoad').addEventListener('click', () => {
    document.getElementById('loadFile').click();
});

document.getElementById('loadFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                canvas1.importJSON(data.label1);
                canvas2.importJSON(data.label2);
                alert('Tải thiết kế thành công!');
            } catch (err) {
                alert('Lỗi khi tải file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
});

// Print Labels
document.getElementById('btnPrint').addEventListener('click', () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const label1Img = document.getElementById('canvas1').toDataURL();
    const label2Img = document.getElementById('canvas2').toDataURL();
    
    const html = `
        <html>
        <head>
            <title>In Nhãn</title>
            <style>
                body { margin: 0; padding: 20px; font-family: Arial; }
                .page { page-break-after: always; }
                .label-row { display: flex; gap: 20px; margin-bottom: 20px; }
                .label { width: 226px; height: 141px; border: 1px solid #ccc; }
                img { width: 100%; height: 100%; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .page { page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="label-row">
                    <div class="label"><img src="${label1Img}"></div>
                    <div class="label"><img src="${label2Img}"></div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
});

// QR Code Modal Handler
function addQRCode() {
    const qrInput = document.getElementById('qrInput');
    const qrData = qrInput.value.trim();
    
    if (qrData) {
        currentCanvas.addQR(50, 50, qrData);
        qrInput.value = '';
        document.getElementById('qrModal').style.display = 'none';
    } else {
        alert('Vui lòng nhập dữ liệu QR Code');
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'v' || e.key === 'V') selectTool('select');
    if (e.key === 't' || e.key === 'T') selectTool('text');
    if (e.key === 'i' || e.key === 'I') selectTool('image');
    if (e.key === 'r' || e.key === 'R') selectTool('rect');
    if (e.key === 'q' || e.key === 'Q') selectTool('qr');
    if (e.key === 'Delete') currentCanvas.deleteSelected();
    if (e.ctrlKey && e.key === 'z') {
        // Undo functionality could be added here
    }
});

// Initialize
window.addEventListener('load', () => {
    document.getElementById('canvas1').parentElement.classList.add('selected');
});