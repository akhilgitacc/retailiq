const RetailData = (() => {

  const CATEGORIES = ['Electronics', 'Clothing', 'Home & Garden', 'Beauty', 'Sports', 'Books'];
  const CAT_COLORS = ['#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'];
  const CAT_ICONS = ['⚡', '👗', '🏡', '✨', '🏃', '📚'];

  const PRODUCTS = [
    { id:'P001', name:'Wireless Pro Earbuds', cat:'Electronics', price:149, cost:52, stock:234 },
    { id:'P002', name:'Smart Watch Series X', cat:'Electronics', price:299, cost:98, stock:87 },
    { id:'P003', name:'4K Webcam Ultra', cat:'Electronics', price:119, cost:41, stock:156 },
    { id:'P004', name:'Mechanical Keyboard', cat:'Electronics', price:189, cost:67, stock:43 },
    { id:'P005', name:'Laptop Stand Pro', cat:'Electronics', price:79, cost:22, stock:312 },
    { id:'P006', name:'Premium Running Shoes', cat:'Sports', price:139, cost:48, stock:198 },
    { id:'P007', name:'Yoga Mat Elite', cat:'Sports', price:65, cost:18, stock:445 },
    { id:'P008', name:'Resistance Band Set', cat:'Sports', price:39, cost:9, stock:678 },
    { id:'P009', name:'Hydration Pack', cat:'Sports', price:89, cost:28, stock:123 },
    { id:'P010', name:'Linen Blazer', cat:'Clothing', price:129, cost:38, stock:67 },
    { id:'P011', name:'Merino Wool Sweater', cat:'Clothing', price:95, cost:31, stock:142 },
    { id:'P012', name:'Slim Chino Pants', cat:'Clothing', price:79, cost:24, stock:230 },
    { id:'P013', name:'Ceramic Coffee Maker', cat:'Home & Garden', price:210, cost:72, stock:54 },
    { id:'P014', name:'Air Purifier Compact', cat:'Home & Garden', price:189, cost:65, stock:78 },
    { id:'P015', name:'Bamboo Desk Organiser', cat:'Home & Garden', price:45, cost:12, stock:389 },
    { id:'P016', name:'Vitamin C Serum', cat:'Beauty', price:58, cost:14, stock:521 },
    { id:'P017', name:'Retinol Night Cream', cat:'Beauty', price:72, cost:19, stock:283 },
    { id:'P018', name:'Bestseller Novel Set', cat:'Books', price:42, cost:14, stock:167 },
    { id:'P019', name:'Business Strategy Pack', cat:'Books', price:55, cost:18, stock:92 },
    { id:'P020', name:'Noise-Cancel Headphones', cat:'Electronics', price:249, cost:84, stock:61 },
  ];

  const CUSTOMERS = [
    'Arjun Mehta','Priya Sharma','Ravi Patel','Sneha Reddy','Vikram Singh',
    'Ananya Iyer','Kiran Nair','Deepika Rao','Suresh Kumar','Pooja Gupta',
    'Amit Joshi','Kavya Menon','Rohit Verma','Divya Pillai','Arun Bose',
    'Shreya Agarwal','Rahul Desai','Nisha Kapoor','Tarun Malhotra','Lakshmi Venkat',
    'James Chen','Sarah Park','Michael Torres','Emma Wilson','Oliver Brown',
    'Fatima Al-Hassan','Yuki Tanaka','Carlos Rivera','Nina Kowalski','Ahmed Hassan',
  ];

  const REGIONS = ['Hyderabad','Mumbai','Bangalore','Delhi','Chennai','Kolkata','Pune','Ahmedabad'];

  // Seasonal multipliers per month
  const SEASONAL = [0.82, 0.78, 0.88, 0.91, 0.95, 0.97, 0.99, 1.02, 1.08, 1.12, 1.35, 1.62];

  // Generate deterministic pseudo-random based on seed
  function seededRand(seed) {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }

  function generateOrders() {
    const orders = [];
    let orderId = 8000;
    const statuses = ['Delivered','Delivered','Delivered','Shipped','Processing','Returned'];

    for (let month = 0; month < 12; month++) {
      const baseCount = Math.round(280 * SEASONAL[month]);
      for (let i = 0; i < baseCount; i++) {
        const seed = month * 10000 + i;
        const prodIdx = Math.floor(seededRand(seed) * PRODUCTS.length);
        const product = PRODUCTS[prodIdx];
        const qty = Math.floor(seededRand(seed + 1) * 3) + 1;
        const custIdx = Math.floor(seededRand(seed + 2) * CUSTOMERS.length);
        const regionIdx = Math.floor(seededRand(seed + 3) * REGIONS.length);
        const statusIdx = Math.floor(seededRand(seed + 4) * statuses.length);
        const day = Math.floor(seededRand(seed + 5) * 28) + 1;

        orders.push({
          id: '#' + (++orderId),
          date: new Date(2024, month, day),
          month,
          product: product.name,
          productId: product.id,
          category: product.cat,
          customer: CUSTOMERS[custIdx],
          region: REGIONS[regionIdx],
          qty,
          price: product.price,
          revenue: product.price * qty,
          cost: product.cost * qty,
          profit: (product.price - product.cost) * qty,
          status: statuses[statusIdx],
        });
      }
    }
    return orders.sort((a, b) => b.date - a.date);
  }

  const ALL_ORDERS = generateOrders();

  function getMonthlyRevenue(year = 2024) {
    return MONTHS_LABEL.map((_, m) => {
      return ALL_ORDERS
        .filter(o => o.month === m && o.status !== 'Returned')
        .reduce((sum, o) => sum + o.revenue, 0);
    });
  }

  function getPriorYearRevenue() {
    return MONTHS_LABEL.map((_, m) => {
      const base = ALL_ORDERS.filter(o => o.month === m && o.status !== 'Returned')
        .reduce((sum, o) => sum + o.revenue, 0);
      return Math.round(base * 0.78);
    });
  }

  const MONTHS_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function filterOrders({ month = 'all', category = 'all', region = 'all', status = 'all' } = {}) {
    return ALL_ORDERS.filter(o => {
      if (month !== 'all' && o.month !== parseInt(month)) return false;
      if (category !== 'all' && o.category !== category) return false;
      if (region !== 'all' && o.region !== region) return false;
      if (status !== 'all' && o.status !== status) return false;
      return true;
    });
  }

  function getKPIs(orders) {
    const active = orders.filter(o => o.status !== 'Returned');
    const revenue = active.reduce((s, o) => s + o.revenue, 0);
    const profit = active.reduce((s, o) => s + o.profit, 0);
    const returned = orders.filter(o => o.status === 'Returned').length;
    const aov = active.length ? revenue / active.length : 0;
    return {
      revenue,
      orders: orders.length,
      aov,
      profit,
      margin: revenue ? (profit / revenue * 100) : 0,
      returnRate: orders.length ? (returned / orders.length * 100) : 0,
    };
  }

  function getCategorySales(orders) {
    const map = {};
    CATEGORIES.forEach((c, i) => { map[c] = { cat: c, revenue: 0, orders: 0, color: CAT_COLORS[i], icon: CAT_ICONS[i] }; });
    orders.filter(o => o.status !== 'Returned').forEach(o => {
      if (map[o.category]) {
        map[o.category].revenue += o.revenue;
        map[o.category].orders++;
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  function getTopProducts(orders, limit = 8) {
    const map = {};
    orders.filter(o => o.status !== 'Returned').forEach(o => {
      if (!map[o.productId]) map[o.productId] = { name: o.product, cat: o.category, revenue: 0, units: 0 };
      map[o.productId].revenue += o.revenue;
      map[o.productId].units += o.qty;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }

  function getRegionSales(orders) {
    const map = {};
    REGIONS.forEach(r => { map[r] = { region: r, revenue: 0, orders: 0 }; });
    orders.filter(o => o.status !== 'Returned').forEach(o => {
      map[o.region].revenue += o.revenue;
      map[o.region].orders++;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  function getOrderStatusBreakdown(orders) {
    const map = { Delivered: 0, Shipped: 0, Processing: 0, Returned: 0 };
    orders.forEach(o => { if (map[o.status] !== undefined) map[o.status]++; });
    return map;
  }

  function getDailyRevenue(month) {
    const days = {};
    ALL_ORDERS.filter(o => o.month === parseInt(month) && o.status !== 'Returned').forEach(o => {
      const d = o.date.getDate();
      days[d] = (days[d] || 0) + o.revenue;
    });
    return Array.from({ length: 28 }, (_, i) => days[i + 1] || 0);
  }

  function getMonthlyTrend() {
    return {
      labels: MONTHS_LABEL,
      revenue2024: getMonthlyRevenue(),
      revenue2023: getPriorYearRevenue(),
    };
  }

  return {
    CATEGORIES, CAT_COLORS, CAT_ICONS, PRODUCTS, REGIONS, MONTHS_LABEL,
    ALL_ORDERS,
    filterOrders, getKPIs, getCategorySales, getTopProducts,
    getRegionSales, getOrderStatusBreakdown, getDailyRevenue, getMonthlyTrend,
  };
})();
