# Rate Limiting Configuration Guide

## 📋 Rate Limit Presets

```
🔴 HEAVY:    capacity: 3,  refillTime: 30s,  tokensPerRefill: 1  (Strictest)
🟡 MODERATE: capacity: 5-6, refillTime: 20s,  tokensPerRefill: 1
🟢 LIGHT:    capacity: 10, refillTime: 15s,  tokensPerRefill: 2  (Most lenient)
⚪ NONE:     No rate limiting
```

---

## 🏠 Routes/home.js

| Route | Method | Rate Limit |
|-------|--------|-----------|
| `/` | GET | ⚪ NONE |

---

## 📍 Routes/listing.js

| Route | Method | Rate Limit | Purpose |
|-------|--------|-----------|---------|
| `/listings` | GET | 🟡 MODERATE | Index (list all listings) |
| `/listings` | POST | 🔴 HEAVY | Create listing (file upload) |
| `/listings/new` | GET | 🟢 LIGHT | Render new listing form |
| `/listings/:id` | GET | 🟡 MODERATE | Show single listing |
| `/listings/:id` | PUT | 🔴 HEAVY | Update listing (file upload) |
| `/listings/:id` | DELETE | 🟡 MODERATE | Delete listing |
| `/listings/:id/edit` | GET | 🟢 LIGHT | Render edit form |
| `/listings/search` | GET | 🔴 HEAVY | Search listings (heavy DB query) |

---

## ⭐ Routes/review.js

| Route | Method | Rate Limit | Purpose |
|-------|--------|-----------|---------|
| `/listings/:id/reviews` | POST | 🔴 HEAVY | Create review |
| `/listings/:id/reviews/:revid` | DELETE | 🔴 HEAVY | Delete review |

---

## 👤 Routes/user.js

| Route | Method | Rate Limit | Purpose |
|-------|--------|-----------|---------|
| `/signup` | GET | ⚪ NONE | Render signup form |
| `/signup` | POST | 🔴 HEAVY | Create user account |
| `/login` | GET | ⚪ NONE | Render login form |
| `/login` | POST | 🟡 MODERATE | User login |
| `/logout` | GET | ⚪ NONE | User logout |
| `/profile` | GET | ⚪ NONE | View user profile |
| `/bookingonmylocation` | GET | ⚪ NONE | View bookings on user's location |
| `/user` | GET | ⚪ NONE | View all users |
| `/userprofile/:id` | GET | ⚪ NONE | View specific user profile |
| `/forgot` | GET | ⚪ NONE | Render forgot password form |
| `/forgot` | POST | 🟡 MODERATE | Request password reset |
| `/reset/:token` | GET | ⚪ NONE | Render reset password form |
| `/reset/:token` | POST | 🔴 HEAVY | Reset password (security-sensitive) |
| `/profile/photo` | POST | 🔴 HEAVY | Upload profile photo (file upload) |

---

## 💳 Routes/booking.js

| Route | Method | Rate Limit | Purpose |
|-------|--------|-----------|---------|
| `/search` | GET | 🔴 HEAVY | Search bookings (heavy DB query) |
| `/listings/:id/book` | GET | ⚪ NONE | Render booking form |
| `/bookings/:id` | POST | 🔴 HEAVY | Create booking (write to DB) |
| `/bookings/:id` | DELETE | 🟡 MODERATE | Cancel booking |
| `/payments/:id` | GET | 🟡 MODERATE | View payment page |
| `/payments/:id/confirm` | POST | 🔴 HEAVY | Confirm payment (financial transaction) |
| `/payments/:id/makeunpay` | GET | 🟡 MODERATE | Revert payment |
| `/getmypayments/:email` | GET | 🟡 MODERATE | Get user's payment history |

---

## 👨‍💼 Routes/admin.js

| Route | Method | Rate Limit | Purpose |
|-------|--------|-----------|---------|
| `/` | GET | 🟡 MODERATE | Admin dashboard |

---

## 📊 Summary by Workload Type

### 🔴 HEAVY Operations (3 req per 30s)
Strictest rate limiting for resource-intensive or security-critical operations:
- Listing creation, update (with uploads)
- Listing search (multi-DB queries)
- Reviews: create, delete
- User signup, password reset, profile photo upload
- Booking creation, payment confirmation

### 🟡 MODERATE Operations (5-6 req per 20s)
Standard rate limiting for general operations:
- User login, forgot password request
- Booking delete, revert payment
- Payment view, payment history
- Admin dashboard
- Listing index, show, delete

