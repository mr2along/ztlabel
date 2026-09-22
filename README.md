# ZT Label Designer V2

Web label designer for Zebra ZT410, kept under `/v2/` so the existing root application remains untouched.

## Core scope

- 40 × 25 mm default label
- Preset label sizes plus custom W/H in mm (up to 300 mm in the editor)
- 203 / 300 DPI with ZT410 dot-density mapping (8 / 12 dots per mm)
- Text, Code128, QR, Line, Box, Image (`^GFA` monochrome)
- Mouse/touch drag
- X / Y / W / H property editing
- Duplicate / Delete / Clear
- Undo / Redo
- Keyboard nudging
- LocalStorage current template
- Save / Load named templates
- JSON import / export
- ZPL preview and clipboard copy
- Image insertion from PNG/JPEG/WebP/BMP with monochrome threshold and size mapping to ZPL
- Web Serial connect / disconnect / print
- Print copies with automatic serial-number advancement
- 8-handle object resize
- 0 / 90 / 180 / 270° object rotation
- Align to label: left / center / right / top / middle / bottom
- Layer ordering: front / back / bring forward / send backward
- Grid, 1 mm snap, and mm rulers
- Dynamic variables: `{{name}}`, `{{code}}`, `{{date}}`, `{{time}}`, `{{datetime}}`, `{{serial}}`
- CSV / TSV batch production using template variables
- Best-effort ZT410 status query via `~HS`
- Auto reconnect to a previously authorized serial port
- Local print history (up to 50 records)
- UTF-8 ZPL with `^CI28`

## Browser / transport

The printer path is:

`Chrome → Web Serial → serial profile / Bluetooth RFCOMM → ZT410`

Web Serial is only usable from a secure context such as HTTPS or localhost. The Connect button requests the serial port so the browser keeps the permission flow user initiated.

## ZT410 print mapping

| DPI | dots/mm | 40 × 25 mm |
|---|---:|---:|
| 203 | 8 | 320 × 200 dots |
| 300 | 12 | 480 × 300 dots |

## Run locally

Serve the repository over localhost, for example with any static HTTP server, then open:

`http://localhost:<port>/v2/`

Do not use the GitHub `blob` page as the runtime.

## Hardware print validation

Before production printing, validate at the target printer:

1. Text positioning and clipping
2. Code128 readability
3. QR readability
4. UTF-8 / Vietnamese text
5. 203 DPI
6. 300 DPI
7. Multiple copies
8. Bluetooth disconnect / reconnect

The UI status means the ZPL write completed; it does not by itself prove that media advanced or the label was physically printed.

## Security / privacy

No printer MAC address or other device identifier is stored in the web UI. No server-side backend is required for the designer itself.
