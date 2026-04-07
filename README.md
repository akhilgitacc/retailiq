# RetailIQ — Online Retail Analytics Dashboard

A full-featured, interactive analytics dashboard for an online retail business. Built as a portfolio project demonstrating data visualisation, frontend architecture, and UX design skills.

---

## Live Features

### Pages
- **Overview** — KPI cards, revenue vs prior year, category donut, top products, recent orders, fulfilment status
- **Orders** — Searchable, filterable full order history table with 3,400+ synthetic orders
- **Products** — Product catalogue grid with revenue, margin, stock level, and units sold per SKU
- **Analytics** — Revenue & profit trend lines, AOV by month, category revenue horizontal bar
- **Regions** — Regional performance breakdown with ranked bar chart and per-region stats

### Interactivity
- Global filters: Month, Category, Region — all charts and tables update live
- Search bar on Orders and Products pages
- Export to CSV — downloads filtered order data
- Toast notifications
- Hover states, smooth animations, staggered fade-in on page load

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla HTML5 + CSS3 + ES6 JavaScript |
| Charts | Chart.js 4.4 |
| Fonts | DM Sans + DM Mono (Google Fonts) |
| Data | Synthetic data engine (js/data.js) — no backend required |
| Build | Zero-dependency, open index.html directly |

---

## Project Structure

```
retail-dashboard/
├── index.html          # App shell, all page layouts
├── css/
│   └── style.css       # Design system, components, responsive
└── js/
    ├── data.js         # Retail data engine (products, orders, KPIs)
    └── app.js          # App logic, routing, chart rendering
```

---

## Data Model

The data engine (`js/data.js`) generates realistic retail data:

- **20 products** across 6 categories with price, cost, and stock levels
- **~3,400 orders** across 12 months with seasonal variation
- **30 customers** and **8 Indian cities** for regional data
- Derived metrics: revenue, profit, margin, AOV, return rate

---

## How to Run

Just open `index.html` in any modern browser. No server, no install, no build step.

```bash
# Option 1: open directly
open index.html

# Option 2: serve locally (for live reload during development)
npx serve .
# or
python3 -m http.server 8000
```

---

## Extending This Project

### Add a real backend
Replace `js/data.js` with API calls to a Node.js/Express or Python/FastAPI server connected to a real database (PostgreSQL recommended).

```javascript
// Replace synthetic data with API calls
const orders = await fetch('/api/orders?month=3&category=Electronics').then(r => r.json());
```

### Add authentication
Wrap the app in a login screen using JWT tokens or OAuth (e.g. Google Sign-In).

### Add more charts
Chart.js supports scatter, bubble, radar, and polar area — easy to extend the Analytics page.

### Deploy
- **Vercel / Netlify**: drag-and-drop the folder, get a live URL instantly
- **GitHub Pages**: push to a repo, enable Pages in settings

---

## Design Decisions

- **Dark theme**: Reduces eye strain for analyst workflows; looks premium in portfolio reviews
- **DM Sans + DM Mono**: Clean humanist sans for UI copy, monospace for IDs and numbers
- **Sidebar navigation**: Scales well to many pages; familiar to enterprise users
- **Synthetic data with seasonality**: Makes charts look real — higher Nov/Dec sales, lower Jan/Feb
- **CSS variables everywhere**: Easy to re-theme or switch to light mode

---

## Screenshots

Open the app and navigate through all 5 pages. The dashboard is fully responsive down to tablet width.

---

Built with plain HTML, CSS, and JavaScript. No frameworks, no bundlers — just clean, readable code.
