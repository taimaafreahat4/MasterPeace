# Stock Mind Seller Center — integrated prototype

Copy the files in this folder into your existing `seller/` folder. Keep your current `components/navbar.html`, `components/navbar.css`, `components/footer.html`, and `components/footer.css`.

## Pages
- `dashboard.html` / `dashboard.css` / `dashboard.js`
- `ai-advisor.html` / `ai-advisor.css` / `ai-advisor.js` (Before You Buy)
- `inventory.html` / `inventory.css` / `inventory.js`
- `recommendations.html` / `recommendations.css` / `recommendations.js`
- `marketplace.html` / `marketplace.css` / `marketplace.js`
- `add-product.html` / `seller.css` / `seller.js` (the listing wizard)
- `seller-tabs.css` and `seller-tabs.js` create one shared collapsible navigation strip; it is not a sidebar.
- `seller-data.js` contains sample data and browser storage helpers.

## Navigation curtain
The five-button bar sits beneath the existing main navbar. Once you click a tab, the bar collapses to a slim strip with an arrow. Click the strip to reopen it. The chosen collapsed/expanded state is saved in localStorage.

## Run
Use VS Code Live Server and open `seller/dashboard.html`. `fetch()` cannot reliably load the shared navbar/footer if you open files with `file://`.

## Marketplace and Category sync
Publishing from `add-product.html` saves the item to `sellerProducts` (to preserve the existing Category page integration) and to `stockMindMarketplaceListings` (used by the new Marketplace page). These are browser-local demo records. To make listings visible to multiple real users/devices, replace localStorage with a backend/database and API.

## Note about AI
The buying advisor results are a transparent illustrative heuristic, not a trained predictive AI model and not a guarantee of sales.
