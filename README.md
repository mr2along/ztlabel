# ZT Label Designer V2

Web label designer for Zebra ZT410, kept under `/v2/` so the existing root application remains untouched.

## Core scope

- 40 × 25 mm default label
- 203 / 300 DPI with ZT410 dot-density mapping (8 / 12 dots per mm)
- Text, Code128, QR, Line, Box
- Mouse/touch drag
- X / Y / W / H property editing
- Duplicate / Delete / Clear
- Undo / Redo
- Keyboard nudging
- LocalStorage current template
- Save / Load named templates
- JSON import / export
- ZPL preview and clipboard copy
- Web Serial connect / disconnect / print
- Print copies
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
