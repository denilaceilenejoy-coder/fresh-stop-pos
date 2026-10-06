/* ---------- DATA ---------- */
const PRODUCTS = [
  {id:1, name:'Coffee',        price:45, emoji:'☕',  stock:50},
  {id:2, name:'Sandwich',      price:50, emoji:'🥪',  stock:50},
  {id:3, name:'Soft Drink',    price:35, emoji:'🥤',  stock:50},
  {id:4, name:'Cookies',       price:25, emoji:'🍪',  stock:50},
  {id:5, name:'Bottled Water', price:20, emoji:'💧',  stock:50},
  {id:6, name:'Chocolate',     price:25, emoji:'🍫',  stock:50},
  {id:7, name:'Notebook',      price:60, emoji:'📓',  stock:30},
  {id:8, name:'Ballpen',       price:15, emoji:'🖊️', stock:60},
];

/* ---------- STATE ---------- */
let state = freshState();
function freshState(){
  return {screen:'select', cart:{}, method:null, cashInput:'', busy:false, receipt:null, qrOk:false};
}

/* ---------- HELPERS ---------- */
const $ = s => document.querySelector(s);
const money = n => '₱' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const prod = id => PRODUCTS.find(p => p.id === id);
const cartLines = () => Object.entries(state.cart).map(([id,q]) => {
  const p = prod(+id); return {id:p.id, name:p.name, qty:q, price:p.price, sub:p.price*q};
});
const total = () => cartLines().reduce((s,l) => s + l.sub, 0);
const itemCount = () => cartLines().reduce((s,l) => s + l.qty, 0);

let toastTimer;
function toast(msg, type=''){
  const t = $('#toast');
  t.textContent = msg; t.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = '', 2200);
}

const STEPS = {select:'Step 1 of 6 · Choose items', summary:'Step 2 of 6 · Review order', method:'Step 3 of 6 · Payment method',
  pay:'Step 4 of 6 · Payment', processing:'Step 4 of 6 · Processing', success:'Step 5 of 6 · Confirmation', receipt:'Step 6 of 6 · Receipt'};
function go(screen){ state.screen = screen; render(); window.scrollTo(0,0); }

/* ---------- CART ACTIONS ---------- */
function addItem(id){
  const p = prod(id), cur = state.cart[id] || 0;
  if(p.stock - cur <= 0){ toast(`Sorry, ${p.name} is out of stock`, 'err'); return; }
  state.cart[id] = cur + 1;
  toast(`Product added: ${p.name}`, 'ok'); render();
}
function changeQty(id, d){
  const p = prod(id), cur = state.cart[id] || 0, next = cur + d;
  if(d > 0 && next > p.stock){ toast(`Only ${p.stock} ${p.name} in stock`, 'err'); return; }
  if(next <= 0){ delete state.cart[id]; toast(`${p.name} removed`); }
  else state.cart[id] = next;
  render();
}
function removeItem(id){ delete state.cart[id]; toast(`${prod(id).name} removed`); render(); }

/* ---------- RENDER ---------- */
function render(){
  $('#stepLabel').textContent = STEPS[state.screen] || '';
  const app = $('#app');
  switch(state.screen){
    case 'select':     app.innerHTML = viewSelect(); break;
    case 'summary':    app.innerHTML = viewSummary(); break;
    case 'method':     app.innerHTML = viewMethod(); break;
    case 'pay':        app.innerHTML = viewPay(); bindPay(); break;
    case 'processing': app.innerHTML = viewProcessing(); break;
    case 'success':    app.innerHTML = viewSuccess(); break;
    case 'receipt':    app.innerHTML = viewReceipt(); break;
  }
}

function cartHTML(editable){
  const lines = cartLines();
  if(!lines.length) return `<div class="cart-empty">Your order is empty.<br>Tap an item to add it.</div>`;
  return lines.map(l => `
    <div class="row">
      <div class="info"><b>${l.name}</b><small>${money(l.price)} each</small></div>
      <div class="qty">
        <button onclick="changeQty(${l.id},-1)" aria-label="Decrease">−</button>
        <span>${l.qty}</span>
        <button onclick="changeQty(${l.id},1)" aria-label="Increase">+</button>
      </div>
      <div class="sub">${money(l.sub)}</div>
      <button class="btn-danger rm" onclick="removeItem(${l.id})" aria-label="Remove">✕</button>
    </div>`).join('');
}

function viewSelect(){
  const cards = PRODUCTS.map(p => {
    const q = state.cart[p.id] || 0, left = p.stock - q;
    return `<button class="item ${left<=0?'out':''}" onclick="addItem(${p.id})">
      ${q?`<span class="badge">${q}</span>`:''}
      <span class="emoji">${p.emoji}</span>
      <span class="name">${p.name}</span>
      <span class="price">${money(p.price)}</span>
      <span class="stock">${left<=0?'Out of stock':left+' left'}</span>
    </button>`;}).join('');
  return `<div class="layout">
    <section><h2>Tap items to order</h2><div class="grid">${cards}</div></section>
    <aside class="panel cart">
      <h2>Your Order</h2>
      ${cartHTML(true)}
      <div class="total"><span>Total</span><span>${money(total())}</span></div>
      <button class="btn-primary" style="width:100%" onclick="toSummary()">Continue to Payment →</button>
    </aside></div>`;
}
function toSummary(){
  if(!itemCount()){ toast('Your order is empty. Please add an item.', 'err'); return; }
  go('summary');
}

