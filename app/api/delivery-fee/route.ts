import { NextRequest, NextResponse } from "next/server";

// The Hungry Rooster — 1499 Regal Row, Dallas TX
const THR_ORIGIN = "1499 Regal Row, Dallas, TX 75247";
const THR_LAT = 32.8576;
const THR_LNG = -96.9163;

const BASE_FEE = 7.99;
const BASE_MILES = 15;
const OVERAGE_RATE = 0.5;
const MAX_MILES = 30;
// Multiplier applied to straight-line distance when Google Maps isn't available
// 1.3 approximates urban DFW road routing vs. as-the-crow-flies
const DRIVING_FACTOR = 1.3;

function calcDeliveryFee(miles: number): number {
  if (miles <= BASE_MILES) return BASE_FEE;
  return parseFloat((BASE_FEE + (miles - BASE_MILES) * OVERAGE_RATE).toFixed(2));
}

// Haversine straight-line distance in miles (fallback only)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Try Google Maps Distance Matrix — returns driving miles or null on any failure
async function googleDrivingMiles(address: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(THR_ORIGIN)}` +
      `&destinations=${encodeURIComponent(address)}` +
      `&units=imperial&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK") return null;

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") return null;

    return parseFloat((element.distance.value / 1609.34).toFixed(1));
  } catch {
    return null;
  }
}

// Fallback: geocode via Nominatim, then Haversine × DRIVING_FACTOR
async function fallbackDrivingMiles(address: string): Promise<number | null> {
  try {
    const query = encodeURIComponent(address.trim());
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          "User-Agent": "TheHungryRooster/1.0 (thehungryroostertx.com)",
          "Accept-Language": "en-US",
        },
      }
    );
    if (!geoRes.ok) return null;

    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) return null;

    const { lat, lon } = geoData[0];
    const straightLine = haversineDistance(THR_LAT, THR_LNG, parseFloat(lat), parseFloat(lon));
    return parseFloat((straightLine * DRIVING_FACTOR).toFixed(1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address?.trim()) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Try Google Maps first; fall back to Nominatim + Haversine
    let distanceMiles = await googleDrivingMiles(address);
    const usingGoogleMaps = distanceMiles !== null;

    if (distanceMiles === null) {
      distanceMiles = await fallbackDrivingMiles(address);
    }

    if (distanceMiles === null) {
      return NextResponse.json(
        { error: "Address not found. Please enter a full street address including city and state." },
        { status: 422 }
      );
    }

    if (distanceMiles > MAX_MILES) {
      return NextResponse.json({
        inRange: false,
        distance: distanceMiles,
        fee: null,
        message: `Your address is ${distanceMiles} miles away — outside our 30-mile delivery area.`,
      });
    }

    const fee = calcDeliveryFee(distanceMiles);
    const overage = distanceMiles > BASE_MILES;
    const source = usingGoogleMaps ? "" : " (est.)";

    const message = overage
      ? `Delivery fee: $${fee.toFixed(2)} (${distanceMiles} mi${source} — $0.50/mi over 15)`
      : `Delivery fee: $${fee.toFixed(2)} (${distanceMiles} mi${source})`;

    return NextResponse.json({ inRange: true, distance: distanceMiles, fee, message });
  } catch (err) {
    console.error("Delivery fee error:", err);
    return NextResponse.json({ error: "Failed to calculate delivery fee" }, { status: 500 });
  }
}
