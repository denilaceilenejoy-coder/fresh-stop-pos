# Fresh Stop POS Kiosk

IT415 Practical Exam: a touchscreen Point of Sale kiosk (plain HTML, CSS, JavaScript).

## Run in VS Code
1. Open this folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension.
3. Right-click `index.html` > **Open with Live Server**.

(You can also just double-click `index.html`.)

## Transaction flow
Select Items > Review Order > Payment Method > Pay > Payment Successful > Receipt > New Transaction

## Features
- 8 large tappable product cards with +/- and remove controls
- Automatic subtotals and total
- Cash (keypad, validation, change), simulated QR and Card payments
- Unique transaction numbers (saved in localStorage)
- Stock check and deduction on successful payment
- Digital receipt, New Transaction reset

## Structure
```
fresh-stop-pos/
  index.html
  css/style.css
  js/app.js
```

## Why this approach
Product data is hard-coded and stock is kept in memory, which is enough for a single kiosk demo. No backend is needed, so the app is simple to run and explain.