function viewSummary(){
  const rows = cartLines().map(l => `<tr><td>${l.name}</td><td class="r">${l.qty}</td><td class="r">${money(l.price)}</td><td class="r">${money(l.sub)}</td></tr>`).join('');
  return `<div class="panel"><h2>Order Summary</h2>
    <table><tr><th>Product</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Subtotal</th></tr>${rows}</table>
    <div class="total"><span>TOTAL</span><span>${money(total())}</span></div>
    <div class="actions">
      <button class="btn-ghost" onclick="go('select')">← Back</button>
      <button class="btn-primary" onclick="go('method')">Continue to Payment →</button>
    </div></div>`;
}

function viewMethod(){
  return `<div class="center"><h2>How would you like to pay?</h2>
    <div class="due">${money(total())}</div></div>
    <div class="methods">
      <button class="method" onclick="chooseMethod('Cash')"><span class="emoji">💵</span>Cash</button>
      <button class="method" onclick="chooseMethod('QR Payment')"><span class="emoji">📱</span>QR Payment</button>
      <button class="method" onclick="chooseMethod('Credit/Debit Card')"><span class="emoji">💳</span>Credit / Debit Card</button>
    </div>
    <div class="actions" style="max-width:300px"><button class="btn-ghost" onclick="go('summary')">← Back</button></div>`;
}
function chooseMethod(m){ state.method = m; state.cashInput = ''; state.qrOk = false; go('pay'); }

function viewPay(){
  const t = total();
  const back = `<button class="btn-ghost" onclick="go('method')">← Change method</button>`;
  if(state.method === 'Cash'){
    const quick = [50,100,200,500,1000].map(v => `<button onclick="setCash('${v}')">₱${v}</button>`).join('');
    const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k => `<button onclick="key('${k}')">${k}</button>`).join('');
    return `<div class="panel"><h2>💵 Cash Payment</h2>
      <div class="pay-grid">
        <div>
          <div>Total due</div><div class="due">${money(t)}</div>
          <label for="cash">Amount paid</label>
          <input id="cash" class="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${state.cashInput}">
          <div class="quick"><button onclick="setCash('${t}')">Exact</button>${quick}</div>
          <div class="chg">Change: <b id="chg">${money(0)}</b></div>
          <div class="msg" id="msg"></div>
        </div>
        <div><div class="keypad">${keys}</div>
          <button class="btn-danger" style="width:100%;margin-top:10px" onclick="setCash('')">Clear</button></div>
      </div>
      <div class="actions">${back}<button class="btn-ok" onclick="payCash()">Pay Now</button></div></div>`;
  }
  if(state.method === 'QR Payment'){
    return `<div class="panel center"><h2>📱 QR Payment</h2>
      <div>Amount to pay</div><div class="due">${money(t)}</div>
      <div class="qr">${qrSVG(t)}</div>
      <p>Scan the QR code using your supported payment application.</p>
      <div class="actions">${back}<button class="btn-ok" onclick="payQR()">Confirm Payment</button></div></div>`;
  }
  return `<div class="panel center"><h2>💳 Credit / Debit Card</h2>
    <div>Amount due</div><div class="due">${money(t)}</div>
    <div style="font-size:70px">💳</div>
    <p>Please tap, insert, or swipe your card.</p>
    <div class="actions">${back}<button class="btn-ok" onclick="payCard()">Process Payment</button></div></div>`;
}

function viewProcessing(){
  return `<div class="panel center"><h2>Processing payment…</h2><div class="spinner"></div><p>Please wait. Do not leave the kiosk.</p></div>`;
}

function viewSuccess(){
  const r = state.receipt;
  return `<div class="panel center"><div class="check">✅</div><h2>Payment Successful</h2>
    <div class="kv">
      <span>Transaction No.</span><span>${r.txn}</span>
      <span>Payment method</span><span>${r.method}</span>
      <span>Total amount</span><span>${money(r.total)}</span>
      <span>Amount paid</span><span>${money(r.paid)}</span>
      <span>Change</span><span>${money(r.change)}</span>
    </div>
    <button class="btn-primary" style="min-width:280px" onclick="go('receipt')">View Receipt</button></div>`;
}

