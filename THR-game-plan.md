# The Hungry Rooster — Build Status & Game Plan
_Last updated: June 1, 2026_

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

---

## NEEDS VERIFICATION (do these first when you're back)

- [ ] Test Esther bakery end-to-end on a live order (bakery_menus migration is run)
- [ ] Confirm group order emails are firing after the Supabase redesign
- [ ] Fix Resend 403 errors — all emails failing (unverified domain). Fix: verify `thehungryroostertx.com` in Resend → Domains, then update `from` address in all API routes

---

## UP NEXT — PRIORITY ORDER

### 1. Full Menu Ordering (Wire Stripe + Go Live)
- Menu ordering flow is live at `/menu` — no Stripe yet (test mode, orders go direct to Supabase/KDS)
- KDS at `/kds` (passcode: kitchen), thermal print ticket at `/kds/print/[id]` — Star Micronics Bluetooth
- Tax (8.25%), driver tip, pickup/delivery toggle all in checkout ✅
- Still needed: wire to Stripe for payment, then remove "Coming Soon" buttons on homepage
- **Do not go live until DoorDash Drive is integrated (see #9)**

### 2. Flier Finalization
- Add QR code to the PDF flier (have QR code PNG already)
- Print test — confirm layout at 8.5x11
- Decide print quantity / drop schedule for offices

### 3. Domain Flip
- Waiting on owner to hand over domain control
- Point `thehungryroostertx.com` → Vercel
- Update Resend `from` to `orders@thehungryroostertx.com` once domain is verified
- Add and verify domain in Resend → Domains (fixes all email 403 errors)

### 4. KDS + Printer Integration ✅ Built — needs live testing
- KDS at `/kds` (passcode: kitchen) — real-time order grid, Start/Done buttons, elapsed timer
- Print ticket at `/kds/print/[id]` — 80mm thermal format, auto-triggers print dialog
- Printer: Star Micronics Bluetooth — pair to device, set as default printer, browser print routes to it
- Still needed: test end-to-end in kitchen with real orders before market launch

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

### 9. DoorDash Drive Integration ⚠️ MUST COMPLETE BEFORE MARKET LAUNCH
- Delivery system: mix of DoorDash Drive (on-demand drivers) + in-house drivers
- Waiting on DoorDash Drive onboarding to get API credentials
- On paid order → auto-dispatch via DoorDash Drive API if delivery type selected
- Need to handle: in-house vs DoorDash toggle per order in admin, driver assignment, tracking link sent to customer
- Delivery radius / fee calculator ties into this (see #6 below)
- **Do not launch menu ordering to the public until this is in place**

---

## WAITING ON (not blocked by us)

| Item | Waiting On |
|------|-----------|
| Custom domain live | Owner transfers domain |
| Resend from address | Domain verification |
| DoorDash integration | DoorDash onboarding |
| KDS/printer test | Pre/post shift access |

---

## KEY FACTS (for new conversation context)

- **Site URL:** https://hungry-rooster.vercel.app
- **Admin password:** fredapproves
- **Stack:** Next.js App Router, TypeScript, Supabase (Postgres), Stripe, Resend
- **Tax rate:** 8.25% (Texas), calculated server-side
- **Dinner Drop price:** $85 flat, Mon/Tue/Thu, orders open 9PM night before, close 12PM day of
- **Shabbat Box:** $65–$225, orders open Monday 9PM, close Friday 9AM
- **Sales reps:** Abigayle Pinson 5%, Jordona Kohn 10% — INTERNAL ONLY, never shown to customers
- **Key file:** `app/admin/page.tsx` — main admin panel (all tabs)
- **Known issue:** Edit/Write tool truncates large files — use Python append script to fix
- **Known issue:** Git HEAD.lock appears often — delete manually from terminal
