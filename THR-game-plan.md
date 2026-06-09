# The Hungry Rooster — Build Status & Game Plan
_Last updated: June 9, 2026_

---

## COMPLETED (across all sessions)

- Fred banner — head clipping fixed, scaled to 85%
- Homepage copy — "people" → "flock" on catering section
- Group orders redesigned — Supabase-first before Stripe redirect (fixes metadata limit)
- Group order progress bar — includes current cart in combined total
- Admin: Group Orders tab — live view by location
- Admin: Invoices tab — line items, sales rep tracking (Abigayle 5%, Jordona 10%, House 0%), Stripe payment link, mark-paid override. Commission is internal only.
- Admin: FB Banner Builder tab — full weekly banner builder embedded, no separate login needed
- Email blast — Dinner Drop, Shabbat, Announcement templates with live preview
- Email notifications — fixed Resend 403 (stale API key), fixed NEXT_PUBLIC_BASE_URL
- Sales tax (8.25%) — added to Dinner Drop, Shabbat, and Group Order checkouts (server-side)
- Driver tip — open-ended dollar input on all three checkout flows, passed to Stripe
- Office drop flier — PDF with real menu, logo, Fred, group order callout. QR code separate.
- Multiple build errors fixed — file truncation, duplicate route fragments, TypeScript issues
- Standalone FB banner builder — `/banner` page with live preview, password protected
- Esther Friday Bakery — full online ordering at `/esther`. Weekly menu (JSONB items in `bakery_menus` table), $50 min order, Monday 9PM drop / Friday 9AM cutoff (same as Shabbat). Per-item quantity steppers (not checkboxes), per-item stock limits. Bakery upsell modal injected into Shabbat checkout flow. Admin: Weekly Menus tab has bakery item editor (10 slots, name/price/description/qty); new 🥐 Bakery tab in admin orders view. Webhook handles `order_type === "bakery"`. Migration run ✅ (`supabase/bakery_menus_migration.sql`).
- Bug fixes (June 1) — Shabbat dessert no longer concatenated into Side 3; bakery per-item quantity; bakery admin date field separate from Shabbat week_of.
- Invoices — full invoicing system at admin Invoices tab. Create invoices with line items (taxable, 8.25% tax), delivery/pickup toggle + address, delivery fee + service fee (non-taxable). Printable invoice page at `/invoice/[id]` — professional layout, THR branding, client-side gratuity input, Pay Now button (on-demand Stripe session via `/api/invoice-checkout`), Print/Save PDF button. Stripe payment link saved back to DB after first Pay click. Delete button for unpaid invoices. Paid invoices locked. Migration run ✅ (`supabase/invoices_migration.sql` + ALTER TABLE for new columns). Emails use Resend — still failing due to unverified domain; use Copy Link workaround until domain is live.
- Full menu ordering (no Stripe) — `/menu` page live for KDS testing. Cart with qty controls, upsell popup (drinks + dessert with visual "✓ Added" feedback), pickup/delivery toggle, 8.25% tax, driver tip, order confirmation screen. Submits to Supabase `orders` table as `order_type: "menu"`.
- KDS screen — `/kds` live. Real-time order grid (Supabase Realtime + 10-second polling fallback). Start/Done buttons, elapsed timer, 10-min urgent threshold (red border). Large display mode (text-3xl cards). Alarm sound on new orders (Web Audio API, 3-beep pattern, mute toggle). Print button triggers inline thermal ticket (no page navigation — window.print() on hidden DOM element, shown only via @media print).
- Thermal print ticket — `/kds/print/[id]` — 80mm format, auto-prints on load.
- Shabbat greeting — changed "Chag Sameach" to "Shabbat Shalom 🕯️"
- Dinner Drop price — now reads from database (not hardcoded). Admin can set per-dinner price. Admin "📥 Load This Week" button pre-fills existing dinner entries for editing without resetting quantity remaining.

---

## NEEDS VERIFICATION (do these first when you're back)

