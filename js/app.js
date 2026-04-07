// ── App State ──
const App = {
  page: 'dashboard',
  filters: { month: 'all', category: 'all', region: 'all', status: 'all' },
  charts: {},

  init() {
    this.bindNav();
    this.bindFilters();
    this.navigate('dashboard');
    this.setupSearch();
  },

  navigate(page) {
    this.page = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(el => {
      el.classList.toggle('active', el.id === 'page-' + page);
    });
    const titles = {
      dashboard: { t: 'Overview', s: 'FY 2024 performance summary' },
      orders: { t: 'Orders', s: 'Transaction history & fulfillment' },
      products: { t: 'Products', s: 'Inventory & performance' },
      analytics: { t: 'Analytics', s: 'Deep dive & trend analysis' },
      regions: { t: 'Regions', s: 'Geographic breakdown' },
    };
    const ti = titles[page] || { t: page, s: '' };
    document.getElementById('topbar-title').textContent = ti.t;
    document.getElementById('topbar-sub').textContent = ti.s;
    this.renderPage(page);
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.page));
    });
  },

  bindFilters() {
    ['filterMonth', 'filterCat', 'filterRegion'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        this.filters.month = document.getElementById('filterMonth').value;
        this.filters.category = document.getElementById('filterCat').value;
        this.filters.region = document.getElementById('filterRegion').value;
        this.renderPage(this.page);
      });
    });
  },

  setupSearch() {
    const inp = document.getElementById('searchInput');
    if (!inp) return;
    inp.addEventListener('input', () => {
      if (this.page === 'orders') this.renderOrders();
      if (this.page === 'products') this.renderProducts();
    });
  },

  renderPage(page) {
    const fns = {
      dashboard: () => this.renderDashboard(),
      orders: () => this.renderOrders(),
      products: () => this.renderProducts(),
      analytics: () => this.renderAnalytics(),
      regions: () => this.renderRegions(),
    };
    if (fns[page]) fns[page]();
  },

  // ── Dashboard ──
  renderDashboard() {
    const orders = RetailData.filterOrders(this.filters);
    const kpis = RetailData.getKPIs(orders);
    const trend = RetailData.getMonthlyTrend();

    // KPIs
    setHTML('kpi-revenue', fmt.currency(kpis.revenue));
    setHTML('kpi-orders', fmt.number(kpis.orders));
    setHTML('kpi-aov', fmt.currency(kpis.aov));
    setHTML('kpi-profit', fmt.currency(kpis.profit));
    setHTML('kpi-margin', kpis.margin.toFixed(1) + '%');
    setHTML('kpi-return', kpis.returnRate.toFixed(1) + '%');

    // Revenue trend chart
    this.renderRevenueChart(trend);

    // Category donut
    const cats = RetailData.getCategorySales(orders);
    this.renderCategoryDonut(cats);

    // Top products
    this.renderTopProducts(orders);

    // Recent orders
    this.renderRecentOrders(orders.slice(0, 8));

    // Order status breakdown
    const statusBreak = RetailData.getOrderStatusBreakdown(orders);
    this.renderStatusBars(statusBreak, orders.length);
  },

  renderRevenueChart(trend) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    if (this.charts.revenue) this.charts.revenue.destroy();
    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: '2024',
            data: trend.revenue2024,
            backgroundColor: 'rgba(59,130,246,0.85)',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: '2023',
            data: trend.revenue2023,
            backgroundColor: 'rgba(59,130,246,0.2)',
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e2330',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#8b93a8',
            bodyColor: '#f0f2f7',
            callbacks: { label: ctx => ' ' + fmt.currency(ctx.raw) }
          }
        },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 11 }, autoSkip: false }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#555e72', font: { size: 11 }, callback: v => '$' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } }
        }
      }
    });
  },

  renderCategoryDonut(cats) {
    const ctx = document.getElementById('categoryDonut');
    if (!ctx) return;
    if (this.charts.donut) this.charts.donut.destroy();
    const total = cats.reduce((s, c) => s + c.revenue, 0);
    const el = document.getElementById('donut-center-val');
    if (el) el.textContent = fmt.currency(total);

    this.charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.cat),
        datasets: [{
          data: cats.map(c => c.revenue),
          backgroundColor: cats.map(c => c.color),
          borderWidth: 2,
          borderColor: '#111318',
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e2330',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#8b93a8',
            bodyColor: '#f0f2f7',
            callbacks: {
              label: ctx => {
                const pct = total ? (ctx.raw / total * 100).toFixed(1) : 0;
                return ` ${fmt.currency(ctx.raw)} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // Legend
    const legEl = document.getElementById('catLegend');
    if (legEl) {
      legEl.innerHTML = cats.map(c => {
        const pct = total ? (c.revenue / total * 100).toFixed(1) : 0;
        return `<div class="rank-item">
          <span class="rank-num" style="color:${c.color};">${c.icon}</span>
          <span class="rank-label">${c.cat}</span>
          <div class="rank-bar-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${c.color}"></div></div></div>
          <span class="rank-val">${pct}%</span>
        </div>`;
      }).join('');
    }
  },

  renderTopProducts(orders) {
    const prods = RetailData.getTopProducts(orders, 6);
    const el = document.getElementById('topProductsList');
    if (!el) return;
    const max = prods[0]?.revenue || 1;
    el.innerHTML = prods.map((p, i) => `
      <div class="rank-item fade-up delay-${i + 1}">
        <span class="rank-num">${i + 1}</span>
        <span class="rank-label">${p.name}<br><span style="font-size:10px;color:var(--text3)">${p.units} units</span></span>
        <div class="rank-bar-wrap"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(p.revenue / max * 100)}%;background:var(--accent)"></div></div></div>
        <span class="rank-val">${fmt.compact(p.revenue)}</span>
      </div>`).join('');
  },

  renderRecentOrders(orders) {
    const el = document.getElementById('recentOrdersTable');
    if (!el) return;
    el.innerHTML = orders.map(o => `
      <tr>
        <td style="color:var(--text);font-family:var(--mono)">${o.id}</td>
        <td style="color:var(--text)">${o.customer}</td>
        <td>${o.product}</td>
        <td>${fmt.date(o.date)}</td>
        <td style="color:var(--text);text-align:right">${fmt.currency(o.revenue)}</td>
        <td style="text-align:right"><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      </tr>`).join('');
  },

  renderStatusBars(statusBreak, total) {
    const el = document.getElementById('statusBars');
    if (!el) return;
    const colors = { Delivered: 'var(--green)', Shipped: 'var(--accent)', Processing: 'var(--amber)', Returned: 'var(--red)' };
    el.innerHTML = Object.entries(statusBreak).map(([s, count]) => {
      const pct = total ? (count / total * 100).toFixed(1) : 0;
      return `<div class="stat-row">
        <span style="font-size:12px;color:var(--text)">${s}</span>
        <div style="flex:1;margin:0 12px"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${colors[s]}"></div></div></div>
        <span style="font-size:12px;color:var(--text2);font-family:var(--mono);min-width:60px;text-align:right">${fmt.number(count)} <span style="color:var(--text3)">(${pct}%)</span></span>
      </div>`;
    }).join('');
  },

  // ── Orders ──
  renderOrders() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    let orders = RetailData.filterOrders(this.filters);
    if (search) orders = orders.filter(o =>
      o.id.includes(search) || o.customer.toLowerCase().includes(search) ||
      o.product.toLowerCase().includes(search) || o.category.toLowerCase().includes(search)
    );

    const kpis = RetailData.getKPIs(orders);
    setHTML('ord-kpi-count', fmt.number(orders.length));
    setHTML('ord-kpi-revenue', fmt.currency(kpis.revenue));
    setHTML('ord-kpi-aov', fmt.currency(kpis.aov));
    setHTML('ord-kpi-return', kpis.returnRate.toFixed(1) + '%');

    const el = document.getElementById('ordersTableBody');
    if (!el) return;
    const shown = orders.slice(0, 100);
    if (!shown.length) {
      el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text3)">No orders match your filters</td></tr>';
      return;
    }
    el.innerHTML = shown.map(o => `
      <tr>
        <td style="color:var(--text);font-family:var(--mono);font-size:11px">${o.id}</td>
        <td style="color:var(--text)">${o.customer}</td>
        <td>${o.product}</td>
        <td>${o.category}</td>
        <td>${o.region}</td>
        <td>${fmt.date(o.date)}</td>
        <td style="color:var(--text);text-align:right">${fmt.currency(o.revenue)}</td>
        <td style="text-align:right"><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      </tr>`).join('');
    setHTML('orders-count', `Showing ${shown.length} of ${fmt.number(orders.length)} orders`);
  },

  // ── Products ──
  renderProducts() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterCat = this.filters.category;
    const orders = RetailData.filterOrders(this.filters);
    const topProds = RetailData.getTopProducts(orders, 50);
    const topMap = {};
    topProds.forEach(p => topMap[p.name] = p);

    let products = RetailData.PRODUCTS.filter(p => {
      if (filterCat !== 'all' && p.cat !== filterCat) return false;
      if (search && !p.name.toLowerCase().includes(search) && !p.cat.toLowerCase().includes(search)) return false;
      return true;
    });

    const el = document.getElementById('productsGrid');
    if (!el) return;
    el.innerHTML = products.map(p => {
      const perf = topMap[p.name];
      const rev = perf ? perf.revenue : 0;
      const units = perf ? perf.units : 0;
      const margin = ((p.price - p.cost) / p.price * 100).toFixed(0);
      const catColor = RetailData.CAT_COLORS[RetailData.CATEGORIES.indexOf(p.cat)] || '#555';
      const stockClass = p.stock < 50 ? 'var(--red)' : p.stock < 150 ? 'var(--amber)' : 'var(--green)';
      return `<div class="product-card fade-up">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <span style="font-size:10px;color:${catColor};background:${catColor}22;padding:2px 8px;border-radius:20px">${p.cat}</span>
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${p.id}</span>
        </div>
        <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:12px;line-height:1.3">${p.name}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div><div style="font-size:10px;color:var(--text3);margin-bottom:2px">Price</div><div style="font-size:14px;font-weight:600">${fmt.currency(p.price)}</div></div>
          <div><div style="font-size:10px;color:var(--text3);margin-bottom:2px">Margin</div><div style="font-size:14px;font-weight:600;color:var(--green)">${margin}%</div></div>
          <div><div style="font-size:10px;color:var(--text3);margin-bottom:2px">Revenue</div><div style="font-size:13px;font-weight:500">${fmt.compact(rev)}</div></div>
          <div><div style="font-size:10px;color:var(--text3);margin-bottom:2px">Units sold</div><div style="font-size:13px;font-weight:500">${fmt.number(units)}</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10px;color:${stockClass}">● ${p.stock} in stock</span>
          <span style="font-size:10px;color:var(--text3)">Cost: ${fmt.currency(p.cost)}</span>
        </div>
      </div>`;
    }).join('');
    setHTML('products-count', `${products.length} products`);
  },

  // ── Analytics ──
  renderAnalytics() {
    const orders = RetailData.filterOrders(this.filters);
    const trend = RetailData.getMonthlyTrend();

    // Monthly profit vs revenue line chart
    const monthly2024 = trend.revenue2024;
    const profitData = monthly2024.map(r => Math.round(r * 0.312));

    this.renderLineChart('analyticsLineChart', {
      labels: RetailData.MONTHS_LABEL,
      datasets: [
        { label: 'Revenue', data: monthly2024, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 3 },
        { label: 'Profit', data: profitData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.4, pointRadius: 3 },
        { label: 'Prior year', data: trend.revenue2023, borderColor: '#555e72', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 2, borderDash: [4,3] },
      ]
    });

    // Avg order value by month
    const aovData = RetailData.MONTHS_LABEL.map((_, m) => {
      const mo = RetailData.filterOrders({ month: m.toString() });
      const k = RetailData.getKPIs(mo);
      return Math.round(k.aov);
    });
    this.renderBarChartSimple('aovChart', RetailData.MONTHS_LABEL, aovData, '#8b5cf6');

    // Category revenue horizontal bar
    const cats = RetailData.getCategorySales(orders);
    this.renderHorizBar('catRevenueChart', cats.map(c => c.cat), cats.map(c => c.revenue), cats.map(c => c.color));

    // Weekly orders sparkline data in text
    const statusBreak = RetailData.getOrderStatusBreakdown(orders);
    const total = orders.length;
    const statsEl = document.getElementById('analyticsStats');
    if (statsEl) {
      const items = [
        { label: 'Total orders', val: fmt.number(total), color: 'var(--text)' },
        { label: 'Delivered', val: `${statusBreak.Delivered} (${total ? (statusBreak.Delivered/total*100).toFixed(0) : 0}%)`, color: 'var(--green)' },
        { label: 'In transit', val: fmt.number(statusBreak.Shipped), color: 'var(--accent)' },
        { label: 'Processing', val: fmt.number(statusBreak.Processing), color: 'var(--amber)' },
        { label: 'Returned', val: fmt.number(statusBreak.Returned), color: 'var(--red)' },
        { label: 'Gross margin', val: RetailData.getKPIs(orders).margin.toFixed(1) + '%', color: 'var(--green)' },
      ];
      statsEl.innerHTML = items.map(it => `
        <div class="stat-row">
          <span style="font-size:12px;color:var(--text2)">${it.label}</span>
          <span style="font-size:13px;font-weight:500;color:${it.color};font-family:var(--mono)">${it.val}</span>
        </div>`).join('');
    }
  },

  renderLineChart(id, data) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (this.charts[id]) this.charts[id].destroy();
    this.charts[id] = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e2330', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#8b93a8', bodyColor: '#f0f2f7', callbacks: { label: ctx => ' ' + fmt.currency(ctx.raw) } }
        },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 11 } }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#555e72', font: { size: 11 }, callback: v => '$' + (v/1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } }
        }
      }
    });
  },

  renderBarChartSimple(id, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (this.charts[id]) this.charts[id].destroy();
    this.charts[id] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: color + 'cc', borderRadius: 4, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2330', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#8b93a8', bodyColor: '#f0f2f7', callbacks: { label: ctx => ' $' + ctx.raw } } },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 11 } }, grid: { display: false }, border: { display: false } },
          y: { ticks: { color: '#555e72', font: { size: 11 }, callback: v => '$' + v }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } }
        }
      }
    });
  },

  renderHorizBar(id, labels, data, colors) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (this.charts[id]) this.charts[id].destroy();
    this.charts[id] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }] },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2330', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#8b93a8', bodyColor: '#f0f2f7', callbacks: { label: ctx => ' ' + fmt.currency(ctx.raw) } } },
        scales: {
          x: { ticks: { color: '#555e72', font: { size: 11 }, callback: v => '$' + (v/1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
          y: { ticks: { color: '#f0f2f7', font: { size: 11 } }, grid: { display: false }, border: { display: false } }
        }
      }
    });
  },

  // ── Regions ──
  renderRegions() {
    const orders = RetailData.filterOrders(this.filters);
    const regions = RetailData.getRegionSales(orders);
    const total = regions.reduce((s, r) => s + r.revenue, 0);
    const maxRev = regions[0]?.revenue || 1;

    const el = document.getElementById('regionsList');
    if (el) {
      el.innerHTML = regions.map((r, i) => {
        const pct = total ? (r.revenue / total * 100).toFixed(1) : 0;
        const aov = r.orders ? (r.revenue / r.orders).toFixed(0) : 0;
        return `<div class="stat-row fade-up delay-${Math.min(i+1,6)}">
          <div style="width:130px">
            <div style="font-size:13px;font-weight:500;color:var(--text)">${r.region}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${fmt.number(r.orders)} orders · AOV $${aov}</div>
          </div>
          <div style="flex:1;margin:0 16px">
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(r.revenue/maxRev*100)}%;background:var(--accent)"></div></div>
          </div>
          <div style="text-align:right;min-width:90px">
            <div style="font-size:13px;font-weight:500;color:var(--text)">${fmt.currency(r.revenue)}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${pct}% of total</div>
          </div>
        </div>`;
      }).join('');
    }

    // Horizontal bar chart for regions
    this.renderHorizBar('regionsChart', regions.map(r => r.region), regions.map(r => r.revenue),
      ['#3b82f6','#06b6d4','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899','#6366f1']);

    // KPIs for regions
    const kpis = RetailData.getKPIs(orders);
    setHTML('reg-kpi-revenue', fmt.currency(kpis.revenue));
    setHTML('reg-kpi-orders', fmt.number(kpis.orders));
    setHTML('reg-kpi-regions', regions.filter(r => r.revenue > 0).length);
    setHTML('reg-kpi-top', regions[0]?.region || '—');
  },
};

// ── Formatters ──
const fmt = {
  currency: v => '$' + Math.round(v).toLocaleString(),
  number: v => Math.round(v).toLocaleString(),
  compact: v => v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v),
  pct: v => v.toFixed(1) + '%',
  date: d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
};

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ── Export CSV ──
function exportCSV() {
  const orders = RetailData.filterOrders(App.filters);
  const headers = ['ID', 'Date', 'Customer', 'Product', 'Category', 'Region', 'Qty', 'Revenue', 'Profit', 'Status'];
  const rows = orders.map(o => [o.id, o.date.toLocaleDateString(), o.customer, o.product, o.category, o.region, o.qty, o.revenue, o.profit, o.status]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'retail-orders.csv';
  a.click();
  showToast('CSV exported successfully');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function resetFilters() {
  ['filterMonth', 'filterCat', 'filterRegion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'all';
  });
  App.filters = { month: 'all', category: 'all', region: 'all', status: 'all' };
  App.renderPage(App.page);
  showToast('Filters reset');
}

document.addEventListener('DOMContentLoaded', () => App.init());
