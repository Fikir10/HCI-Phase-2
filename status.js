/* Inventory Status screen placeholder. Replace this file with the real screen; keep App.screens.status = {render(root){...}}. Prefix classes with status-. */
App.screens.status={render(root){root.innerHTML="<div class=\"stub\"><h1 class=\"ttl\">Inventory Status</h1><p class=\"muted\">Under development</p></div>"}};

(() => {
  const num = n => +n.toFixed(2);
  const days = i => i.exp ? (new Date(i.exp) - new Date(Data.TODAY)) / 864e5 : 999;
  const CAT = { fridge: 'Fridge', pantry: 'Pantry', freezer: 'Freezer' };

  const expiryText = i => {
    const d = Math.round(days(i));
    if (d < 0) return `Expired ${-d} day${d === -1 ? '' : 's'} ago`;
    if (d === 0) return 'Expires today';
    if (d === 1) return 'Expires tomorrow';
    return `${d} days left`;
  };

  const itemCard = (i, type) => {
    const s = Data.status(i);
    const isExpiry = type === 'expiry';
    const d = days(i);
    const label = isExpiry ? expiryText(i) : s === 'out' ? 'Out of stock' : 'Low stock';
    const badge = isExpiry ? (d <= 0 ? 'expired' : 'expiring') : s;

    return `
      <button class="status-item" data-id="${i.id}">
        <span class="status-item-icon">${isExpiry ? '◷' : '!'}</span>
        <span class="status-item-info">
          <span class="status-item-name">${i.name}</span>
          <span class="status-item-location">${CAT[i.cat] || i.cat}</span>
        </span>
        <span class="status-item-right">
          <span class="status-item-qty">${num(i.qty)} ${i.unit}</span>
          <span class="status-badge ${badge}">${label}</span>
        </span>
        <span class="status-arrow">›</span>
      </button>`;
  };

  const section = (title, items, type, empty) => `
    <section class="status-section">
      <div class="status-section-heading">
        <h2>${title}</h2>
        <span class="status-count">${items.length}</span>
      </div>
      <div class="status-items">
        ${items.length
          ? items.map(i => itemCard(i, type)).join('')
          : `<p class="status-empty">${empty}</p>`}
      </div>
    </section>`;

  App.screens.status = {
    render(root) {
      const items = Data.inv();

      const expiring = items
        .filter(i => i.exp && i.qty > 0 && days(i) <= 3)
        .sort((a, b) => days(a) - days(b));

      const lowStock = items
        .filter(i => Data.status(i) !== 'ok')
        .sort((a, b) => (Data.status(a) === 'out' ? 0 : 1) -
                        (Data.status(b) === 'out' ? 0 : 1));

      const attention = new Set([...expiring, ...lowStock].map(i => i.id)).size;

      root.innerHTML = `
        <header class="status-header">
          <h1 class="ttl">Inventory Status</h1>
          <p class="status-subtitle">
            ${attention} ${attention === 1 ? 'item needs' : 'items need'} attention
          </p>
        </header>

        <div class="status-summary">
          <div class="status-summary-exp">
            <strong>${expiring.length}</strong>
            <span>Expiring Soon</span>
          </div>
          <div class="status-summary-low">
            <strong>${lowStock.length}</strong>
            <span>Low / Out of Stock</span>
          </div>
        </div>

        <div class="status-content">
          ${section('Expiring Soon', expiring, 'expiry', 'Nothing expiring soon!')}
          ${section('Low / Out of Stock', lowStock, 'stock', 'Everything is well stocked!')}
        </div>`;

      root.onclick = e => {
        const card = e.target.closest('.status-item');
        if (!card) return;
        App.screens.inventory.reveal(card.dataset.id);
        App.go('inventory');
      };
    }
  };
})();