### 🟢 LIGHT Operations (10 req per 15s)
Lenient rate limiting for simple form renders:
- Form renders: new listing, edit listing

### ⚪ NO LIMIT
No rate limiting for simple view operations:
- Profile views, user views, logout, booking form view, password reset form

---

## 🔧 Token Bucket Configuration

The token bucket middleware uses the following configuration:

```javascript
// HEAVY - Most restrictive
{
  capacity: 3,           // Max 3 requests stored
  refillTime: 30000,     // Refill every 30 seconds
  tokensPerRefill: 1     // Add 1 token per refill
}

// MODERATE - Standard restriction
{
  capacity: 5,           // Max 5 requests stored
  refillTime: 20000,     // Refill every 20 seconds
  tokensPerRefill: 1     // Add 1 token per refill
}

// LIGHT - Most lenient
{
  capacity: 10,          // Max 10 requests stored
  refillTime: 15000,     // Refill every 15 seconds
  tokensPerRefill: 2     // Add 2 tokens per refill
}
```

---

## 📝 Implementation Details

### How It Works
1. Each IP address gets its own token bucket
2. Each request consumes 1 token
3. Tokens refill at the specified `refillTime` interval
4. If no tokens available (bucket empty), request gets 429 Too Many Requests with redirect to home

### Bucket Cleanup
- Inactive buckets are cleaned up every 10 minutes
- Buckets older than 30 minutes of inactivity are deleted

### Error Response
When rate limit is exceeded:
```
Error: 429 - Too many requests
Message: "Please try again after a few seconds."
Redirect: `/`
```

---

## 🚀 Routes Without Rate Limiting

These routes are allowed unlimited access:

### GET Routes (Read-only, lightweight)
- `/logout`
- `/profile`
- `/bookingonmylocation`
- `/user`
- `/userprofile/:id`
- `/forgot` (form render)
- `/reset/:token` (form render)
- `/listings/:id/book` (form render)

### Why No Limit?
- Form renders: Minimal server load
- Profile views: Simple database queries
- Navigation routes: Don't modify data

---

## 📈 Performance Recommendations

### For High-Traffic Scenarios
If your app experiences high traffic, consider:
1. Increasing `capacity` values (more burst requests allowed)
2. Decreasing `refillTime` (tokens refill faster)
3. Adding `tokensPerRefill` > 1 for lighter operations

### For Security-Critical Scenarios
If security is paramount, consider:
1. Decreasing `capacity` values
2. Increasing `refillTime` (stricter throttling)
3. Keeping `tokensPerRefill: 1` for sensitive operations

### Example: Stricter Security Config
```javascript
const rateLimitStrict = {
  capacity: 2,
  refillTime: 60000,      // 1 minute
  tokensPerRefill: 1
};
```

### Example: Higher Throughput Config
```javascript
const rateLimitHigh = {
  capacity: 10,
  refillTime: 15000,      // 15 seconds
  tokensPerRefill: 2
};
```

---

## 🛠️ Modifying Rate Limits

To modify rate limits for a specific route:

1. Open the route file (e.g., `Routes/listing.js`)
2. Update the preset constant at the top of the file
3. Test the changes in development
4. Deploy to production

Example:
```javascript
// Before
const rateLimitHeavy = {
  capacity: 3,
  refillTime: 30000,
  tokensPerRefill: 1
};

// After (stricter)
const rateLimitHeavy = {
  capacity: 2,
  refillTime: 45000,
  tokensPerRefill: 1
};
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: Users getting 429 errors too frequently**
- A: Increase `capacity` or decrease `refillTime` for that tier

**Q: Rate limiting not working**
- A: Verify middleware is imported and applied correctly
- A: Check that token bucket middleware is before the controller

**Q: Need different limits for different users**
- A: Modify token bucket middleware to check user roles/plans
- A: Implement tier-based rate limiting based on user subscription

---

## 🔐 Security Considerations

1. **Brute Force Protection**: Heavy rate limiting on login/signup prevents brute force attacks
2. **Payment Protection**: Heavy rate limiting on payment confirmation prevents accidental/malicious multiple charges
3. **Resource Protection**: Heavy rate limiting on uploads and searches protects server resources
4. **Balanced Approach**: Light limits on reads allow normal user experience while still protecting resources

---

Last Updated: 2026-06-22
