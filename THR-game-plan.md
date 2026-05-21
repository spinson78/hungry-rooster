# The Hungry Rooster — Build Status & Game Plan

---

## DONE TODAY

- **Fred banner** — head was clipped, scaled down to 85%
- **Homepage copy** — "people" → "flock" on catering section
- **Group orders redesigned** — orders now stored in Supabase *before* Stripe redirect, solving the Stripe metadata 500-char limit that was breaking item lists, emails, and thank-you screens
- **Group order progress bar** — now includes current cart in combined total
- **Admin: Group Orders tab** — live view of orders by location
- **Admin: Invoices tab** — create invoices with line items, sales rep tracking (Abigayle 5%, Jordona 10%, House 0%), Stripe payment link, mark-paid override. Commission is internal only — never shown to customer.
- **Email notifications** — fixed Resend 403 (stale API key), fixed NEXT_PUBLIC_BASE_URL pointing to wrong deployment
- **Sales tax (8.25%)** — added to Dinner Drop, Shabbat, and Group Order checkouts as a line item (calculated server-side)
- **Driver tip** — open-ended dollar input added to all three checkout flows, passed to Stripe as a line item
- **Office drop flier** — PDF built with real menu, logo, Fred, group order callout. QR code generated separately.
- **Multiple build errors fixed** — file truncation, duplicate route fragments, TypeScript type issues

---

## NEEDS VERIFICATION

- [ ] Confirm latest Vercel build is green (push in progress)
- [ ] Test tax + tip end-to-end on a live order (dinner or group)
- [ ] Confirm group order emails are firing after the Supabase redesign

---

## UP NEXT — PRIORITY ORDER

### 1. Flier Finalization
- Add QR code to PDF flier (save `THR-qr-code.png` to project folder first)
- Print test — confirm layout holds at 8.5x11
- Decide print quantity / drop schedule for offices

### 2. Full Menu Ordering (Unlock Stripe)
- Remove "Coming Soon" buttons on homepage and menu page
- Wire menu page cart → Stripe checkout (route already exists, just needs connecting)
- Add tax + tip to menu checkout same as other flows

### 3. Domain Flip
- Waiting on owner to hand over domain control
- Point `thehungryroostertx.com` → Vercel
- Update Resend `from` address to `orders@thehungryroostertx.com` once domain is verified

### 4. KDS + Printer Integration
- Come in pre/post shift to test without interrupting kitchen flow
- Orders need to route from Supabase → KDS display
- Printer: thermal receipt on new order webhook

### 5. Sales Rep Portal
- `/rep/abigayle` and `/rep/jordona` — personal dashboards
- Show their invoices, commission earned, pipeline
- Password protected

### 6. Delivery Radius Calculator
- Flat rate + $0.50/mile over 15 miles
- Auto-calculate at checkout based on delivery address

### 7. Daily Manifest Emails
- Auto-send Shabbat + Catering order summaries each morning
- Goes to `sales@thehungryroostertx.com`

### 8. Staff Time Clock
- `/clock` page optimized for iPad
- Clock in / clock out
- Simple admin view of hours

### 9. DoorDash Drive Integration
- Waiting on DoorDash onboarding
- Auto-dispatch driver on paid order

---

## WAITING ON (not blocked by us)

| Item | Waiting On |
|------|-----------|
| Custom domain live | Owner transfers domain |
| Resend from address | Domain verification |
| DoorDash integration | DoorDash onboarding |
| KDS/printer test | Pre/post shift access |

