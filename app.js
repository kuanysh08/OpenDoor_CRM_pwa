
// Simple store using localStorage
const STORE_KEY = 'opendoorCRMv1';
const initData = { deals: [], clients: [], tasks: [] };

function load(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || initData; }catch(e){ return initData; }
}
function save(data){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

let state = load();

// Utils
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>Array.from(el.querySelectorAll(s));
const money = n => new Intl.NumberFormat('ru-RU').format(Number(n||0));

// Screens
const SCREENS = {};

SCREENS.pipeline = () => {
  const el = document.createElement('div'); el.className='list';
  if(state.deals.length===0){
    const empty = document.createElement('div'); empty.className='card';
    empty.innerHTML = '<h3>Сделок пока нет</h3><div class="kb">Нажми «＋» чтобы добавить первую.</div>';
    el.appendChild(empty);
  }
  state.deals.forEach(d=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div>
          <h3>${d.client}</h3>
          <div class="kb">${d.phone} • ${d.source}</div>
        </div>
        <div class="badge">${d.stage||'Лид'}</div>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="stage">Итого: ${money(d.total)} ₸</div>
        <span class="kb">Адрес: ${d.address||'-'}</span>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn small" data-act="next">Следующий этап</button>
        <button class="btn small" data-act="docs">Документы</button>
        <a class="btn small" target="_blank" href="https://wa.me/?text=${encodeURIComponent('Здравствуйте! Напоминаем: доставка '+(d.delivDate||'')+' в '+(d.delivTime||'')+'. Адрес: '+(d.address||''))}">WhatsApp</a>
        <button class="btn small" data-act="open" style="margin-left:auto">Открыть</button>
      </div>
    `;
    card.querySelector('[data-act="open"]').onclick = () => openDeal(d.id);
    card.querySelector('[data-act="next"]').onclick = () => { nextStage(d.id); render(); };
    card.querySelector('[data-act="docs"]').onclick = () => openDocs(d);
    el.appendChild(card);
  });
  return el;
};

SCREENS.clients = () => {
  const el = document.createElement('div'); el.className='list';
  const top = document.createElement('div'); top.className='card';
  top.innerHTML = `<div class="row">
    <input id="cName" class="input" placeholder="Имя клиента">
    <input id="cPhone" class="input" placeholder="+7 ...">
    <button id="cAdd" class="btn primary">Добавить</button>
  </div>`;
  top.querySelector('#cAdd').onclick = () => {
    const name = $('#cName', top).value.trim();
    const phone = $('#cPhone', top).value.trim();
    if(!name || !phone) return alert('Заполни имя и телефон');
    state.clients.push({name, phone}); save(state); render('clients');
  };
  el.appendChild(top);
  state.clients.forEach(c=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${c.name}</h3><div class="kb">${c.phone}</div>`;
    el.appendChild(card);
  });
  return el;
};

SCREENS.tasks = () => {
  const el = document.createElement('div'); el.className='list';
  const head = document.createElement('div'); head.className='card';
  head.innerHTML = `
    <div class="row">
      <select id="tType" class="input"><option>Доставка</option><option>Установка</option></select>
      <input id="tFor" class="input" placeholder="Клиент">
      <input id="tWhen" class="input" type="datetime-local">
      <button id="tAdd" class="btn primary">Добавить</button>
    </div>`;
  head.querySelector('#tAdd').onclick = () => {
    state.tasks.push({ type: $('#tType', head).value, who: $('#tFor', head).value, when: $('#tWhen', head).value, status:'Назначено' });
    save(state); render('tasks');
  };
  el.appendChild(head);
  const list = document.createElement('div'); el.appendChild(list);
  state.tasks.forEach(t=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${t.type}</h3><div class="kb">${t.who} • ${t.when||''}</div><div class="badge">${t.status}</div>`;
    list.appendChild(card);
  });
  return el;
};

SCREENS.reports = () => {
  const el = document.createElement('div'); el.className='list';
  const k1 = state.deals.length;
  const paid = state.deals.filter(d=>d.stage==='Оплата').length;
  const revenue = state.deals.reduce((s,d)=> s+(Number(d.total)||0), 0);
  const card = document.createElement('div'); card.className='card';
  card.innerHTML = `
    <h3>Июль: показатели</h3>
    <div class="row" style="gap:12px;margin-top:8px">
      <div class="stage">Сделок: ${k1}</div>
      <div class="stage">Оплачено: ${paid}</div>
      <div class="stage">Выручка: ${money(revenue)} ₸</div>
    </div>`;
  el.appendChild(card); return el;
};

SCREENS.settings = () => {
  const el = document.createElement('div'); el.className='list';
  const card = document.createElement('div'); card.className='card';
  card.innerHTML = `
    <h3>Шаблоны WhatsApp</h3>
    <div class="kb">Используются в кнопке WhatsApp в карточке сделки</div>
    <textarea id="waTpl" class="input" rows="2">Здравствуйте! Напоминаем: доставка {{date}} в {{time}}. Адрес: {{address}}.</textarea>
  `;
  el.appendChild(card); return el;
};

function openDeal(id){
  const d = state.deals.find(x=>x.id===id); if(!d) return;
  // open docs dialog? For now open bottom sheet with values
  openSheet(true);
  $('#sheetTitle').textContent = 'Сделка: '+d.client;
  $('#fClient').value = d.client; $('#fPhone').value = d.phone; $('#fSource').value = d.source || 'Instagram';
  $('#fAddress').value = d.address||''; $('#fDelivDate').value = d.delivDate||''; $('#fDelivTime').value = d.delivTime||'';
  const items = $('#items'); items.innerHTML='';
  (d.items||[]).forEach(it=> addItemRow(it.name,it.qty,it.price));
  recalcSum();
  // On submit, update existing
  const form = $('#dealForm');
  form.onsubmit = (e)=>{
    e.preventDefault();
    const updated = readForm();
    Object.assign(d, updated);
    save(state); closeSheet(); render();
  };
}

function openDocs(d){
  // simple window with printable content
  const win = window.open('','_blank');
  const rows = (d.items||[]).map(it=>`<tr><td>${it.name}</td><td>${it.qty}</td><td>${money(it.price)}</td><td>${money(it.qty*it.price)}</td></tr>`).join('');
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>КП — ${d.client}</title>
  <style>body{{font-family:-apple-system,Inter,Segoe UI,Roboto,sans-serif;padding:20px}} table{{width:100%;border-collapse:collapse}} th,td{{border:1px solid #e5e7eb;padding:8px}} th{{text-align:left}} .tot{{text-align:right;font-weight:700}}</style>
  </head><body>
  <h2>Коммерческое предложение — Opendoor</h2>
  <div>Клиент: ${d.client} • Тел: ${d.phone}</div>
  <div>Адрес: ${d.address||''}</div>
  <hr/>
  <table><thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="tot">Итого: ${money(d.total)} ₸</p>
  <p>Сформировано автоматически в Opendoor CRM.</p>
  </body></html>`);
  win.document.close();
}