- [ ] Test Esther bakery end-to-end on a live order (bakery_menus migration is run)
- [ ] Confirm group order emails are firing after the Supabase redesign
- [ ] Fix Resend 403 errors — all emails failing (unverified domain). Fix: verify `thehungryroostertx.com` in Resend → Domains, then update `from` address in all API routes
- [ ] Enable Supabase Realtime for `orders` table (Dashboard → Database → Replication) — KDS has polling fallback but Realtime is faster
- [ ] Run orders table migration if not done: add `order_number`, `subtotal`, `tax_amount`, `tip_amount`, `fulfillment_type` columns
- [ ] Run in Supabase SQL editor: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN NOT NULL DEFAULT false;`

---

## UP NEXT — PRIORITY ORDER

### 1. Stripe Connection for Menu Ordering
- Menu checkout currently saves to Supabase and routes to KDS with no payment
- Wire `/menu` checkout to Stripe (create Checkout Session with tax + tip as line items, similar to other flows)
- Remove "Coming Soon" buttons on homepage once live
- **Do not go live until DoorDash Drive is integrated (see #3)**

### 2. Printer Integration — Raspberry Pi Zero 2 W Print Server ⚠️ HARDWARE ORDERED
- Decision: Star TSP143IIIBi (Bluetooth/MFi) cannot be accessed from any web browser on iOS — it's an MFi accessory, not a standard printer
- Solution: Raspberry Pi Zero 2 W acting as a WiFi→Bluetooth bridge. Web app sends print job over WiFi HTTP to the Pi; Pi relays ESC/POS to the Star via Bluetooth
- Hardware ordered: Raspberry Pi Zero 2 W (~$15) + GeeekPi aluminum case ($9.49, kitchen-safe) + 16GB microSD — arriving soon
- Setup plan: Node.js/Python HTTP print server on Pi. KDS posts order JSON to http://pi-ip:3001/print → Pi formats ESC/POS → sends to Star printer
- No cables to KDS: Pi plugs into any nearby USB power source and communicates wirelessly
- Current workaround: manual Print button on KDS card → browser print dialog

### 3. DoorDash Drive Integration ⚠️ MUST COMPLETE BEFORE MARKET LAUNCH
- Delivery system: mix of DoorDash Drive (on-demand drivers) + in-house drivers
- Waiting on DoorDash Drive onboarding to get API credentials
- On paid order → auto-dispatch via DoorDash Drive API if delivery type selected
- Need to handle: in-house vs DoorDash toggle per order in admin, driver assignment, tracking link sent to customer
- Delivery radius / fee calculator ties into this (see #6)
- **Do not launch menu ordering to the public until this is in place**

### 4. Domain Flip
- Waiting on owner to hand over domain control
- Point `thehungryroostertx.com` → Vercel
- Update Resend `from` to `orders@thehungryroostertx.com` once domain is verified
- Add and verify domain in Resend → Domains (fixes all email 403 errors)

### 5. Flier Finalization
- Add QR code to the PDF flier (have QR code PNG already)
- Print test — confirm layout at 8.5x11
- Decide print quantity / drop schedule for offices

### 6. Delivery Radius Calculator
- Flat rate + $0.50/mile over 15 miles
- Auto-calculate at checkout based on delivery address

### 7. Sales Rep Portal
- `/rep/abigayle` and `/rep/jordona` — personal dashboards
- Show their invoices, commission earned, pipeline
- Password protected

### 8. Daily Manifest Emails
- Auto-send Shabbat + Catering order summaries each morning
- Goes to `sales@thehungryroostertx.com`

### 9. Staff Time Clock
- `/clock` page optimized for iPad
- Clock in / clock out
- Simple admin view of hours

---

## WAITING ON (not blocked by us)

| Item | Waiting On |
|------|-----------|
| Custom domain live | Owner transfers domain |
| Resend from address | Domain verification |
| DoorDash integration | DoorDash API credentials (onboarding) |
| Pi Zero 2 W print server | Hardware delivery (ordered June 9) |

---

## KEY FACTS (for new conversation context)

- **Site URL:** https://hungry-rooster.vercel.app
- **Admin URL:** https://hungry-rooster.vercel.app/admin (password: fredapproves)
- **KDS URL:** https://hungry-rooster.vercel.app/kds (no password, opens directly)
- **Stack:** Next.js App Router, TypeScript, Supabase (Postgres), Stripe, Resend
- **Tax rate:** 8.25% (Texas), applied to all customer-facing checkouts
- **Dinner Drop price:** Per-dinner, set in admin (default $85). Mon/Tue/Thu, orders open 9PM night before, close 12PM day of.
- **Shabbat Box:** $65–$225, orders open Monday 9PM, close Friday 9AM
- **Esther's Bakery:** $50 minimum, same schedule as Shabbat Box
- **Sales reps:** Abigayle Pinson 5%, Jordona Kohn 10% — INTERNAL ONLY, never shown to customers
- **Key file:** `app/admin/page.tsx` — main admin panel (all tabs)
- **Known issue:** Edit/Write tool truncates large files — use Python write script for any file over ~200 lines
- **Known issue:** Git HEAD.lock appears often — delete with `del C:\Users\spins\hungry-rooster\.git\HEAD.lock` then retry
- **Known issue:** Bash sandbox cannot push to GitHub (no credentials) — all pushes must be done from user's terminal
