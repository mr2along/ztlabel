/*
  app.js - Web Serial (navigator.serial) demo for Zebra ZT410 over Bluetooth RFCOMM
  - Mobile-first
  - Console logging and UI-friendly messages
  - Do NOT call navigator.bluetooth anywhere
*/

(() => {
  // Globals
  let port = null;
  let isOpen = false;

  // DOM
  const statusEl = document.getElementById('status');
  const connectBtn = document.getElementById('connectBtn');
  const printBtn = document.getElementById('printBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const baudSelect = document.getElementById('baud');
  const selectedDeviceEl = document.getElementById('selectedDevice');
  const portInfoEl = document.getElementById('portInfo');
  const logWindow = document.getElementById('logWindow');

  // ZPL to send (exactly as requested)
  const ZPL = [
    "^XA",
    "^FO30,30",
    "^A0N,30,30",
    "^FDZT410 TEST PRINT^FS",
    "^FO30,80",
    "^BY2",
    "^BCN,60,Y,N,N",
    "^FD123456789^FS",
    "^XZ"
  ].join("\n") + "\n";

  // Helpers
  function log(msg) {
    const ts = new Date().toLocaleTimeString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
    logWindow.textContent = line + "\n" + logWindow.textContent;
  }

  function setStatus(text, warn = false) {
    statusEl.textContent = text;
    if (warn) {
      statusEl.style.color = "var(--danger)";
    } else {
      statusEl.style.color = "";
    }
  }

  function friendlyErrorMessage(err) {
    console.error(err);
    if (!err) return "Không xác định lỗi.";
    const name = err.name || "";
    const msg = (err.message || err.toString()).toString();

    if (name === "NotFoundError") {
      return "Không tìm thấy thiết bị. Hãy chắc chắn đã bật Bluetooth và đã ghép nối (pair) máy in trước khi kết nối.";
    }
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "Quyền truy cập bị từ chối (user denied). Vui lòng cho phép khi Chrome yêu cầu quyền truy cập cổng serial.";
    }
    if (name === "NetworkError") {
      return "Kết nối thất bại - có thể Bluetooth tắt hoặc thiết bị ngoài phạm vi.";
    }
    if (name === "InvalidStateError") {
      return "Cổng đã mở hoặc đang ở trạng thái không hợp lệ.";
    }
    if (name === "AbortError") {
      return "Hủy thao tác (có thể do người dùng hủy lựa chọn thiết bị).";
    }
    if (name === "NotReadableError") {
      return "Cổng không đọc được. Thiết bị có thể đang bị dùng bởi ứng dụng khác.";
    }
    if (name === "NotWritableError") {
      return "Không ghi được dữ liệu vào cổng. Thiết bị có thể đã ngắt kết nối.";
    }
    if (/pair/i.test(msg) || /permission/i.test(msg)) {
      return "Xảy ra lỗi liên quan đến quyền hoặc ghép nối. Hãy kiểm tra pairing trong cài đặt Bluetooth của Android.";
    }

    return `Lỗi: ${msg}`;
  }

  // UI state updates
  function updateUI() {
    connectBtn.disabled = !!isOpen;
    disconnectBtn.disabled = !isOpen;
    printBtn.disabled = !isOpen;
  }

  // Connect flow
  async function connectFlow() {
    log("CONNECT requested by user.");
    setStatus("Connecting...");

    if (!("serial" in navigator)) {
      const msg = "Web Serial không được Chrome hỗ trợ trên thiết bị này.";
      log(msg);
      setStatus(msg, true);
      alert(msg);
      return;
    }

    try {
      log("Calling navigator.serial.requestPort()");
      port = await navigator.serial.requestPort();
      log("requestPort() resolved. Port object:");
      console.log(port);
      selectedDeviceEl.textContent = JSON.stringify(port, replacerForPort(), 2);

      try {
        const info = port.getInfo ? port.getInfo() : {};
        log("Port info: " + JSON.stringify(info));
        portInfoEl.textContent = JSON.stringify(info, null, 2);
      } catch (getInfoErr) {
        log("Không thể lấy port.getInfo(): " + getInfoErr);
        portInfoEl.textContent = "Không thể lấy info: " + getInfoErr;
      }

      const baudRate = parseInt(baudSelect.value, 10) || 115200;
      log(`Opening port with baudRate=${baudRate} ...`);
      await port.open({ baudRate });
      isOpen = true;
      setStatus("Connected");
      log("Port opened successfully.");
      updateUI();

    } catch (err) {
      const friendly = friendlyErrorMessage(err);
      log(`Kết nối thất bại: ${friendly}`);
      setStatus(`Disconnected`, true);
      port = null;
      isOpen = false;
      updateUI();
      alert(`Không thể kết nối: ${friendly}`);
    }
  }

  // Print flow
  async function printFlow() {
    if (!port || !isOpen) {
      log("PRINT requested but no open port.");
      setStatus("Disconnected", true);
      alert("Máy in chưa được kết nối.");
      return;
    }

    try {
      log("Preparing writer for printing...");
      if (!port.writable) {
        throw new Error("Port has no writable stream.");
      }

      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      const payload = ZPL;
      log("Sending ZPL payload:");
      console.log(payload);
      await writer.write(encoder.encode(payload));
      log("ZPL write() resolved.");
      writer.releaseLock();
      setStatus("Print command sent");
      alert("Lệnh in đã gửi (Print command sent). Kiểm tra máy in.");
    } catch (err) {
      const friendly = friendlyErrorMessage(err);
      log("Không ghi được dữ liệu: " + friendly);
      setStatus("Error sending print", true);
      alert("Lỗi khi gửi lệnh in: " + friendly);
    }
  }

  // Disconnect flow
  async function disconnectFlow() {
    log("DISCONNECT requested by user.");
    if (!port) {
      log("No port to close.");
      setStatus("Disconnected");
      isOpen = false;
      updateUI();
      return;
    }

    try {
      if (port.readable) {
        log("Port readable present; no active reader to cancel in this demo.");
      }
      log("Closing port...");
      await port.close();
      log("Port closed.");
    } catch (err) {
      log("Lỗi khi đóng port: " + (err && err.message ? err.message : err));
    } finally {
      port = null;
      isOpen = false;
      setStatus("Disconnected");
      selectedDeviceEl.textContent = "None";
      portInfoEl.textContent = "None";
      updateUI();
    }
  }

  function replacerForPort() {
    return function (key, value) {
      if (key === "writable" || key === "readable" || key === "transport") return "[Stream]";
      return value;
    };
  }

  // Event listeners
  connectBtn.addEventListener("click", async () => {
    await connectFlow();
  });

  printBtn.addEventListener("click", async () => {
    await printFlow();
  });

  disconnectBtn.addEventListener("click", async () => {
    await disconnectFlow();
  });

  // Initialise UI
  updateUI();
  setStatus("Disconnected");

  log("ZT410 Bluetooth Test app loaded. Ready.");
  log("Note: Do NOT call navigator.bluetooth anywhere. This app uses navigator.serial only.");

})();
