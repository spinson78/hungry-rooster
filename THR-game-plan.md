# The Hungry Rooster — Build Status & Game Plan
_Last updated: May 28, 2026_

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
- Esther Friday Bakery — full online ordering at `/esther`. Weekly menu (JSONB items in `bakery_menus` table), $50 min order, Monday 9PM drop / Friday 9AM cutoff (same as Shabbat). Bakery upsell modal injected into Shabbat checkout flow ("Is your Shabbat table complete? / What about Kiddush?"). Admin: Weekly Menus tab has bakery item editor (8 slots, name/price/description); new 🥐 Bakery tab in admin orders view. Webhook handles `order_type === "bakery"`. ⚠️ **MUST RUN** `supabase/bakery_menus_migration.sql` in Supabase SQL editor before feature goes live.

---

## NEEDS VERIFICATION (do these first when you're back)

- [ ] Push banner tab commit (HEAD.lock blocked it — run from terminal):
  ```
  del C:\Users\spins\hungry-rooster\.git\HEAD.lock
  cd C:\Users\spins\hungry-rooster && git add app/admin/page.tsx && git commit -m "feat: add FB Banner Builder tab to admin panel" && git push
  ```
- [ ] Confirm Vercel build is green after push
- [ ] Test tax + tip end-to-end on a live order (dinner or group)
- [ ] Confirm group order emails are firing after the Supabase redesign
- [ ] Fix Resend 403 errors — all emails failing (likely unverified domain as `from` address)

---

## UP NEXT — PRIORITY ORDER

### 1. Full Menu Ordering (Unlock Stripe) ← START HERE
- Remove "Coming Soon" buttons on homepage and menu page
- Wire menu page cart → Stripe checkout (route already exists, just needs connecting)
- Add tax + tip to menu checkout same as other flows

### 2. Flier Finalization
- Add QR code to the PDF flier (have QR code PNG already)
- Print test — confirm layout at 8.5x11
- Decide print quantity / drop schedule for offices

### 3. Domain Flip
- Waiting on owner to hand over domain control
- Point `thehungryroostertx.com` → Vercel
- Update Resend `from` to `orders@thehungryroostertx.com` once domain is verified
- Add and verify domain in Resend → Domains (fixes all email 403 errors)

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