function viewReceipt(){
  const r = state.receipt;
  const items = r.lines.map(l => `<div class="line"><span>${l.name}</span><span>${money(l.sub)}</span></div>
    <div class="line" style="color:#666;font-size:15px"><span>&nbsp;&nbsp;${l.qty} × ${money(l.price)}</span><span></span></div>`).join('');
  return `<div class="receipt">
    <h3>FRESH STOP POS</h3>
    <div class="line"><span>Transaction No.:</span><span>${r.txn}</span></div>
    <div class="line"><span>Date:</span><span>${r.date}</span></div>
    <hr>${items}<hr>
    <div class="line big"><span>TOTAL</span><span>${money(r.total)}</span></div>
    <div class="line"><span>Payment method</span><span>${r.method}</span></div>
    <div class="line"><span>Amount paid</span><span>${money(r.paid)}</span></div>
    <div class="line"><span>Change</span><span>${money(r.change)}</span></div>
    <div class="ok">✔ Payment Successful</div>
    <div style="text-align:center;margin-top:8px">Thank you!</div></div>
    <div class="actions" style="max-width:520px;margin:20px auto 0">
      <button class="btn-ghost" onclick="window.print()">🖨 Print</button>
      <button class="btn-primary" onclick="newTransaction()">New Transaction</button></div>`;
}

/* ---------- CASH ---------- */
function bindPay(){
  const inp = $('#cash'); if(!inp) return;
  inp.addEventListener('input', () => { state.cashInput = inp.value; updateChange(); });
  updateChange();
}
function setCash(v){ state.cashInput = String(v); const i = $('#cash'); if(i) i.value = state.cashInput; updateChange(); $('#msg').textContent = ''; }
function key(k){
  let v = state.cashInput;
  if(k === '⌫') v = v.slice(0,-1);
  else if(k === '.'){ if(v.includes('.')) return; v = (v || '0') + '.'; }
  else { if(/\.\d{2}$/.test(v) || v.length >= 9) return; v += k; }
  setCash(v);
}
function updateChange(){
  const n = parseFloat(state.cashInput), el = $('#chg');
  if(!el) return;
  el.textContent = (!isNaN(n) && n >= total()) ? money(n - total()) : money(0);
}
function payCash(){
  const raw = state.cashInput.trim(), t = total(), msg = $('#msg');
  const fail = (m) => { msg.textContent = m; toast(m, 'err'); };
  if(raw === '') return fail('Please enter the amount paid.');
  if(raw.startsWith('-')) return fail('Amount cannot be negative.');
  if(!/^\d+(\.\d{1,2})?$/.test(raw)) return fail('Invalid amount. Numbers only.');
  const paid = parseFloat(raw);
  if(paid < t) return fail(`Insufficient payment. Please enter at least ${money(t)}.`);
  finish('Cash', paid);
}

/* ---------- QR / CARD (simulated) ---------- */
function payQR(){
  if(state.busy) return; state.busy = true;
  go('processing');
  setTimeout(() => { state.busy = false; finish('QR Payment', total()); }, 1500);
}
function payCard(){
  if(state.busy) return; state.busy = true;
  go('processing');
  setTimeout(() => { state.busy = false; finish('Credit/Debit Card', total()); }, 2000);
}

/* Simple generated QR-style placeholder (not scannable) */
function qrSVG(seed){
  const N = 25, cell = 10; let s = Math.floor(seed*100) + 7;
  const rnd = () => (s = (s*1664525 + 1013904223) % 4294967296) / 4294967296;
  let out = `<svg viewBox="0 0 ${N*cell} ${N*cell}" width="100%" height="100%" shape-rendering="crispEdges">`;
  const inFinder = (x,y) => (x<8&&y<8) || (x>=N-8&&y<8) || (x<8&&y>=N-8);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(!inFinder(x,y) && rnd() > .5) out += `<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}"/>`;
  }
  [[0,0],[N-7,0],[0,N-7]].forEach(([fx,fy]) => {
    out += `<rect x="${fx*cell}" y="${fy*cell}" width="${7*cell}" height="${7*cell}"/>
            <rect x="${(fx+1)*cell}" y="${(fy+1)*cell}" width="${5*cell}" height="${5*cell}" fill="#fff"/>
            <rect x="${(fx+2)*cell}" y="${(fy+2)*cell}" width="${3*cell}" height="${3*cell}"/>`;
  });
  return out + '</svg>';
}

/* ---------- COMPLETE TRANSACTION ---------- */
function nextTxn(){
  let n = 0;
  try{ n = parseInt(localStorage.getItem('pos_txn_counter') || '0', 10); }catch(e){}
  n++;
  try{ localStorage.setItem('pos_txn_counter', String(n)); }catch(e){}
  return `TXN-${new Date().getFullYear()}-${String(n).padStart(5,'0')}`;
}
function finish(method, paid){
  const lines = cartLines(), t = total();
  if(!lines.length || paid < t){ toast('Payment could not be completed.', 'err'); go('select'); return; }
  lines.forEach(l => { prod(l.id).stock -= l.qty; });   // deduct stock only on success
  state.receipt = {
    txn: nextTxn(),
    date: new Date().toLocaleString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    lines, total:t, method, paid, change: Math.round((paid - t)*100)/100
  };
  toast('Transaction completed successfully', 'ok');
  go('success');
}

function newTransaction(){ state = freshState(); render(); toast('New transaction started'); }

render();
