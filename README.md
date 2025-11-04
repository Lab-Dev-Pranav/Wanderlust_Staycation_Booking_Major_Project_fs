# Wanderlust — Travel Booking Major Project

A full-stack travel and booking web application built with Node.js, Express, MongoDB, and EJS. Users can browse listings, create bookings, handle payments, manage accounts, write reviews, and admin users can manage listings and payments.

Live demo: (local/deployed URL if available — add yours here)

---

## Table of Contents

- Project Overview
- Features
- Tech Stack
- Project Structure
- Getting Started (Local Setup)
  - Prerequisites
  - Environment variables
  - Install & Run
- Important Endpoints & Views
- Database & Models
- Authentication & Sessions
- Payments & Accounting
- Development notes & common issues
- Contributing
- License

---

## Project Overview

Wanderlust is a travel/venue booking platform designed to allow hosts to publish listings and users to book venues for events, holidays, and stays. The system supports booking lifecycle (pending -> confirmed), payment/accounting records, user profiles, reviews, and admin controls.

This README is tailored to the codebase present in this workspace (files and folders like `app.js`, `Routes/`, `models/`, `views/`, `public/`, and `utils/`).

## Features

- List and browse venues/listings with images and metadata
- Search listings by location and availability
- Booking creation with date validation and capacity checks
- Booking lifecycle: pending, confirmed, unpay
- Payment pages and accounting records
- User authentication (Passport.js) and session management
- Flash messaging for user feedback (connect-flash)
- Admin routes for managing listings, bookings, and users
- Reviews for listings
- Static assets, client-side scripts, and map integration

## Tech Stack

- Node.js (v18+ recommended)
- Express.js
- MongoDB with Mongoose
- EJS templating + `ejs-mate` layout engine
- Passport.js (local strategy) for authentication
- connect-mongo for session store
- Cloudinary for image uploads (optional / if configured)
- Nodemailer (optional) for transactional emails

---

## Project Structure

(Top-level relevant files and folders from the repository)

```
app.js
cloudConfig.js
MW.js
package.json
schema.js
utils/
  expressError.js
  wrapAsync.js
models/
  listing.js
  booking.js
  accounting.js
  user.js
Routes/
  listing.js
  review.js
  user.js
views/
  layouts/boilerplate.ejs
  listings/
  bookings/
  payments/
  users/
public/
  css/
  js/

# extras
init/
controller/
uptogit/
```

Note: adapt file names and structure if you add or move files.

---

## Getting Started (Local Setup)

### Prerequisites

- Node.js (v16+ recommended)
- npm (comes with Node)
- MongoDB (Atlas or local)
- (Optional) Cloudinary account for uploads

### Environment variables

Create a `.env` file in the project root with the following keys (example):

```
NODE_ENV=development
ATLAS_DB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wanderlust?retryWrites=true&w=majority
SESSION_SECRET=your_session_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret
PORT=8080
```

- `ATLAS_DB_URL` — connection string for MongoDB. If running MongoDB locally use `mongodb://localhost:27017/wanderlust`
- `SESSION_SECRET` — random secret string used to sign session cookies
- Cloudinary keys are only required if the project uses cloud uploads

### Install & Run

Open a terminal in the project root and run:

```powershell
npm install
# start with node
node app.js
# or with nodemon (if installed)
nodemon app.js
```

If the port is in use you can change `PORT` or run it in PowerShell for a single run:

```powershell
$env:PORT=8081; node app.js
```

Or with npm scripts (if `package.json` has them):

```powershell
npm run dev   # if defined (commonly nodemon)
npm start     # production start
```

### Seed data (optional)

If the repo includes a seed or `init/` script, run it to populate sample data (adjust path):

```powershell
node init/index.js
```

---

## Important Endpoints & Views

- `GET /` - Home page
- `GET /listings` - Listing index
- `GET /listings/new` - Create listing (protected)
- `GET /listings/:id` - Show listing
- `GET /listings/:id/book` - Booking page for a listing
- `POST /bookings/:id` - Create a booking
- `GET /payments/:id` - Payment page (for booking)
- `POST /payments/:id/confirm` - Simulates confirming payment and creates accounting record
- `GET /getmypayments/:email` - View accounting records for user
- `Auth` routes: login/signup/logout under `/` (see `Routes/user.js`)

Views are EJS and stored in `views/` (e.g., `views/listings`, `views/bookings`, `views/payments`). Layout is `views/layouts/boilerplate.ejs`.

---

## Database & Models (high-level)

- `models/listing.js` — listings/venues schema (title, description, price, location, capacity, images, owner)
- `models/booking.js` — booking schema (listing ref, user ref, checkIn, checkOut, people, status, expiresAt)
- `models/accounting.js` — accounting/payment records for confirmed payments
- `models/user.js` — user accounts (Passport-local Mongoose likely used)
- `models/review.js` — reviews attached to listings

The app uses Mongoose population for references (e.g., booking -> listing, listing -> owner).

---

## Authentication & Sessions

- Passport.js with `passport-local` strategy is used. Typical setup is:
  - `passport.use(new LocalStrategy(User.authenticate()));`
  - `passport.serializeUser(User.serializeUser());`
  - `passport.deserializeUser(User.deserializeUser());`

- Sessions persisted in MongoDB using `connect-mongo` (see `app.js` session store config).

- Flash messages provided by `connect-flash`. Locals are set in middleware in `app.js`.

---

## Payments & Accounting (project-specific flow)

- Payments in this project are simulated: upon ``POST /payments/:id/confirm`` an `Accounting` record is created and booking status is set to `confirmed`.
- Payment amounts are computed using listing `price` and number of nights, plus GST (18%) and platform fee (2%).

If you plan to integrate a real payment gateway (Stripe/PayPal):
- Do server-side payment capture
- Verify webhook signatures
- Store payment id + status in `Accounting` model

---

## Development notes & Common Issues

- "ExpressError is not a constructor" — This can happen if you import a CommonJS `module.exports =` value with destructuring that expects a `default` property. In `app.js` ensure you import like:

```js
const ExpressError = require('./utils/expressError');
```

- "EADDRINUSE" when the port is already in use — change `PORT` or kill the process using the port. In PowerShell: use `Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess` or run on another port with `$env:PORT=8081; node app.js`.

- If you add ES module `import` syntax, you must set `"type": "module"` in `package.json` and update CommonJS `require` usages.

- Keep `SESSION_SECRET` safe and never commit `.env` to source control. Add `.env` to `.gitignore`.

---

## Tests

No automated tests included by default. Recommended:
- Add Mocha/Jest for backend unit tests
- Add a few integration tests that test booking validation and payment flow

---

## Contributing

1. Fork repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a PR describing your changes

Please follow existing code style and include tests where reasonable.

---

## Useful commands

```powershell
# Install dependencies
npm install

# Run (dev)
nodemon app.js   # or npm run dev if defined

# Run on a specific port (PowerShell)
$env:PORT=8081; node app.js
```

---

## License

(Choose a license and include it here, e.g., MIT)

---

If you want, I can:
- Link this README to real hosted demo URL and screenshots
- Generate a short CONTRIBUTING or DEPLOYMENT guide (Render/Heroku)
- Create a `.env.example` file with required keys

*Enjoy building — let me know if you want a shorter marketing README or a longer developer guide.*