function nextStage(id){
  const order = ['Лид','Контакт','Консультация','КП/Накладная','Оплата','Доставка','Установка'];
  const d = state.deals.find(x=>x.id===id); if(!d) return;
  const i = Math.max(0, order.indexOf(d.stage)); d.stage = order[Math.min(order.length-1, i+1)];
  save(state);
}

// Bottom sheet logic
const sheet = $('#sheet');
const fab = $('#fab');
const addTop = $('#addDealTop');
fab.addEventListener('click', ()=> openSheet());
addTop.addEventListener('click', ()=> openSheet());
$('#cancelSheet').addEventListener('click', ()=> closeSheet());
$('#addItem').addEventListener('click', ()=> addItemRow());

function openSheet(edit=false){
  // reset clean form every time unless editing existing
  if(!edit){
    $('#dealForm').reset();
    $('#items').innerHTML='';
    addItemRow();
    $('#sum').textContent='0';
    $('#sheetTitle').textContent = 'Новая сделка';
    $('#dealForm').onsubmit = submitNew;
  }
  sheet.classList.remove('hidden');
}
function closeSheet(){ sheet.classList.add('hidden'); }

function submitNew(e){
  e.preventDefault();
  const data = readForm();
  data.id = 'DL-' + Math.random().toString(36).slice(2,7).toUpperCase();
  data.stage = 'Лид';
  state.deals.unshift(data);
  save(state);
  closeSheet();
  render();
}

function readForm(){
  const items = $$('.item', $('#items')).map(row => {
    return {
      name: $('.item-name', row).value.trim(),
      qty: Number($('.item-qty', row).value || 0),
      price: Number($('.item-price', row).value || 0)
    };
  }).filter(it=>it.name);
  const total = items.reduce((s,it)=> s + it.qty*it.price, 0);
  return {
    client: $('#fClient').value.trim(),
    phone: $('#fPhone').value.trim(),
    source: $('#fSource').value,
    address: $('#fAddress').value.trim(),
    delivDate: $('#fDelivDate').value,
    delivTime: $('#fDelivTime').value,
    items, total
  };
}

function addItemRow(name='', qty=1, price=0){
  const tpl = $('#itemRow').content.cloneNode(true);
  const row = tpl.querySelector('.item');
  $('.item-name', row).value = name;
  $('.item-qty', row).value = qty;
  $('.item-price', row).value = price;
  $('.remove', row).onclick = ()=> { row.remove(); recalcSum(); };
  ['input','change'].forEach(ev=> row.addEventListener(ev, recalcSum));
  $('#items').appendChild(row);
  recalcSum();
}

function recalcSum(){
  const items = $$('.item', $('#items'));
  let s = 0;
  items.forEach(r=>{ s += (Number($('.item-qty', r).value||0) * Number($('.item-price', r).value||0)); });
  $('#sum').textContent = money(s);
}

// Router
function render(screen='pipeline'){
  const mount = document.getElementById('app');
  mount.innerHTML='';
  const node = SCREENS[screen]();
  mount.appendChild(node);
  // highlight tab
  $$('.tabs button').forEach(b=> b.classList.toggle('active', b.dataset.screen===screen));
}

$$('.tabs button').forEach(btn => {
  btn.addEventListener('click', ()=> render(btn.dataset.screen));
});

// PWA service worker
if('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js')); }

render();
