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
     * Kết nối Bluetooth với máy in - CHỈ LỌC THEO TÊN
     */
    async connect() {
        try {
            console.log('🔍 Đang tìm kiếm máy in Bluetooth...');
            console.log('⏳ Vui lòng chọn máy in từ danh sách hiện lên...');
            
            // Yêu cầu người dùng chọn thiết bị - CHỈNH TINH GỌN
            this.device = await navigator.bluetooth.requestDevice({
                // Bỏ filters để cho phép chọn BẤT KỲ thiết bị nào
                // acceptAllDevices: true sẽ yêu cầu optionalServices
                filters: [], // Array rỗng = cho phép tìm kiếm tự do
                optionalServices: [
                    // Generic services
                    '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
                    '0000180f-0000-1000-8000-00805f9b34fb', // Battery
                    // Serial Port Profile
                    '0000180d-0000-1000-8000-00805f9b34fb', // Heart Rate
                    '00000000-deca-fade-deca-deaadeacdeac'  // Nordic UART
                ]
            });

            console.log('✅ Tìm thấy thiết bị:', this.device.name);
            console.log('📱 ID:', this.device.id);
            this.device.addEventListener('gattserverdisconnected', () => this.onDisconnected());

            // Kết nối tới GATT server
            console.log('🔗 Đang kết nối GATT...');
            this.server = await this.device.gatt.connect();
            console.log('✅ Kết nối GATT thành công');

            // Liệt kê tất cả các service
            console.log('📋 Đang quét các service...');
            const services = await this.server.getPrimaryServices();
            console.log(`🎯 Tìm thấy ${services.length} service(s):`);
            
            services.forEach((svc, idx) => {
                console.log(`  ${idx + 1}. ${svc.uuid}`);
            });

            if (services.length === 0) {
                throw new Error('Không tìm thấy service nào trên thiết bị');
            }

            // Lấy service đầu tiên (thường là service chính của thiết bị)
            this.service = services[0];
            console.log(`✅ Chọn service: ${this.service.uuid}`);

            // Liệt kê tất cả các characteristic
            console.log('📋 Đang quét các characteristic...');
            const chars = await this.service.getCharacteristics();
            console.log(`🎯 Tìm thấy ${chars.length} characteristic(s):`);
            
            chars.forEach((char, idx) => {
                console.log(`  ${idx + 1}. ${char.uuid}`);
                console.log(`     - Write: ${char.properties.write}`);
                console.log(`     - WriteNoResp: ${char.properties.writeWithoutResponse}`);
                console.log(`     - Read: ${char.properties.read}`);
                console.log(`     - Notify: ${char.properties.notify}`);
            });

            if (chars.length === 0) {
                throw new Error('Không tìm thấy characteristic nào');
            }

            // Tìm characteristic có property write
            let foundChar = null;
            for (let char of chars) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                    foundChar = char;
                    break;
                }
            }

            // Nếu không tìm được write, chọn characteristic đầu tiên
            this.characteristic = foundChar || chars[0];
            console.log(`✅ Chọn characteristic: ${this.characteristic.uuid}`);
            console.log(`   - Write: ${this.characteristic.properties.write}`);
            console.log(`   - WriteWithoutResponse: ${this.characteristic.properties.writeWithoutResponse}`);

            this.isConnected = true;
            console.log('🎉 Kết nối Bluetooth thành công!');
            
            return {
                success: true,
                message: `Kết nối thành công với: ${this.device.name || 'Thiết bị Bluetooth'}`,
                device: this.device.name || this.device.id
            };
        } catch (error) {
            console.error('❌ Lỗi kết nối:', error);
            this.isConnected = false;
            
            // Phân biệt các loại lỗi
            let errorMsg = error.message;
            if (error.name === 'NotFoundError') {
                errorMsg = 'Bạn chưa chọn thiết bị. Vui lòng nhấp "Kết nối máy in" và chọn thiết bị.';
            } else if (error.name === 'NotSupportedError') {
                errorMsg = 'Trình duyệt này không hỗ trợ Web Bluetooth API.';
            } else if (error.name === 'SecurityError') {
                errorMsg = 'Yêu cầu HTTPS và permissions. Đảm bảo kết nối an toàn.';
            }
            
            throw new Error(errorMsg);
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
            
            console.log(`📤 Gửi ${data.length} bytes...`);
            
            // Kiểm tra xem characteristic hỗ trợ writeWithoutResponse hay write
            const useWriteWithoutResponse = this.characteristic.properties.writeWithoutResponse;
            console.log(`📝 Sử dụng: ${useWriteWithoutResponse ? 'WriteWithoutResponse' : 'Write'}`);
            
            // ZT410 có thể ghi tối đa 512 bytes mỗi lần (hoặc ít hơn tùy thiết bị)
            const chunkSize = 512;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const chunkNum = Math.floor(i / chunkSize) + 1;
                const totalChunks = Math.ceil(data.length / chunkSize);
                
                try {
                    if (useWriteWithoutResponse) {
                        await this.characteristic.writeValueWithoutResponse(chunk);
                    } else {
                        await this.characteristic.writeValue(chunk);
                    }
                    console.log(`  ✅ Chunk ${chunkNum}/${totalChunks}`);
                } catch (e) {
                    // Nếu writeWithoutResponse thất bại, thử write
                    console.warn(`  ⚠️ WriteWithoutResponse thất bại, thử Write:`, e);
                    await this.characteristic.writeValue(chunk);
                    console.log(`  ✅ Chunk ${chunkNum}/${totalChunks} (Write)`);
                }
                
                // Delay giữa các chunks
                await this.delay(50);
            }
            
            console.log('✅ Gửi dữ liệu thành công');
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