#!/usr/bin/env python3
"""
THR Print Daemon
Runs on Raspberry Pi Zero 2 W, watches Supabase for new paid orders,
prints tickets to Star TSP100III via USB.

Install deps:
  pip3 install supabase python-escpos

Run once to test:
  python3 print_daemon.py

Run as service: see thr-printer.service
"""

import time
import json
import os
from datetime import datetime
from supabase import create_client

# ── CONFIG ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"   # anon key is fine — we only read/update orders
POLL_INTERVAL = 10  # seconds between checks
# ─────────────────────────────────────────────────────────────────────────────

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_printer():
    """Connect to Star TSP100III via Bluetooth RFCOMM (/dev/rfcomm0)."""
    from escpos.printer import File
    return File('/dev/rfcomm0')


def format_order_type(order_type: str) -> str:
    labels = {
        "dinner":  "DINNER DROP",
        "shabbat": "SHABBAT BOX",
        "bakery":  "ESTHER'S BAKERY",
        "menu":    "WALK-IN ORDER",
    }
    return labels.get(order_type, order_type.upper())


def print_ticket(order: dict):
    """Format and print a ticket for the given order."""
    try:
        p = get_printer()

        p.set(align='center', bold=True, height=2, width=2)
        p.text("THE HUNGRY ROOSTER\n")
        p.set(align='center', bold=False, height=1, width=1)
        p.text("thehungryroostertx.com\n")
        p.text("-" * 32 + "\n")

        # Order type + number
        p.set(align='center', bold=True)
        p.text(f"{format_order_type(order.get('order_type', ''))}\n")
        if order.get('order_number'):
            p.text(f"#{order['order_number']}\n")

        # Timestamp
        created = order.get('created_at', '')
        if created:
            dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
            p.text(f"{dt.strftime('%b %d %Y  %I:%M %p')}\n")

        p.text("-" * 32 + "\n")

        # Customer info
        p.set(align='left', bold=False)
        if order.get('customer_name'):
            p.set(bold=True)
            p.text(f"  {order['customer_name']}\n")
            p.set(bold=False)
        if order.get('customer_phone'):
            p.text(f"  {order['customer_phone']}\n")
        if order.get('customer_address'):
            p.text(f"  {order['customer_address']}\n")

        p.text("-" * 32 + "\n")

        # Items
        p.set(align='left', bold=False)
        items = order.get('items', [])
        if isinstance(items, str):
            items = json.loads(items)
        for item in items:
            name = item.get('name', '')
            p.text(f"  * {name}\n")

        p.text("-" * 32 + "\n")

        # Totals
        subtotal = float(order.get('subtotal') or 0)
        tax      = float(order.get('tax_amount') or 0)
        tip      = float(order.get('tip_amount') or 0)
        total    = float(order.get('total') or 0)

        p.text(f"  Subtotal:   ${subtotal:>7.2f}\n")
        p.text(f"  Tax:        ${tax:>7.2f}\n")
        if tip > 0:
            p.text(f"  Tip:        ${tip:>7.2f}\n")
        p.set(bold=True)
        p.text(f"  TOTAL:      ${total:>7.2f}\n")
        p.set(bold=False)

        # Special requests
        if order.get('special_requests'):
            p.text("-" * 32 + "\n")
            p.set(bold=True)
            p.text("  NOTES:\n")
            p.set(bold=False)
            p.text(f"  {order['special_requests']}\n")

        p.text("\n\n\n")
        p.cut()
        p.close()
        print(f"[PRINTED] Order {order.get('order_number', order['id'])}")
        return True

    except Exception as e:
        print(f"[ERROR] Print failed: {e}")
        return False


def mark_printed(order_id: str):
    """Update printed_at so we don't re-print this order."""
    supabase.table("orders").update({
        "printed_at": datetime.utcnow().isoformat()
    }).eq("id", order_id).execute()


def poll():
    """Check for unprinted paid orders."""
    try:
        result = supabase.table("orders") \
            .select("*") \
            .eq("status", "paid") \
            .is_("printed_at", "null") \
            .order("created_at") \
            .execute()

        orders = result.data or []
        for order in orders:
            success = print_ticket(order)
            if success:
                mark_printed(order["id"])
            else:
                # Back off — don't hammer a broken printer
                time.sleep(5)

    except Exception as e:
        print(f"[ERROR] Poll failed: {e}")


def main():
    print("THR Print Daemon started — polling every 10s")
    print(f"  Supabase: {SUPABASE_URL}")
    print(f"  Printer:  Star TSP100III (Bluetooth → /dev/rfcomm0)")
    while True:
        poll()
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
