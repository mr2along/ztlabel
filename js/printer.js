// Bluetooth Printer Manager for ZT410
class ZT410BluetoothPrinter {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.printerModel = 'ZT410';
        
        // ZT410 printer specifications
        this.maxLineWidth = 226; // pixels at 8.5pt/mm
        this.maxLabelHeight = 141; // pixels
        this.dpi = 203; // Zebra ZT410 resolution (203 DPI)
    }

    /**
     * Kết nối Bluetooth với máy in
     */
    async connect() {
        try {
            console.log('🔍 Đang tìm kiếm máy in ZT410...');
            
            // Yêu cầu người dùng chọn thiết bị
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'ZT410' },
                    { namePrefix: 'Zebra' },
                    { services: ['ff00'] } // Generic Bluetooth service
                ],
                optionalServices: ['ff00', '180a']
            });

            console.log('✅ Tìm thấy thiết bị:', this.device.name);
            this.device.addEventListener('gattserverdisconnected', () => this.onDisconnected());

            // Kết nối tới GATT server
            this.server = await this.device.gatt.connect();
            console.log('✅ Kết nối GATT thành công');

            // Lấy service
            this.service = await this.server.getPrimaryService('ff00');
            console.log('✅ Lấy service thành công');

            // Lấy characteristic để ghi dữ liệu
            this.characteristic = await this.service.getCharacteristic('ff01');
            console.log('✅ Lấy characteristic thành công');

            this.isConnected = true;
            console.log('🎉 Kết nối Bluetooth thành công!');
            
            return {
                success: true,
                message: `Kết nối thành công với ${this.device.name}`,
                device: this.device.name
            };
        } catch (error) {
            console.error('❌ Lỗi kết nối:', error);
            this.isConnected = false;
            throw new Error(`Lỗi kết nối Bluetooth: ${error.message}`);
        }
    }

    /**
     * Ngắt kết nối Bluetooth
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
            this.isConnected = false;
            console.log('✅ Ngắt kết nối thành công');
        }
    }

    /**
     * Xử lý khi máy in ngắt kết nối
     */
    onDisconnected() {
        console.log('⚠️ Máy in đã ngắt kết nối');
        this.isConnected = false;
        // Cập nhật UI
        if (window.updateConnectionStatus) {
            window.updateConnectionStatus(false);
        }
    }

    /**
     * Gửi lệnh ZPL tới máy in
     */
    async sendCommand(command) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Máy in chưa được kết nối');
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command);
            
            // ZT410 có thể ghi tối đa 20 bytes mỗi lần, nên chia thành chunks
            const chunkSize = 20;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                await this.characteristic.writeValue(chunk);
                // Delay giữa các chunks
                await this.delay(10);
            }
            
            console.log('✅ Gửi lệnh thành công');
            return true;
        } catch (error) {
            console.error('❌ Lỗi gửi lệnh:', error);
            throw error;
        }
    }

    /**
     * Chuyển canvas thành ZPL commands
     */
    canvasToZPL(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Chuyển đổi thành monochrome (đen/trắng)
            const binaryData = this.imageToBinary(imageData, canvas.width, canvas.height);

            // Tạo ZPL command
            const zpl = this.binaryToZPL(binaryData, canvas.width, canvas.height);
            return zpl;
        } catch (error) {
            console.error('❌ Lỗi chuyển đổi canvas:', error);
            throw error;
        }
    }

    /**
     * Chuyển đổi hình ảnh sang binary (đen/trắng)
     */
    imageToBinary(imageData, width, height) {
        const data = imageData.data;
        const binary = [];

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Tính độ sáng (luminance)
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255);
            
            // Chuyển thành bit: 0 = trắng, 1 = đen
            binary.push(luminance < 128 ? 1 : 0);
        }

        return binary;
    }

    /**
     * Chuyển đổi binary data sang ZPL graphic command
     */
    binaryToZPL(binary, width, height) {
        // Tính toán số bytes cần thiết
        const bytesPerLine = Math.ceil(width / 8);
        const hexLines = [];

        for (let y = 0; y < height; y++) {
            let hexLine = '';
            for (let x = 0; x < width; x += 8) {
                let byte = 0;
                for (let bit = 0; bit < 8 && x + bit < width; bit++) {
                    const pixelIndex = y * width + x + bit;
                    if (pixelIndex < binary.length && binary[pixelIndex]) {
                        byte |= (1 << (7 - bit));
                    }
                }
                hexLine += byte.toString(16).padStart(2, '0').toUpperCase();
            }
            hexLines.push(hexLine);
        }

        const graphicData = hexLines.join('');
        const graphicSize = graphicData.length / 2; // Số bytes

        // Tạo ZPL command
        let zpl = '^XA\n'; // Start label
        zpl += '^MMT\n'; // Set media type to thermal
        zpl += '^PW' + width + '\n'; // Set print width
        zpl += '^LL' + height + '\n'; // Set label length
        zpl += '^POI\n'; // Print orientation
        zpl += `^GFA,${graphicSize},${graphicSize},${bytesPerLine},${graphicData}\n`; // Graphic data
        zpl += '^XZ\n'; // End label

        return zpl;
    }

    /**
     * In label từ canvas
     */
    async printLabel(canvas, copies = 1) {
        if (!this.isConnected) {
            throw new Error('Máy in chưa được kết nối');
        }

        try {
            console.log(`🖨️ Đang in ${copies} bản...`);
            
            // Chuyển canvas thành ZPL
            let zpl = this.canvasToZPL(canvas);

            // Thêm số bản in
            if (copies > 1) {
                zpl = zpl.replace('^XZ', `^PQ${copies}\n^XZ`);
            }

            console.log('📋 ZPL Command:\n', zpl);

            // Gửi lệnh tới máy in
            await this.sendCommand(zpl);
            
            console.log('✅ Gửi lệnh in thành công');
            return {
                success: true,
                message: `In thành công ${copies} bản`,
                copies: copies
            };
        } catch (error) {
            console.error('❌ Lỗi in:', error);
            throw error;
        }
    }

    /**
     * In cả 2 label
     */
    async printBothLabels(canvas1, canvas2, copies = 1) {
        if (!this.isConnected) {
            throw new Error('Máy in chưa được kết nối');
        }

        try {
            console.log(`🖨️ Đang in 2 labels...`);
            
            // In label 1
            console.log('📄 In label 1...');
            await this.printLabel(canvas1, copies);
            
            // Delay giữa 2 labels
            await this.delay(500);
            
            // In label 2
            console.log('📄 In label 2...');
            await this.printLabel(canvas2, copies);
            
            console.log('✅ In cả 2 labels thành công');
            return {
                success: true,
                message: `In thành công 2 labels × ${copies} bản`,
                totalCopies: 2 * copies
            };
        } catch (error) {
            console.error('❌ Lỗi in:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái máy in
     */
    async getStatus() {
        try {
            // ZPL command để yêu cầu trạng thái
            const statusCommand = '^XA^HU^XZ\n';
            await this.sendCommand(statusCommand);
            
            return {
                success: true,
                connected: this.isConnected,
                device: this.device ? this.device.name : 'Chưa kết nối'
            };
        } catch (error) {
            console.error('❌ Lỗi kiểm tra trạng thái:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin máy in
     */
    async getPrinterInfo() {
        try {
            if (!this.isConnected || !this.characteristic) {
                return {
                    model: this.printerModel,
                    connected: false,
                    resolution: '203 DPI',
                    maxWidth: this.maxLineWidth + ' pixels'
                };
            }

            // Gửi lệnh để lấy thông tin
            const infoCommand = '^XA^XZ\n';
            await this.sendCommand(infoCommand);

            return {
                model: this.printerModel,
                connected: true,
                device: this.device.name,
                resolution: '203 DPI',
                maxWidth: this.maxLineWidth + ' pixels',
                maxHeight: this.maxLabelHeight + ' pixels',
                status: 'Sẵn sàng'
            };
        } catch (error) {
            console.error('❌ Lỗi lấy thông tin:', error);
            return {
                model: this.printerModel,
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Hỗ trợ Bluetooth đã có sẵn hay không
     */
    static isBluetoothSupported() {
        return !!(navigator.bluetooth);
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export để sử dụng
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZT410BluetoothPrinter;
}
