/* Catalog-backed state: never trust prices or markup from browser storage. */
(() => {
  'use strict';
  const catalog = window.TurtleCatalog;
  const byId = new Map(catalog.map(product => [product.id, product]));
  const CART = 'turtlebiz:cart:v2', SAVED = 'turtlebiz:saved:v1';
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  let storageAvailable = true;
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { storageAvailable = false; return false; }
  };
  const sanitize = value => {
    const clean = new Map();
    if (!Array.isArray(value)) return [];
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const product = byId.get(item.id) || catalog.find(p => p.name === item.name);
      const qty = Number(item.quantity);
      if (!product || !Number.isFinite(qty) || qty < 1) continue;
      clean.set(product.id, Math.min(99, (clean.get(product.id) || 0) + Math.floor(qty)));
    }
    return [...clean].map(([id, quantity]) => ({ id, quantity }));
  };
  const savedIds = value => Array.isArray(value) ? [...new Set(value.filter(id => byId.has(id)))] : [];
  // Only migrate when the new key is absent. Corruption must not resurrect an old bag.
  function initialCart() {
    try {
      const current = localStorage.getItem(CART);
      if (current !== null) {
        try { return sanitize(JSON.parse(current)); } catch { return []; }
      }
      return sanitize(read('cart'));
    } catch { return []; }
  }
  let cart = initialCart();
  let saved = savedIds(read(SAVED));
  if (cart.length) write(CART, cart);
  const notify = () => window.dispatchEvent(new Event('turtlebiz:change'));
  window.TurtleStore = Object.freeze({
    catalog, byId, read, write,
    get cart() { return cart.map(item => ({ ...byId.get(item.id), quantity: item.quantity })); },
    get saved() { return [...saved]; },
    get count() { return cart.reduce((sum, item) => sum + item.quantity, 0); },
    get subtotal() { return cart.reduce((sum, item) => sum + byId.get(item.id).cents * item.quantity, 0); },
    get storageAvailable() { return storageAvailable; },
    money(cents) { return '$' + (cents / 100).toFixed(2); },
    add(id) {
      if (!byId.has(id)) return false;
      const item = cart.find(item => item.id === id);
      if (item?.quantity === 99) return false;
      if (item) item.quantity++; else cart.push({ id, quantity: 1 });
      write(CART, cart); notify(); return true;
    },
    quantity(id, amount) {
      if (!Number.isFinite(amount)) return;
      cart = cart.map(item => item.id === id ? { id, quantity: Math.max(0, Math.min(99, Math.floor(amount))) } : item).filter(item => item.quantity > 0);
      write(CART, cart); notify();
    },
    toggleSaved(id) {
      if (!byId.has(id)) return;
      saved = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
      write(SAVED, saved); notify();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === CART || event.key === SAVED || event.key === null) {
      cart = sanitize(read(CART)); saved = savedIds(read(SAVED)); notify();
    }
  });
})();
