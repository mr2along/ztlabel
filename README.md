# ZT Label Designer V2

Mobile-first web designer for Zebra ZT410.

## Target
- Zebra ZT410
- Bluetooth Classic
- ZPL
- 40 × 25 mm
- 203 DPI

## Features
Text, Code128, QR ZPL, Line, Box, touch/mouse drag, property editing, duplicate/delete, LocalStorage templates, ZPL generation, clipboard, Web Serial printer connection.

## Bluetooth
Uses `navigator.serial`, not Web Bluetooth. Chrome Android/desktop support depends on browser/device and the printer's exposed serial profile.

Printer:
- Model: ZT410
- Bluetooth MAC: AC:3F:A4:AB:02:4C
- Firmware: V75.20.14Z
- Language: XML and ZPL
- Controller Mode: Classic

## Run
Serve over localhost/HTTPS. Web Serial requires a secure context (localhost is treated as secure). Open the page in Chrome and click Connect; permission is requested only from that user action.

## Next
QR pixel preview, image to ZPL (^GFA), variable fields, serial/date/lot, printer status, reconnect, and production templates.