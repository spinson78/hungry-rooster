import { NextRequest, NextResponse } from "next/server";

// The Hungry Rooster origin — used as the driving start point
const THR_ORIGIN = "1499 Regal Row, Dallas, TX 75247";

const BASE_FEE = 7.99;
const BASE_MILES = 15;
const OVERAGE_RATE = 0.5;
const MAX_MILES = 30;

function calcDeliveryFee(miles: number): number {
  if (miles <= BASE_MILES) return BASE_FEE;
  const overage = miles - BASE_MILES;
  return parseFloat((BASE_FEE + overage * OVERAGE_RATE).toFixed(2));
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address?.trim()) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Delivery distance service not configured" }, { status: 500 });
    }

    const origin = encodeURIComponent(THR_ORIGIN);
    const destination = encodeURIComponent(address.trim());
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin}&destinations=${destination}` +
      `&units=imperial&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Routing service unavailable" }, { status: 503 });
    }

    const data = await res.json();

    // Check top-level status
    if (data.status !== "OK") {
      return NextResponse.json(
        { error: "Could not calculate distance. Check the address and try again." },
        { status: 422 }
      );
    }

    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(
        { error: "Address not found. Please enter a full street address including city and state." },
        { status: 422 }
      );
    }

    // Google returns distance in meters
    const distanceMeters = element.distance.value;
    const distanceMiles = parseFloat((distanceMeters / 1609.34).toFixed(1));

    if (distanceMiles > MAX_MILES) {
      return NextResponse.json({
        inRange: false,
        distance: distanceMiles,
        fee: null,
        message: `Your address is ${distanceMiles} driving miles away — outside our 30-mile delivery area.`,
      });
    }

    const fee = calcDeliveryFee(distanceMiles);
    const message =
      distanceMiles <= BASE_MILES
        ? `Delivery fee: $${fee.toFixed(2)} (${distanceMiles} mi)`
        : `Delivery fee: $${fee.toFixed(2)} (${distanceMiles} mi — $0.50/mi over 15)`;

    return NextResponse.json({ inRange: true, distance: distanceMiles, fee, message });
  } catch (err) {
    console.error("Delivery fee error:", err);
    return NextResponse.json({ error: "Failed to calculate delivery fee" }, { status: 500 });
  }
}
