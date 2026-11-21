# Stock Mind

Stock Mind is a wholesale inventory and surplus-stock marketplace prototype. Sellers can evaluate purchases, review stock, and publish surplus. Buyers can compare offers and order by quantity or buy a complete lot. Administrators can review listings and feedback and read messages sent through the contact form.

## Run locally

Install **Node.js 18 or newer** and **Git**, then run:

```bash
git clone https://github.com/taimaafreahat4/MasterPeace.git
cd MasterPeace
node server.js
```

Open [Stock Mind on port 3000](http://127.0.0.1:3000/). The server runs on the loopback interface by default and requires no npm dependencies. Keep the terminal open while using the site.

Use the Node server for the contact form and admin inbox. A static preview can display the pages, but it cannot accept or deliver contact messages. Browser-local demo accounts and records are specific to the origin, so use the same host and port throughout a session.

## Explore the app

| Area | What you can do |
| --- | --- |
| [Home](home/index.html) | Follow the interactive 3D warehouse tour. |
| [Marketplace](category/category.html) | Search products and sellers. Filter by selling method, price, and available quantity. |
| [Favorites](favorite/favorite.html) and [cart](cart/cart.html) | Save items, review wholesale quantities, and start checkout. |
| [Seller Center](seller/stockmind_seller_center/dashboard.html) | Review listings and open Before You Buy, AI Recommendations, and Demand Forecast. |
| [Subscription plans](seller/stockmind_seller_center/subscription.html) | Choose the Free plan or try the demo Premium checkout. |
| [Admin overview](admin/dashboard/dashboard.html) | Review products, users, sellers, orders, and feedback. |
| [Contact](home/contact.html) and [Contact inbox](admin/messages/messages.html) | Compose a message with a live preview, then read it in the administrator inbox. |

The [login screen](login/login.html) supports buyer, seller, and admin demo accounts. The built-in demo accounts are defined in [the login script](login/login.js). The storefront uses browser-local demo authentication. The contact inbox uses a separate server-side key.

## Contact inbox

1. Start the Node server and submit a message from **Contact us**.
2. Open **Admin → Contact messages**, or use the [local inbox](http://127.0.0.1:3000/admin/messages/messages.html).
3. Enter the key generated at first startup in `~/.stockmind/contact/admin-key.txt`. On Windows, this is `%USERPROFILE%\.stockmind\contact\admin-key.txt`.
4. Open a message to mark it as read. Use **Reply by email** to open a draft in your mail client.

The key and contact messages are stored outside the web root. Keep the key private and keep the contact directory outside the project folder if you customize it.

## Project structure

| Path | Responsibility |
| --- | --- |
| [`home/`](home/) | Homepage, warehouse tour, About, Contact, and public information pages |
| [`components/`](components/) | Shared navigation, footer, notification UI, and site helpers |
| [`category/`](category/), [`favorite/`](favorite/), [`cart/`](cart/), [`checkout/`](checkout/) | Buyer browsing and purchase flow |
| [`seller/stockmind_seller_center/`](seller/stockmind_seller_center/) | Seller listings, analytics, and subscriptions |
| [`admin/`](admin/) | Administrator pages, moderation, and the contact inbox |
| [`server.js`](server.js), [`contact-api.js`](contact-api.js) | Static file serving, prototype API, and contact inbox persistence |

**Stack:** HTML, CSS, vanilla JavaScript, Three.js with WebGL, and Node.js. The Node server accepts `PORT`, `STOCKMIND_HOST`, `STOCKMIND_CONTACT_DIR`, and `STOCKMIND_DEMO_DATA` overrides.

## Demo scope

- Much of the marketplace, account, and subscription experience uses browser-local demo state. The contact form stores messages on the Node server, so the sender and admin can use separate browser sessions connected to that server.
- Seller analysis tools use sample inputs and rule-based estimates. The Free plan includes a first analysis per tool. Premium checkout is simulated and does not collect card details or charge money.
- This repository contains the HTML/JavaScript version of Stock Mind. The [ASP.NET Core MVC edition](https://github.com/taimaafreahat4/MasterPeace_mvc) is maintained separately.
