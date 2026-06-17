import { NextRequest, NextResponse } from "next/server";

// The Hungry Rooster — 1499 Regal Row, Dallas TX 75060
const THR_LAT = 32.8576;
const THR_LNG = -96.9163;

const BASE_FEE = 7.99;
const BASE_MILES = 15;
const OVERAGE_RATE = 0.5;
const MAX_MILES = 30;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    const query = encodeURIComponent(address.trim());
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;

    const geoRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "TheHungryRooster/1.0 (thehungryroostertx.com)",
        "Accept-Language": "en-US",
      },
    });

    if (!geoRes.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 503 });
    }

    const geoData = await geoRes.json();

    if (!Array.isArray(geoData) || geoData.length === 0) {
      return NextResponse.json(
        { error: "Address not found. Please enter a full street address including city and state." },
        { status: 422 }
      );
    }

    const { lat, lon } = geoData[0];
    const distance = haversineDistance(THR_LAT, THR_LNG, parseFloat(lat), parseFloat(lon));
    const roundedDist = parseFloat(distance.toFixed(1));

    if (distance > MAX_MILES) {
      return NextResponse.json({
        inRange: false,
        distance: roundedDist,
        fee: null,
        message: `Your address is ${roundedDist} miles away — outside our 30-mile delivery radius.`,
      });
    }

    const fee = calcDeliveryFee(distance);
    const message =
      distance <= BASE_MILES
        ? `Delivery fee: $${fee.toFixed(2)}`
        : `Delivery fee: $${fee.toFixed(2)} (${roundedDist} mi)`;

    return NextResponse.json({ inRange: true, distance: roundedDist, fee, message });
  } catch (err) {
    console.error("Delivery fee error:", err);
    return NextResponse.json({ error: "Failed to calculate delivery fee" }, { status: 500 });
  }
}
