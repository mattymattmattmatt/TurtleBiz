(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const store = window.TurtleStore;
  const email = 'guihlemturtlebiz@gmail.com';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let toastTimer;
  const toast = message => {
    const el = $('.toast');
    clearTimeout(toastTimer);
    el.textContent = message;
    el.classList.add('visible');
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
  };
  window.turtleToast = toast;
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotion = () => {
    const paused = motionMedia.matches || store.read('turtlebiz:motion:v1') === true;
    document.documentElement.classList.toggle('motion-paused', paused);
    $$('[data-motion]').forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = motionMedia.matches ? 'Reduced motion on' : paused ? 'Resume motion' : 'Pause motion';
    });
    window.dispatchEvent(new CustomEvent('turtlebiz:motion', { detail: paused }));
  };
  $$('[data-motion]').forEach(button => button.addEventListener('click', () => {
    if (motionMedia.matches) { toast('Following your device’s reduced-motion setting.'); return; }
    store.write('turtlebiz:motion:v1', !document.documentElement.classList.contains('motion-paused'));
    applyMotion();
  }));
  motionMedia.addEventListener('change', applyMotion);
  applyMotion();
  const menu = $('.menu-toggle'), nav = $('#main-nav');
  const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  const dialog = $('#product-dialog');
  const closeDialog = () => dialog.close();
  $('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  function preview(id) {
    const p = store.byId.get(id);
    if (!p) return;
    $('#dialog-content').innerHTML = '<div class="dialog-layout"><img src="' + encodeURI(p.image) + '" alt="' + escape(p.name) + '" width="1024" height="1024"><div class="dialog-copy"><span class="eyebrow">' + escape(p.category) + '</span><h2 id="dialog-title">' + escape(p.name) + '</h2><p>' + escape(p.description) + '</p><p class="dialog-price">' + store.money(p.cents) + ' <small>AUD</small></p><button class="button" data-add="' + p.id + '">Add to your bag <span aria-hidden="true">+</span></button><p class="small">Availability and delivery confirmed by email. Add your favourites, then enquire from your bag.</p><a class="text-link" href="cart.html">View your bag →</a><p id="dialog-status" class="small" role="status"></p></div></div>';
    dialog.showModal();
  }
  document.addEventListener('click', event => {
    const add = event.target.closest('[data-add]');
    const save = event.target.closest('[data-save]');
    const view = event.target.closest('[data-preview]');
    if (add) {
      const p = store.byId.get(add.dataset.add);
      if (!p) return;
      const added = store.add(p.id);
      if (added && dialog.open) { const status = $('#dialog-status'); if (status) status.textContent = p.name + ' added to your bag.'; }
      toast(added ? p.name + ' added to your bag.' + (store.storageAvailable ? '' : ' Saved for this visit only.') : 'That item has reached the 99-item limit.');
    } else if (save) {
      const id = save.dataset.save; store.toggleSaved(id);
      toast(store.saved.includes(id) ? 'Saved to your favourites.' : 'Removed from your favourites.');
    } else if (view) preview(view.dataset.preview);
  });
  const originalCards = $$('#shop-grid [data-product-card]');
  let activeFilter = 'All';
  function filterProducts() {
    if (!$('#shop-grid')) return;
    const search = $('#product-search').value.trim().toLowerCase();
    const order = $('#product-sort').value;
    const cards = [...originalCards].sort((a, b) => {
      const pa = store.byId.get(a.dataset.id), pb = store.byId.get(b.dataset.id);
      if (order === 'price-low') return pa.cents - pb.cents;
      if (order === 'price-high') return pb.cents - pa.cents;
      if (order === 'name') return pa.name.localeCompare(pb.name);
      return originalCards.indexOf(a) - originalCards.indexOf(b);
    });
    let count = 0;
    cards.forEach(card => {
      const p = store.byId.get(card.dataset.id);
      const categoryMatches = activeFilter === 'All' || activeFilter === p.category || (activeFilter === 'Saved' && store.saved.includes(p.id));
      const visible = categoryMatches && (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(search);
      card.hidden = !visible;
      if (visible) count++;
      $('#shop-grid').appendChild(card);
    });
    $('#results-count').textContent = count + (count === 1 ? ' thing to make your day.' : ' things to make your day.');
    $('#shop-empty').hidden = count > 0;
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    $$('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    filterProducts();
  }));
  $('#product-search')?.addEventListener('input', filterProducts);
  $('#product-sort')?.addEventListener('change', filterProducts);
  $('#reset-filters')?.addEventListener('click', () => {
    $('#product-search').value = ''; $('#product-sort').value = 'featured';
    $('[data-filter="All"]').click(); $('#product-search').focus();
  });
  function orderText() {
    return 'Hello Turtle Biz,\n\nI would like to enquire about:\n\n' +
      store.cart.map(p => p.quantity + ' × ' + p.name + ' — ' + store.money(p.cents * p.quantity) + ' AUD').join('\n') +
      '\n\nItem subtotal: ' + store.money(store.subtotal) + ' AUD\n\nPlease confirm availability, delivery costs and how to order.\n\nDelivery suburb / postcode:\nName:\n';
  }
  function renderCart() {
    const container = $('#cart-items');
    if (!container) return;
    const focused = document.activeElement;
    const focusId = focused?.dataset?.qtyId || focused?.dataset?.remove;
    const focusAction = focused?.dataset?.qty;
    container.innerHTML = store.cart.length ? store.cart.map(p => '<article class="cart-item"><img src="' + encodeURI(p.image) + '" alt="' + escape(p.name) + '" width="100" height="116"><div><h3>' + escape(p.name) + '</h3><p class="item-price">' + store.money(p.cents) + ' AUD each</p><div class="quantity-control"><button data-qty="-1" data-qty-id="' + p.id + '" aria-label="Decrease quantity of ' + escape(p.name) + '">−</button><span>' + p.quantity + '</span><button data-qty="1" data-qty-id="' + p.id + '" aria-label="Increase quantity of ' + escape(p.name) + '"' + (p.quantity >= 99 ? ' disabled' : '') + '>+</button></div><button class="remove-item" data-remove="' + p.id + '" aria-label="Remove ' + escape(p.name) + '">Remove</button></div><strong class="item-total">' + store.money(p.cents * p.quantity) + '</strong></article>').join('') : '<div class="empty-state"><h2>Your bag is taking it easy.</h2><p>Let’s find it a little company.</p><a class="button" href="shop.html">Explore the collection →</a></div>';
    $('#cart-total').textContent = store.money(store.subtotal);
    const enquiry = $('#order-enquiry');
    enquiry.href = store.cart.length ? 'mailto:' + email + '?subject=' + encodeURIComponent('Turtle Biz order enquiry') + '&body=' + encodeURIComponent(orderText()) : 'shop.html';
    enquiry.innerHTML = store.cart.length ? 'Enquire about your bag <span aria-hidden="true">↗</span>' : 'Explore the collection <span aria-hidden="true">→</span>';
    $('#copy-order').disabled = !store.cart.length;
    $('#order-text').value = store.cart.length ? orderText() : '';
    if (focusId) {
      const replacement = container.querySelector(focusAction ? '[data-qty-id="' + focusId + '"][data-qty="' + focusAction + '"]' : '[data-remove="' + focusId + '"]');
      (replacement || container.querySelector('button') || container.querySelector('a'))?.focus({ preventScroll: true });
    }
  }
  function refresh() {
    $$('[data-cart-count]').forEach(el => el.textContent = store.count);
    $$('[data-save]').forEach(button => {
      const p = store.byId.get(button.dataset.save);
      const saved = store.saved.includes(button.dataset.save);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', (saved ? 'Unsave ' : 'Save ') + p.name);
    });
    renderCart(); filterProducts();
  }
  window.addEventListener('turtlebiz:change', refresh);
  window.addEventListener('storage', event => { if (event.key === 'turtlebiz:motion:v1' || event.key === null) applyMotion(); });
  document.addEventListener('click', event => {
    const qty = event.target.closest('[data-qty]');
    const remove = event.target.closest('[data-remove]');
    if (qty) {
      const p = store.cart.find(p => p.id === qty.dataset.qtyId);
      if (p) { store.quantity(p.id, p.quantity + Number(qty.dataset.qty)); toast('Bag updated. Subtotal ' + store.money(store.subtotal) + ' AUD.'); }
    } else if (remove) { store.quantity(remove.dataset.remove, 0); toast('Item removed from your bag.'); }
  });
  $('#copy-order')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(orderText()); $('#order-copy-status').textContent = 'Copied. Paste these details into an email to ' + email + '.'; }
    catch { const field = $('#order-text'); field.hidden = false; field.focus(); field.select(); $('#order-copy-status').textContent = 'Select and copy the details below, then paste them into your email.'; }
  });
  $('#copy-email')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email); toast('Email address copied.'); }
    catch { toast(email); }
  });
  $('#contact-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#contact-name').value.trim(), message = $('#contact-message').value.trim();
    if (!name || !message) { $('#contact-status').textContent = 'Please add your name and message.'; (!name ? $('#contact-name') : $('#contact-message')).focus(); return; }
    const reply = $('#contact-email').value.trim();
    const body = message + '\n\nKind regards,\n' + name + (reply ? '\nReply email: ' + reply : '');
    $('#contact-status').textContent = 'Your email draft is ready. If your email app doesn’t open, send your message to ' + email + '.';
    location.href = 'mailto:' + email + '?subject=' + encodeURIComponent($('#contact-subject').value) + '&body=' + encodeURIComponent(body);
  });
  const audio = $('#radio-audio');
  if (audio) {
    const tracks = ['audio/Turtle Biz Remix.mp3', 'audio/The Turtles (Turtle Biz).mp3', 'audio/TurtleBiz.mp3'];
    const play = $('#radio-play'), seek = $('#radio-seek');
    const time = value => { if (!Number.isFinite(value)) return '0:00'; return Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0'); };
    let starting = false;
    audio.volume = 0.5;
    const update = () => {
      play.textContent = audio.paused ? '▶' : 'Ⅱ';
      play.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music');
      play.setAttribute('aria-pressed', String(!audio.paused));
      $('.radio-section').classList.toggle('is-playing', !audio.paused);
    };
    const start = async () => {
      if (starting) return;
      starting = true;
      try {
        if (!audio.getAttribute('src')) audio.src = encodeURI(tracks[Number($('#track-select').value)]);
        await audio.play();
        $('#radio-status').textContent = 'Playing ' + $('#track-select').selectedOptions[0].textContent;
      } catch { $('#radio-status').textContent = 'Music could not start. Please try play again.'; toast('Music could not start. Try play again.'); }
      finally { starting = false; update(); }
    };
    play.addEventListener('click', () => audio.paused ? start() : audio.pause());
    $('#track-select').addEventListener('change', () => {
      const wasPlaying = !audio.paused;
      audio.pause(); audio.src = encodeURI(tracks[Number($('#track-select').value)]);
      seek.value = 0; $('#radio-time').textContent = '0:00 / 0:00';
      if (wasPlaying) start();
    });
    $('#radio-volume').addEventListener('input', event => audio.volume = Number(event.target.value));
    audio.addEventListener('timeupdate', () => {
      seek.value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration * 100 : 0;
      $('#radio-time').textContent = time(audio.currentTime) + ' / ' + time(audio.duration);
    });
    seek.addEventListener('input', () => { if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 100 * audio.duration; });
    ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, update));
    audio.addEventListener('error', () => { $('#radio-status').textContent = 'This track is unavailable right now. Try another track.'; update(); });
  }
  // Make the original logo easter egg discoverable without hijacking navigation.
  let sequence = '';
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.key.length !== 1) return;
    sequence = (sequence + event.key.toLowerCase()).slice(-11);
    if (sequence.endsWith('howsthebiz')) { toast('The biz is good. Your next high score is waiting in the arcade.'); sequence = ''; }
  });
  refresh();
})();
