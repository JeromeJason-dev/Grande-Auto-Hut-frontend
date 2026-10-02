# Grande Auto Hut - Frontend

A modern, responsive e-commerce frontend interface built for **Grande Auto Hut**, an automotive spare parts platform tailored for the Kenyan market. This application empowers users to seamlessly search for auto parts, filter components using an intelligent **Vehicle Fitment Finder**, manage shopping carts, and securely execute checkout via **M-Pesa (Daraja STK Push)**.

This is all backed by a Django REST API.

> **Backend repository:** [grande-auto-hut-backend](https://github.com/JeromeJason-dev/grande-auto-hut-backend)


## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Connecting to the Backend](#connecting-to-the-backend)
- [Working with UI Components](#working-with-ui-components)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Grande Auto Hut is split into two repositories:

| Repository | Purpose |
| --- | --- |
| **Frontend** (this repo) | React single-page application: the storefront and user interface |
| **Backend** | Django API that handles accounts, catalog, orders, payments and more |

This repository contains only the user-facing application. It talks to the backend over HTTP and holds no business data of its own.

## Features

The backend is organized into the modules below, and the frontend is built to consume them:

- **Accounts:** registration, login and user profiles
- **Admin:** the one who controls and manages the system
- **Catalog:** browse and search auto parts and categories
- **Fitment:** check that a part is compatible with a specific vehicle
- **Inventory:** live stock availability
- **Orders:** cart, checkout and order history
- **Payments:** secure online payment flow
- **Reviews:** customer ratings and feedback on products
- **Notifications:** order and account updates
- **Support:** customer help and enquiries
- **Wishlist:** store products that interest the customer for later purchase


## Tech Stack
 
| Area | Technology |
| --- | --- |
| Framework | [React](https://react.dev/) |
| Build tool | [Vite](https://vitejs.dev/) with Hot Module Replacement |
| Routing | [React Router](https://reactrouter.com/) for client-side navigation between pages |
| Styling | [Tailwind CSS](https://tailwindcss.com/) utility-first styling |
| UI components | [shadcn/ui](https://ui.shadcn.com/) (configured via `components.json`) |
| HTTP client | [Axios](https://axios-http.com/) for communicating with the backend API |
| Linting | [ESLint](https://eslint.org/) (`eslint.config.js`) |
| Language | JavaScript (JSX), with `@/` path aliases set up in `jsconfig.json` |
| Package manager | npm |

## Project Structure
 
```
Grande-Auto-Hut-frontend/
├── public/
│   └── grande_auto_hut_shop.jpg      # Static assets served as-is
│
├── src/
│   ├── main.jsx                      # App entry: mounts providers (Query, Router, Theme, Auth, Cart)
│   ├── App.jsx                       # Route definitions (public, customer, admin)
│   ├── index.css                     # Global styles and Tailwind setup
│   ├── utils.js                      # Shared helper functions
│   │
│   ├── api/                          # One module per backend resource
│   │   ├── client.js                 # Axios instance, auth header and token refresh logic
│   │   ├── auth.js
│   │   ├── catalog.js
│   │   ├── productVariants.js
│   │   ├── groupProducts.js
│   │   ├── conditions.js
│   │   ├── fitment.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── wishlist.js
│   │   ├── reviews.js
│   │   ├── notifications.js
│   │   ├── support.js
│   │   └── admin.js
│   │
│   ├── assets/                       # Images bundled by Vite
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/                   # Reusable UI building blocks
│   │   ├── Layout.jsx                # Shared page shell for public/customer pages
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx        # Guards routes (login required, optional staffOnly)
│   │   ├── ProductCard.jsx
│   │   ├── Price.jsx
│   │   ├── StockBadge.jsx
│   │   ├── OrderStatusBadge.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Spinner.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorAlert.jsx
│   │
│   ├── context/
│   │   └── ThemeContext.jsx          # Light/dark theme state
│   │
│   ├── features/                     # Feature modules (pages + related state)
│   │   ├── auth/                     # AuthContext, LoginPage, RegisterPage
│   │   ├── account/                  # AccountPage
│   │   ├── catalog/                  # CatalogPage, ProductDetailPage
│   │   ├── fitment/                  # FitmentPage, FitmentFinder, FitmentResultsPage
│   │   ├── cart/                     # CartContext, CartPage, CheckoutPage
│   │   ├── orders/                   # OrdersListPage, OrderDetailPage
│   │   ├── wishlist/                 # WishlistPage
│   │   ├── support/                  # TicketsPage, NewTicketPage, TicketDetailPage
│   │   ├── notifications/            # Context, hook, page, Toast and ToastContainer
│   │   └── admin/                    # AdminLayout plus Dashboard, Products, Orders,
│   │                                 # Customers, Tickets, Fitment and Account pages
│   │
│   └── routes/                       # Standalone top-level pages
│       ├── HomePage.jsx
│       ├── AboutPage.jsx
│       └── NotFoundPage.jsx
│
├── components.json                   # shadcn/ui configuration
├── eslint.config.js                  # ESLint rules
├── index.html                        # HTML entry point
├── jsconfig.json                     # "@/*" path alias for editors
├── vite.config.js                    # Vite config (React + Tailwind plugins, alias)
├── vercel.json                       # SPA rewrite rule for Vercel deployment
├── package.json                      # Dependencies and scripts
└── package-lock.json                 # Locked dependency versions
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (bundled with Node.js)
- The [backend](https://github.com/JeromeJason-dev/grande-auto-hut-backend) running locally or a deployed API URL

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JeromeJason-dev/Grande-Auto-Hut-frontend.git
   cd Grande-Auto-Hut-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables** (see the next section)

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Vite will print a local URL, usually `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the project root. Vite only exposes variables prefixed with `VITE_`.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```


Never commit `.env` files or secret keys to version control.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reloading |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Connecting to the Backend

1. Clone and run the backend by following its README (a Django project with a `requirements.txt` and `manage.py`).
2. Start it locally, which by default is at `http://127.0.0.1:8000`.
3. Point `VITE_API_BASE_URL` at that address.
4. Make sure the backend allows requests from the frontend's origin (CORS settings), for example `http://localhost:5173`.

## Working with UI Components

This project uses **shadcn/ui**. Components are copied into the codebase rather than installed as a dependency, so you can customize them freely. To add a new one:

```bash
npx shadcn@latest add button
```

Replace `button` with any component name from the shadcn/ui library. Configuration lives in `components.json`.

## Deployment

Build the app and serve the generated `dist/` folder from any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or your own server):

```bash
npm run build
```

Set `VITE_API_BASE_URL` in your hosting platform to the production backend URL. If you use client-side routing, configure the host to redirect all routes to `index.html`.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request

Please run `npm run lint` before submitting.

## License

This repository is licensed by the MIT license.


Built by [JeromeJason-dev](https://github.com/JeromeJason-dev).