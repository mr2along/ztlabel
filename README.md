# ZT Label Designer

Ứng dụng web để thiết kế và in nhãn (label) 40mm × 25mm với tối đa 2 nhãn trên một hàng.

## 🎯 Tính năng

### Thiết kế
- 🎨 **Vẽ trên canvas**: Hỗ trợ văn bản, hình ảnh, hình dạng, QR code
- 📐 **Kích thước chuẩn**: 40mm × 25mm (226×141 pixels)
- 📋 **Bố cục**: 2 nhãn trên một hàng
- 🎭 **Tùy chỉnh**: Màu sắc, kích thước chữ, độ mờ, độ dày nét
- 🖱️ **Chỉnh sửa nâng cao**: Kéo/thả, copy, xóa, sắp xếp lớp

### Công cụ

| Công cụ | Phím tắt | Chức năng |
|---------|---------|----------|
| Chọn | V | Di chuyển, chỉnh sửa các phần tử |
| Văn bản | T | Thêm và chỉnh sửa văn bản |
| Hình ảnh | I | Nhập hình ảnh |
| Hình | R | Vẽ hình chữ nhật |
| QR Code | Q | Thêm mã QR |

### Hành động
- **Lưu**: Lưu thiết kế dưới dạng tệp JSON
- **Tải**: Mở thiết kế được lưu trước đó
- **In**: In nhãn trực tiếp từ trình duyệt
- **Xóa**: Xóa phần tử được chọn hoặc toàn bộ
- **Sao chép**: Nhân bản phần tử được chọn
- **Sắp xếp**: Điều chỉnh thứ tự hiển thị các phần tử

## 📋 Yêu cầu

- Trình duyệt hiện đại hỗ trợ:
  - HTML5 Canvas
  - File API
  - JavaScript ES6+

## 🚀 Cách sử dụng

### Bước 1: Chọn công cụ
Nhấp vào công cụ muốn sử dụng trên thanh bên trái hoặc dùng phím tắt.

### Bước 2: Tùy chỉnh thuộc tính
- Chọn màu sắc
- Điều chỉnh kích thước chữ (8-72px)
- Thay đổi độ dày nét (1-10px)
- Điều chỉnh độ mờ (0-100%)

### Bước 3: Thêm nội dung
- **Văn bản**: Chọn công cụ, nhấp trên canvas, nhập văn bản
- **Hình ảnh**: Chọn công cụ, nhấp để chọn file hình ảnh
- **Hình dạng**: Chọn công cụ, nhấp trên canvas để tạo
- **QR Code**: Chọn công cụ, nhập dữ liệu, thêm vào

### Bước 4: Chỉnh sửa
- Chọn phần tử bằng công cụ "Chọn"
- Kéo để di chuyển
- Sử dụng các nút hành động để sao chép, xóa hoặc sắp xếp

### Bước 5: Lưu/In
- **Lưu**: Nhấp "Lưu" để tải về file JSON
- **Tải**: Nhấp "Tải" để mở file đã lưu
- **In**: Nhấp "In" để mở hộp thoại in trình duyệt

## 📐 Thông số kỹ thuật

- **Kích thước nhãn**: 40mm × 25mm
- **Độ phân giải**: 226×141 pixels (8.5pt/mm)
- **Số lượng nhãn**: 2 trên một hàng
- **Định dạng lưu trữ**: JSON (chứa thông tin tất cả phần tử)
- **Định dạng in**: HTML/CSS (tương thích với hầu hết các máy in)

## 🔧 Cấu trúc tệp

```
ztlabel/
├── index.html          # Giao diện chính
├── css/
│   └── styles.css      # Kiểu dáng
├── js/
│   ├── canvas.js       # Quản lý canvas
│   └── app.js          # Ứng dụng chính
└── README.md           # Tài liệu
```

## 💾 Format dữ liệu lưu trữ

Tệp được lưu dưới dạng JSON:

```json
{
  "label1": [
    {
      "type": "text",
      "x": 50,
      "y": 50,
      "text": "Mẫu văn bản",
      "fontSize": 12,
      "color": "#000000",
      "opacity": 1
    }
  ],
  "label2": [],
  "timestamp": "2026-08-08T12:00:00.000Z"
}
```

## 🖨️ In nhãn

1. Thiết kế nhãn theo ý muốn
2. Nhấp nút "In"
3. Cấu hình máy in trong hộp thoại trình duyệt
4. Nhấp "In" để in

## 📝 Ghi chú

- Tất cả dữ liệu được lưu trữ cục bộ trong trình duyệt
- Không cần kết nối internet để sử dụng
- Hỗ trợ các định dạng hình ảnh: PNG, JPG, GIF

## 🛠️ Phát triển

### Các tính năng sắp tới
- [ ] Lịch sử hoàn tác/làm lại
- [ ] Export PDF
- [ ] Thư viện template
- [ ] Ghép font chữ
- [ ] Đồng bộ đám mây

## 📄 Giấy phép

MIT License

## 👥 Đóng góp

Bất kỳ đóng góp nào cũng được hoan nghênh!

---

**Phiên bản**: 1.0.0
**Cập nhật lần cuối**: 2026-08-08