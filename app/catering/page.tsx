"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ── PACKAGES (24hr notice, no minimum) ───────────────────────────────────────

const PACKAGE_SIZES = [
  { label: "4–6 people", price: 115 },
  { label: "8–10 people", price: 200 },
  { label: "12–15 people", price: 265 },
];

const PACKAGES = [
  { id: "showstopper", name: "The Showstopper", category: "Parve Breakfast", color: "teal", description: "Wake up and nosh like royalty. Fred's got the lox on lock.", items: ["Bagels and spread", "House-cured gravlax platter", "Scrambled eggs", "Assorted fruit salad", "Morning tea sweets platter"], choices: [] as { key: string; label: string; options: string[] }[] },
  { id: "meat-greet", name: "Fred's Meat and Greet", category: "Meat Breakfast", color: "yellow", description: "Turkey sausage, eggs, and a crispy side — your official cluck-in to the day.", items: ["Scrambled Eggs", "Turkey Breakfast Sausage Patties", "Fresh Fruit Salad", "Toasted Bagels", "Breakfast Potatoes"], choices: [] },
  { id: "strut-stuff", name: "The Strut and Stuff", category: "Meat Brunch", color: "yellow", description: "Wraps and savory bites. Brunch with attitude.", items: ["BBQ Chicken Salad Wrap Halves", "Potato Wedges with Maple Chili Glaze", "Fresh Fruit", "Parve Muffin Bites"], choices: [] },
  { id: "golden-plate", name: "The Golden Plate", category: "Parve Dinner", color: "teal", description: "Cozy up with a wholesome spread that brings the whole flock to the table.", items: ["Lemon herb roasted salmon", "House roasted veggies", "Garlic mashed potatoes", "Garden Salad"], choices: [] },
  { id: "pasta-la-vista", name: "Pasta La Vista", category: "Parve Dinner", color: "teal", description: "Pasta night just got an upgrade!", items: ["Choice of pasta sauce", "Garden salad", "Garlic breadsticks", "Cookies"], choices: [{ key: "pasta", label: "Choose your pasta sauce", options: ["Pesto", "Marinara"] }] },
  { id: "roost-roast", name: "Roost and Roast", category: "Meat Dinner", color: "yellow", description: "Golden. Juicy. Fred's take on the classic roast.", items: ["Roasted herb chicken", "House roasted veggies", "Rice Pilaf", "Garden salad"], choices: [] },
  { id: "saucy-flock", name: "The Saucy Flock", category: "Meat Dinner", color: "yellow", description: "Meatballs made with love, pasta with purpose. Twirl it like you mean it.", items: ["Spaghetti and meatballs", "Garden salad", "Breadsticks", "Cookies"], choices: [] },
  { id: "cluckin-smash", name: "The Cluckin Smash", category: "Meat Dinner", color: "yellow", description: "Stack it, sauce it, smash it. Burger night just hit the coop.", items: ["Smash burger bar (patties, buns, lettuce, tomato, onion, pickles, Fred sauce)", "House seasoned fries", "Cookies"], choices: [] },
  { id: "gettin-strippy", name: "Gettin' Strippy with It", category: "Meat Dinner", color: "yellow", description: "Crispy, golden, and ready to dip. No shame in gettin' strippy with it.", items: ["Fried chicken strips with Fred sauce", "House seasoned fries", "Cookies"], choices: [] },
];

const PKG_CATEGORIES = ["All", "Parve Breakfast", "Meat Breakfast", "Meat Brunch", "Parve Dinner", "Meat Dinner"];

// ── À LA CARTE MENU ($100 min, 24hr notice) ─────────────────────────────────────

type SizeOption = { label: string; serving: string; price: number };
type ItemOption = { key: string; label: string; choices: string[] };
type CateringItem = { id: string; name: string; description: string; tag?: string; sizes?: SizeOption[]; options?: ItemOption[]; priceNote?: string; };
type CateringCategory = { id: string; name: string; note?: string; items: CateringItem[]; };

const ALC_CATEGORIES: CateringCategory[] = [
  {
    id: "salads", name: "Salads", note: "Freshly prepared in black bowls with clear lids. Dressing on the side.",
    items: [
      { id: "harvest", name: "Hen House Harvest Salad", description: "Romaine, shredded carrots, chickpeas, cherry tomatoes, cucumber, hard-boiled egg, red onion, bell peppers, mushrooms, croutons, honey mustard dressing.", sizes: [{ label: "Small", serving: "10–15 people", price: 75 }, { label: "Medium", serving: "20–25 people", price: 125 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "caesar-sal", name: "Caesar Salad", description: "Romaine, garlic herb croutons, chickpeas, signature Caesar dressing.", sizes: [{ label: "Small", serving: "10–15 people", price: 75 }, { label: "Medium", serving: "20–25 people", price: 125 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "southwest", name: "Southwest Salad", description: "Romaine, cherry tomatoes, pico, avocado, fried tortilla strips, roasted corn & black bean salsa, charred green onion dressing.", sizes: [{ label: "Small", serving: "10–15 people", price: 75 }, { label: "Medium", serving: "20–25 people", price: 125 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "cauliflower-sal", name: "Cauliflower Salad", description: "Kale, roasted cauliflower, spiced chickpeas, cucumber, pickled onions, hard-boiled egg, avocado, garlic tahini dressing.", sizes: [{ label: "Small", serving: "10–15 people", price: 75 }, { label: "Medium", serving: "20–25 people", price: 125 }, { label: "Large", serving: "25–30 people", price: 150 }] },
    ],
  },
  {
    id: "sides", name: "Sides", note: "Fully cooked and ready to reheat in heavy-duty foil trays.",
    items: [
      { id: "roasted-potato", name: "Seasoned Roasted Potatoes", description: "Roasted with paprika, garlic, olive oil, salt, and pepper.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
      { id: "sweet-potato", name: "Honey Roasted Sweet Potatoes", description: "Roasted sweet potatoes with olive oil, honey, salt, and pepper.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
      { id: "mashed", name: "Mashed Potatoes", description: "Creamy mashed potatoes blended with roasted buttery garlic.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
      { id: "green-beans", name: "Roasted Green Beans", description: "Fresh green beans roasted with garlic, olive oil, salt, and pepper.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
      { id: "roasted-veg", name: "Roasted Vegetables", description: "Sweet potatoes, squash, zucchini, mushrooms, onions, and bell peppers.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
      { id: "rice", name: "Steamed Basmati Rice", description: "Light and fluffy steamed basmati rice.", sizes: [{ label: "Small", serving: "4–6 people", price: 25 }, { label: "Medium", serving: "10–15 people", price: 55 }, { label: "Large", serving: "25–30 people", price: 115 }] },
    ],
  },
  {
    id: "chicken", name: "Chicken", note: "Fully cooked, ready to reheat. Available as chicken breast or boneless thighs.",
    items: [
      { id: "garlic-herb-ck", name: "Garlic Herb Chicken", description: "Marinated with garlic, herbs, and olive oil.", sizes: [{ label: "Small", serving: "4–6 people", price: 36 }, { label: "Medium", serving: "10–15 people", price: 90 }, { label: "Large", serving: "25–30 people", price: 180 }], options: [{ key: "cut", label: "Chicken cut", choices: ["Chicken Breast", "Boneless Thighs"] }] },
      { id: "honey-mustard-ck", name: "Honey Mustard Glazed Chicken", description: "Glazed with sweet and tangy honey mustard.", sizes: [{ label: "Small", serving: "4–6 people", price: 36 }, { label: "Medium", serving: "10–15 people", price: 90 }, { label: "Large", serving: "25–30 people", price: 180 }], options: [{ key: "cut", label: "Chicken cut", choices: ["Chicken Breast", "Boneless Thighs"] }] },
      { id: "lemon-pepper-ck", name: "Lemon Pepper Chicken", description: "Fresh lemon and cracked black pepper.", sizes: [{ label: "Small", serving: "4–6 people", price: 36 }, { label: "Medium", serving: "10–15 people", price: 90 }, { label: "Large", serving: "25–30 people", price: 180 }], options: [{ key: "cut", label: "Chicken cut", choices: ["Chicken Breast", "Boneless Thighs"] }] },
      { id: "teriyaki-ck", name: "Teriyaki Chicken", description: "Marinated in our house teriyaki sauce.", sizes: [{ label: "Small", serving: "4–6 people", price: 36 }, { label: "Medium", serving: "10–15 people", price: 90 }, { label: "Large", serving: "25–30 people", price: 180 }], options: [{ key: "cut", label: "Chicken cut", choices: ["Chicken Breast", "Boneless Thighs"] }] },
      { id: "bbq-ck", name: "BBQ Chicken", description: "Glazed in tangy BBQ sauce.", sizes: [{ label: "Small", serving: "4–6 people", price: 36 }, { label: "Medium", serving: "10–15 people", price: 90 }, { label: "Large", serving: "25–30 people", price: 180 }], options: [{ key: "cut", label: "Chicken cut", choices: ["Chicken Breast", "Boneless Thighs"] }] },
      { id: "nuggets", name: "Rooster Signature Chicken Nuggets", description: "Hand-battered and fried golden. 5 nuggets per serving.", tag: "Fred Approved", sizes: [{ label: "Small", serving: "6 servings", price: 36 }, { label: "Medium", serving: "15 servings", price: 90 }, { label: "Large", serving: "30 servings", price: 180 }] },
      { id: "tenders", name: "Rooster Signature Chicken Tenders", description: "Hand-battered and fried golden. 3 tenders per serving.", tag: "Fred Approved", sizes: [{ label: "Small", serving: "6 servings", price: 36 }, { label: "Medium", serving: "15 servings", price: 90 }, { label: "Large", serving: "30 servings", price: 180 }] },
    ],
  },
  {
    id: "fish", name: "Fish", note: "Fully cooked, ready to reheat. Available as salmon or snapper.",
    items: [
      { id: "garlic-lemon-fish", name: "Garlic Lemon", description: "Fillets with fresh lemon, garlic, salt, and pepper.", sizes: [{ label: "Small", serving: "6 people", price: 48 }, { label: "Medium", serving: "15 people", price: 120 }, { label: "Large", serving: "30 people", price: 240 }], options: [{ key: "fish", label: "Fish type", choices: ["Salmon", "Snapper"] }] },
      { id: "honey-mustard-fish", name: "Honey Mustard Glazed", description: "Fillets in a sweet and tangy honey mustard glaze.", sizes: [{ label: "Small", serving: "6 people", price: 48 }, { label: "Medium", serving: "15 people", price: 120 }, { label: "Large", serving: "30 people", price: 240 }], options: [{ key: "fish", label: "Fish type", choices: ["Salmon", "Snapper"] }] },
      { id: "lemon-dill-fish", name: "Lemon Dill", description: "Fillets with lemon juice, fresh dill, salt, and pepper.", sizes: [{ label: "Small", serving: "6 people", price: 48 }, { label: "Medium", serving: "15 people", price: 120 }, { label: "Large", serving: "30 people", price: 240 }], options: [{ key: "fish", label: "Fish type", choices: ["Salmon", "Snapper"] }] },
      { id: "teriyaki-fish", name: "Teriyaki Glazed", description: "Fillets brushed with house-made teriyaki sauce.", sizes: [{ label: "Small", serving: "6 people", price: 48 }, { label: "Medium", serving: "15 people", price: 120 }, { label: "Large", serving: "30 people", price: 240 }], options: [{ key: "fish", label: "Fish type", choices: ["Salmon", "Snapper"] }] },
    ],
  },
  {
    id: "platters", name: "Platters", note: "Presented on black disposable trays with clear lids, ready to serve.",
    items: [
      { id: "fruit-platter", name: "Fruit Platter", description: "Fresh seasonal fruit assortment.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "crudite", name: "Raw Crudité Vegetable Platter", description: "Crisp seasonal vegetables with signature dips.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "roasted-veg-platter", name: "Roasted Vegetable Platter", description: "Roasted seasonal vegetables, simply prepared.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "bourekas", name: "Bourekas Platter", description: "Crispy, flaky bourekas — spinach, mushroom, and potato.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "pastry", name: "Pastry Platter", description: "Bite-sized scratch-made pastries baked fresh in-house.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "morning-tea", name: "Morning Tea Sweets Platter", description: "Pastries and English muffins.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "honey-jam", name: "Honey and Jam Platter", description: "Toasted English muffins with butter, jam, and honey.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "french-toast", name: "French Toast Sticks", description: "Golden challah French toast sticks, crisp outside, soft inside.", sizes: [{ label: "Small", serving: "10–15 people", price: 70 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "lox", name: "Lox Platter", description: "House-cured salmon with tomato, cucumber, and purple onion.", tag: "Fan Favorite", sizes: [{ label: "Small", serving: "10–15 people", price: 135 }, { label: "Medium", serving: "20–25 people", price: 180 }, { label: "Large", serving: "25–30 people", price: 230 }] },
    ],
  },
  {
    id: "wraps", name: "Wraps", note: "Minimum 5 wraps per order. $12 each.",
    items: [
      { id: "egg-wrap", name: "Egg Salad Wrap", description: "Whole wheat wrap with house-made egg salad, lettuce, tomatoes, and purple onions.", priceNote: "$12 each · 5 minimum" },
      { id: "tuna-wrap", name: "Tuna Salad Wrap", description: "Whole wheat wrap with house-made tuna salad, romaine, tomatoes, and purple onions.", priceNote: "$12 each · 5 minimum" },
      { id: "salmon-wrap", name: "Caesar Salmon Wrap", description: "Whole wheat wrap with roasted salmon, romaine, and Caesar dressing.", priceNote: "$12 each · 5 minimum" },
      { id: "grilled-chicken-wrap", name: "Grilled Chicken Wrap", description: "Whole wheat wrap with grilled chicken, shredded lettuce, tomato, red onion, and Fred's sauce.", priceNote: "$12 each · 5 minimum" },
      { id: "crispy-chicken-wrap", name: "Crispy Chicken Wrap", description: "Flour tortilla with crispy fried chicken, shredded lettuce, tomato, pickle, and house spicy BBQ sauce.", priceNote: "$12 each · 5 minimum" },
    ],
  },
  {
    id: "per-pound", name: "Per Pound", note: "2 lb minimum per item. Approx. 4 oz per person.",
    items: [
      { id: "tuna-lb", name: "Tuna Salad", description: "Flaked albacore tuna with celery, shallots, lime, salt, pepper, and a touch of mayo.", priceNote: "$14.99 / lb" },
      { id: "egg-lb", name: "Egg Salad", description: "Hard-boiled eggs with parsley, dill, celery, salt, pepper, spicy mustard, and light mayo.", priceNote: "$12.99 / lb" },
      { id: "salmon-lb", name: "Fresh Roasted Salmon Salad", description: "Herb-roasted Atlantic salmon with dill, lemon, parsley, salt, pepper, and light mayo.", priceNote: "$16.99 / lb" },
    ],
  },
  {
    id: "bowls", name: "Bowls", note: "Sturdy black bowls with clear lids.",
    items: [
      { id: "fruit-bowl", name: "Fruit Salad", description: "Fresh seasonal fruit assortment.", sizes: [{ label: "Small", serving: "10–15 people", price: 65 }, { label: "Medium", serving: "20–25 people", price: 100 }, { label: "Large", serving: "25–30 people", price: 150 }] },
      { id: "tortilla-chips", name: "House-Fried Tortilla Chips", description: "Freshly fried in-house, perfectly seasoned.", sizes: [{ label: "Small", serving: "10–15 people", price: 55 }, { label: "Medium", serving: "20–25 people", price: 70 }, { label: "Large", serving: "25–30 people", price: 110 }] },
      { id: "kettle-chips", name: "House Kettle Chips", description: "Kettle-cooked in-house, perfectly seasoned.", sizes: [{ label: "Small", serving: "10–15 people", price: 55 }, { label: "Medium", serving: "20–25 people", price: 70 }, { label: "Large", serving: "25–30 people", price: 110 }] },
    ],
  },
];

const ORDER_MIN = 100;
const WRAP_PRICE = 12;
const WRAP_MIN = 5;

type CartEntry = { id: string; categoryName: string; itemName: string; size?: string; serving?: string; price: number; options: Record<string, string>; qty: number; type: "sized" | "wrap" | "per_pound"; };
type Flow = "choose" | "package" | "alacarte" | "quote";

const getMinDate = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString().split("T")[0];
};

export default function CateringPage() {
  const [flow, setFlow] = useState<Flow>("choose");

  // Package state
  const [pkgCatFilter, setPkgCatFilter] = useState("All");
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [pkgSize, setPkgSize] = useState(PACKAGE_SIZES[0]);
  const [pkgChoices, setPkgChoices] = useState<Record<string, string>>({});

  // À la carte state
  const [alcCat, setAlcCat] = useState(ALC_CATEGORIES[0].id);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAlcForm, setShowAlcForm] = useState(false);

  // Modal
  const [modal, setModal] = useState<CateringItem | null>(null);
  const [modalCatName, setModalCatName] = useState("");
  const [modalCatType, setModalCatType] = useState<"sized" | "wrap" | "per_pound">("sized");
  const [modalSize, setModalSize] = useState<SizeOption | null>(null);
  const [modalOptions, setModalOptions] = useState<Record<string, string>>({});
  const [modalQty, setModalQty] = useState(WRAP_MIN);
  const [modalLbs, setModalLbs] = useState(2);

  // Forms
  const [pkgForm, setPkgForm] = useState({ name: "", phone: "", email: "", address: "", address_city: "", event_date: "", special_requests: "" });
  const [alcForm, setAlcForm] = useState({ name: "", phone: "", email: "", address: "", address_city: "", event_date: "", special_requests: "" });
  const [quoteForm, setQuoteForm] = useState({ name: "", phone: "", email: "", event_date: "", headcount: "", event_type: "", location: "", budget: "", notes: "" });

  const [pkgFulfillment, setPkgFulfillment] = useState<"pickup" | "delivery">("delivery");
  const [alcFulfillment, setAlcFulfillment] = useState<"pickup" | "delivery">("delivery");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Delivery fee state — à la carte
  const [alcDelivFee, setAlcDelivFee] = useState<number | null>(null);
  const [alcDelivDist, setAlcDelivDist] = useState<number | null>(null);
  const [alcDelivMsg, setAlcDelivMsg] = useState("");
  const [alcDelivErr, setAlcDelivErr] = useState("");
  const [checkingAlcDeliv, setCheckingAlcDeliv] = useState(false);

  // Delivery fee state — packages
  const [pkgDelivFee, setPkgDelivFee] = useState<number | null>(null);
  const [pkgDelivDist, setPkgDelivDist] = useState<number | null>(null);
  const [pkgDelivMsg, setPkgDelivMsg] = useState("");
  const [pkgDelivErr, setPkgDelivErr] = useState("");
  const [checkingPkgDeliv, setCheckingPkgDeliv] = useState(false);

  const isWeekend = (() => { const d = new Date().getDay(); return d === 0 || d === 6; })();

  const checkDeliveryFee = async (address: string, which: "alc" | "pkg") => {
    if (!address.trim() || address.trim().length < 10) return;
    const setChecking = which === "alc" ? setCheckingAlcDeliv : setCheckingPkgDeliv;
    const setFee = which === "alc" ? setAlcDelivFee : setPkgDelivFee;
    const setDist = which === "alc" ? setAlcDelivDist : setPkgDelivDist;
    const setMsg = which === "alc" ? setAlcDelivMsg : setPkgDelivMsg;
    const setErr = which === "alc" ? setAlcDelivErr : setPkgDelivErr;
    setChecking(true); setErr(""); setMsg("");
    try {
      const res = await fetch("/api/delivery-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!data.inRange || data.error) {
        setErr(data.message || data.error || "Outside our delivery radius (30 miles max).");
        setFee(null);
        setDist(null);
      } else {
        setFee(data.fee);
        setDist(data.distance ?? null);
        setMsg(data.message || "");
      }
    } catch {
      setErr("Couldn't verify address. Please enter a full street address.");
    }
    setChecking(false);
  };

  // Auto-calculate delivery fee for à la carte form (handles autofill & typing)
  useEffect(() => {
    if (!alcForm.address.trim() || !alcForm.address_city.trim()) {
      setAlcDelivFee(null); setAlcDelivDist(null); setAlcDelivMsg(""); setAlcDelivErr("");
      return;
    }
    const timer = setTimeout(() => {
      checkDeliveryFee(`${alcForm.address.trim()}, ${alcForm.address_city.trim()}`, "alc");
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alcForm.address, alcForm.address_city]);

  // Auto-calculate delivery fee for package form (handles autofill & typing)
  useEffect(() => {
    if (!pkgForm.address.trim() || !pkgForm.address_city.trim()) {
      setPkgDelivFee(null); setPkgDelivDist(null); setPkgDelivMsg(""); setPkgDelivErr("");
      return;
    }
    const timer = setTimeout(() => {
      checkDeliveryFee(`${pkgForm.address.trim()}, ${pkgForm.address_city.trim()}`, "pkg");
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgForm.address, pkgForm.address_city]);

  const alcCategory = ALC_CATEGORIES.find(c => c.id === alcCat)!;
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartDelivFee = alcDelivFee ?? 0;
  const cartTotal = cartSubtotal + cartDelivFee;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const meetsMin = cartSubtotal >= ORDER_MIN;

  const filteredPkgs = pkgCatFilter === "All" ? PACKAGES : PACKAGES.filter(p => p.category === pkgCatFilter);

  const selectPkg = (pkg: typeof PACKAGES[0]) => {
    setSelectedPkg(pkg);
    const d: Record<string, string> = {};
    pkg.choices.forEach(c => { d[c.key] = c.options[0]; });
    setPkgChoices(d);
  };

  const openModal = (item: CateringItem, cat: CateringCategory) => {
    const type = cat.id === "wraps" ? "wrap" : cat.id === "per-pound" ? "per_pound" : "sized";
    setModal(item); setModalCatName(cat.name); setModalCatType(type);
    setModalSize(item.sizes ? item.sizes[0] : null);
    const d: Record<string, string> = {};
    item.options?.forEach(o => { d[o.key] = o.choices[0]; });
    setModalOptions(d); setModalQty(WRAP_MIN); setModalLbs(2);
  };

  const getModalPrice = () => {
    if (!modal) return 0;
    if (modalCatType === "wrap") return WRAP_PRICE * modalQty;
    if (modalCatType === "per_pound") {
      const rate = modal.id === "tuna-lb" ? 14.99 : modal.id === "egg-lb" ? 12.99 : 16.99;
      return rate * modalLbs;
    }
    return modalSize?.price ?? 0;
  };

  const addToCart = () => {
    if (!modal) return;
    const entry: CartEntry = {
      id: `${modal.id}-${Date.now()}`, categoryName: modalCatName,
      itemName: modal.name + (Object.values(modalOptions).length ? ` (${Object.values(modalOptions).join(", ")})` : ""),
      size: modalCatType === "sized" ? modalSize?.label : modalCatType === "wrap" ? `${modalQty} wraps` : `${modalLbs} lbs`,
      serving: modalCatType === "sized" ? modalSize?.serving : undefined,
      price: getModalPrice(), options: modalOptions, qty: 1, type: modalCatType,
    };
    setCart(prev => [...prev, entry]); setModal(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const submitNotify = async (payload: object) => {
    await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  };

  const handlePkgSubmit = async () => {
    const needsAddress = pkgFulfillment === "delivery";
    if (!pkgForm.name || !pkgForm.phone || !pkgForm.event_date || !selectedPkg) { setError("Please fill in all required fields."); return; }
    if (needsAddress && (!pkgForm.address || !pkgForm.address_city)) { setError("Please enter your delivery address."); return; }
    if (needsAddress && pkgDelivErr) { setError(pkgDelivErr); return; }
    setSubmitting(true); setError("");
    const delivFee = needsAddress ? (pkgDelivFee ?? 0) : 0;
    const total = pkgSize.price + delivFee;
    const fullPkgAddress = needsAddress ? `${pkgForm.address.trim()}, ${pkgForm.address_city.trim()}` : "Pickup";
    const choicesSummary = Object.entries(pkgChoices).map(([k, v]) => `${selectedPkg.choices.find(c => c.key === k)?.label}: ${v}`);
    const items = [{ name: selectedPkg.name, category: selectedPkg.category, size: pkgSize.label, includes: selectedPkg.items, choices: choicesSummary }];
    const res = await fetch("/api/catering-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow_type: "package",
        customer_name: pkgForm.name,
        customer_email: pkgForm.email,
        customer_phone: pkgForm.phone,
        customer_address: fullPkgAddress,
        event_date: pkgForm.event_date,
        special_requests: pkgForm.special_requests,
        items,
        subtotal: pkgSize.price,
        delivery_fee: delivFee,
        delivery_distance_miles: needsAddress ? (pkgDelivDist ?? 0) : 0,
        total,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleAlcSubmit = async () => {
    const needsAddress = alcFulfillment === "delivery";
    if (!alcForm.name || !alcForm.phone || !alcForm.event_date) { setError("Please fill in all required fields."); return; }
    if (needsAddress && (!alcForm.address || !alcForm.address_city)) { setError("Please enter your delivery address."); return; }
    if (needsAddress && alcDelivErr) { setError(alcDelivErr); return; }
    setSubmitting(true); setError("");
    const delivFee = needsAddress ? cartDelivFee : 0;
    const total = cartSubtotal + delivFee;
    const fullAlcAddress = needsAddress ? `${alcForm.address.trim()}, ${alcForm.address_city.trim()}` : "Pickup";
    const res = await fetch("/api/catering-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow_type: "alacarte",
        customer_name: alcForm.name,
        customer_email: alcForm.email,
        customer_phone: alcForm.phone,
        customer_address: fullAlcAddress,
        event_date: alcForm.event_date,
        special_requests: alcForm.special_requests,
        items: cart,
        subtotal: cartSubtotal,
        delivery_fee: delivFee,
        delivery_distance_miles: needsAddress ? (alcDelivDist ?? 0) : 0,
        total,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleQuoteSubmit = async () => {
    if (!quoteForm.name || !quoteForm.phone || !quoteForm.email || !quoteForm.event_date) { setError("Please fill in your name, phone, email, and event date."); return; }
    setSubmitting(true); setError("");
    await submitNotify({ order_type: "catering_inquiry", customer_name: quoteForm.name, customer_phone: quoteForm.phone, customer_email: quoteForm.email, customer_address: quoteForm.location || "TBD", special_requests: `Event: ${quoteForm.event_type} · Headcount: ${quoteForm.headcount} · Budget: ${quoteForm.budget} · Notes: ${quoteForm.notes}`, items: [], total: 0 });
    setSubmitted(true); setSubmitting(false);
  };

  const inputCls = (accent = "teal") => `w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-${accent}-500 text-sm`;

  if (submitted) {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🐓</div>
          <h1 className="text-4xl font-black mb-4">{flow === "quote" ? "We got your inquiry!" : "Order received!"}</h1>
          <p className="text-zinc-400 text-lg mb-2">{flow === "quote" ? "Our team will be in touch within 24 hours." : "Fred is on it. We'll confirm by phone."}</p>
          <a href="/" className="mt-8 inline-block bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-4 rounded-full text-lg transition-colors">Back to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen">
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <a href="/"><img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" /></a>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-400">
          <a href="/menu" className="hover:text-white transition-colors">Menu</a>
          <a href="/catering" className="text-white">Catering</a>
          <a href="/group" className="hover:text-white transition-colors">Group Orders</a>
          <a href="/shabbat" className="hover:text-white transition-colors">Shabbat</a>
          <a href="/story" className="hover:text-white transition-colors">Our Story</a>
          <a href="/#concepts" className="hover:text-white transition-colors">Our Concepts</a>
          <a href="/gift" className="hover:text-white transition-colors">Gift Cards</a>
        </div>
        <div className="flex items-center gap-4">
          {flow === "alacarte" && !showAlcForm && cartCount > 0 && (
            <button onClick={() => setCartOpen(true)} className="bg-teal-500 hover:bg-teal-400 text-black font-black px-5 py-2 rounded-full text-sm transition-colors">
              Cart ({cartCount}) — ${cartSubtotal.toFixed(2)}
            </button>
          )}
        </div>
      </nav>

      <div className="px-6 py-12 max-w-5xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Catering</p>
        <h1 className="text-4xl md:text-5xl font-black mb-3">We pull up and feed your flock.</h1>
        <p className="text-zinc-400 mb-10 max-w-xl">Corporate. Schools. Weddings. Shiva. Whatever the occasion — scratch-made, chef-driven food that hits.</p>

        {/* ── FLOW CHOOSER ──────────────────────────────────────────────── */}
        {flow === "choose" && (
          <div className="grid md:grid-cols-3 gap-6">
            <button onClick={() => setFlow("package")} className="bg-zinc-900 border border-zinc-700 hover:border-teal-500 rounded-2xl p-7 text-left transition-colors group">
              <p className="text-3xl mb-4">📦</p>
              <p className="font-black text-xl mb-2">Order a Package</p>
              <p className="text-zinc-400 text-sm mb-4">Curated family-style meals. Serves 4–15. 24-hour notice. No order minimum.</p>
              <span className="text-teal-400 font-bold text-sm group-hover:text-teal-300">From $115 →</span>
            </button>
            <button onClick={() => setFlow("alacarte")} className="bg-zinc-900 border border-zinc-700 hover:border-yellow-400 rounded-2xl p-7 text-left transition-colors group">
              <p className="text-3xl mb-4">🍽️</p>
              <p className="font-black text-xl mb-2">Build Your Order</p>
              <p className="text-zinc-400 text-sm mb-4">Choose from salads, sides, chicken, fish, platters, wraps, and more. $100 minimum · 24-hour notice.</p>
              <span className="text-yellow-400 font-bold text-sm group-hover:text-yellow-300">Browse menu →</span>
            </button>
            <button onClick={() => setFlow("quote")} className="bg-zinc-900 border border-zinc-700 hover:border-zinc-400 rounded-2xl p-7 text-left transition-colors group">
              <p className="text-3xl mb-4">📋</p>
              <p className="font-black text-xl mb-2">Get a Custom Quote</p>
              <p className="text-zinc-400 text-sm mb-4">Large events, custom menus, or something specific. Our team will build a proposal just for you.</p>
              <span className="text-zinc-400 font-bold text-sm group-hover:text-white">Contact us →</span>
            </button>
          </div>
        )}

        {/* ── PACKAGE FLOW ──────────────────────────────────────────────── */}
        {flow === "package" && (
          <div>
            <button onClick={() => { setFlow("choose"); setSelectedPkg(null); }} className="text-zinc-400 hover:text-white text-sm mb-8 block">← Back</button>
            <div className="flex gap-3 mb-4 items-center">
              <span className="bg-teal-500/20 text-teal-400 text-xs font-bold px-3 py-1 rounded-full">24-hour notice</span>
              <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">No order minimum</span>
            </div>

            {!selectedPkg ? (
              <>
                <div className="flex flex-wrap gap-2 mb-8">
                  {PKG_CATEGORIES.map(c => (
                    <button key={c} onClick={() => setPkgCatFilter(c)} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${pkgCatFilter === c ? "bg-teal-500 text-black" : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white"}`}>{c}</button>
                  ))}
                </div>
                <div className="space-y-4">
                  {filteredPkgs.map(pkg => (
                    <button key={pkg.id} onClick={() => selectPkg(pkg)} className="w-full bg-zinc-900 border border-zinc-700 hover:border-teal-500 rounded-2xl p-6 text-left transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs font-black uppercase tracking-widest ${pkg.color === "teal" ? "text-teal-400" : "text-yellow-400"}`}>{pkg.category}</span>
                          <p className="font-black text-lg">{pkg.name}</p>
                        </div>
                        <span className="text-white font-black text-sm whitespace-nowrap ml-4">from $115</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-3">{pkg.description}</p>
                      <p className="text-zinc-500 text-xs">{pkg.items.join(" · ")}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedPkg(null)} className="text-zinc-400 hover:text-white text-sm">← Choose a different package</button>
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <span className={`text-xs font-black uppercase tracking-widest ${selectedPkg.color === "teal" ? "text-teal-400" : "text-yellow-400"}`}>{selectedPkg.category}</span>
                  <h2 className="text-2xl font-black mb-1">{selectedPkg.name}</h2>
                  <p className="text-zinc-400 text-sm mb-4">{selectedPkg.description}</p>
                  <ul className="space-y-1">{selectedPkg.items.map(item => <li key={item} className="text-sm text-zinc-300">• {item}</li>)}</ul>
                </div>

                {selectedPkg.choices.map(choice => (
                  <div key={choice.key} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">{choice.label}</p>
                    <div className="flex flex-wrap gap-3">
                      {choice.options.map(opt => (
                        <button key={opt} onClick={() => setPkgChoices({ ...pkgChoices, [choice.key]: opt })}
                          className={`px-6 py-3 rounded-full font-bold text-sm border transition-colors ${pkgChoices[choice.key] === opt ? "border-teal-500 bg-teal-500/20 text-teal-300" : "border-zinc-600 text-zinc-400 hover:border-zinc-400"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <p className="font-bold mb-4 text-sm uppercase tracking-wide text-zinc-300">Choose your size</p>
                  <div className="space-y-3">
                    {PACKAGE_SIZES.map(size => (
                      <label key={size.label} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${pkgSize.label === size.label ? "border-teal-500 bg-zinc-800" : "border-zinc-700 hover:border-teal-500"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" checked={pkgSize.label === size.label} onChange={() => setPkgSize(size)} className="accent-teal-500" />
                          <span className="font-bold text-sm">{size.label}</span>
                        </div>
                        <span className="font-black">${size.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <h2 className="text-xl font-black mb-6">Event Info</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} className={inputCls()} /></div>
                      <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone *</label><input type="tel" placeholder="(214) 555-0100" value={pkgForm.phone} onChange={e => setPkgForm({ ...pkgForm, phone: e.target.value })} className={inputCls()} /></div>
                    </div>
                    <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={pkgForm.email} onChange={e => setPkgForm({ ...pkgForm, email: e.target.value })} className={inputCls()} /></div>
                    <div>
                      <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">Pickup or Delivery? *</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setPkgFulfillment("pickup")} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${pkgFulfillment === "pickup" ? "border-teal-500 bg-teal-500/20 text-teal-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"}`}>🚗 Pickup</button>
                        <button type="button" onClick={() => setPkgFulfillment("delivery")} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${pkgFulfillment === "delivery" ? "border-teal-500 bg-teal-500/20 text-teal-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"}`}>🚚 Delivery</button>
                      </div>
                    </div>
                    {pkgFulfillment === "delivery" && (
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                        <input
                          type="text"
                          placeholder="Street address (e.g. 1234 Main St, Suite 100)"
                          value={pkgForm.address}
                          onChange={e => {
                            setPkgForm({ ...pkgForm, address: e.target.value });
                            setPkgDelivFee(null); setPkgDelivDist(null); setPkgDelivMsg(""); setPkgDelivErr("");
                          }}
                          className={inputCls()}
                        />
                        <input
                          type="text"
                          placeholder="City, State, ZIP (e.g. Dallas, TX 75201)"
                          value={pkgForm.address_city}
                          onChange={e => {
                            setPkgForm({ ...pkgForm, address_city: e.target.value });
                            setPkgDelivFee(null); setPkgDelivDist(null); setPkgDelivMsg(""); setPkgDelivErr("");
                          }}
                          onBlur={e => {
                            if (pkgForm.address.trim() && e.target.value.trim()) {
                              checkDeliveryFee(`${pkgForm.address.trim()}, ${e.target.value.trim()}`, "pkg");
                            }
                          }}
                          className={inputCls()}
                        />
                        {checkingPkgDeliv && <p className="text-zinc-500 text-xs">Checking delivery range...</p>}
                        {!checkingPkgDeliv && pkgDelivMsg && <p className="text-teal-400 text-xs">✓ {pkgDelivMsg}</p>}
                        {!checkingPkgDeliv && pkgDelivErr && <p className="text-red-400 text-xs">✗ {pkgDelivErr}</p>}
                      </div>
                    )}
                    <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Date * <span className="text-zinc-500 normal-case font-normal">(24-hour notice)</span></label><input type="date" min={getMinDate(24)} value={pkgForm.event_date} onChange={e => setPkgForm({ ...pkgForm, event_date: e.target.value })} className={inputCls()} /></div>
                    <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Allergies, setup notes, gate codes..." value={pkgForm.special_requests} onChange={e => setPkgForm({ ...pkgForm, special_requests: e.target.value })} className={`${inputCls()} resize-none h-20`} /></div>
                  </div>
                  {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                  {pkgDelivErr && <p className="text-red-400 text-sm mt-3">✗ {pkgDelivErr}</p>}
                  <div className="mt-6 mb-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-400">Package</span><span>${pkgSize.price}</span></div>
                    {pkgFulfillment === "delivery" && (
                      pkgDelivFee !== null ? (
                        <div className="flex justify-between"><span className="text-zinc-400">Delivery fee</span><span>${pkgDelivFee.toFixed(2)}</span></div>
                      ) : (
                        <div className="flex justify-between text-zinc-600"><span>Delivery fee</span><span>enter address above</span></div>
                      )
                    )}
                    <div className="flex justify-between font-black text-xl border-t border-zinc-700 pt-2 mt-1">
                      <span>Total</span>
                      <span>${(pkgSize.price + (pkgFulfillment === "delivery" ? (pkgDelivFee ?? 0) : 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={handlePkgSubmit} disabled={submitting || (pkgFulfillment === "delivery" && !!pkgDelivErr)} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full text-lg transition-colors disabled:opacity-50">
                    {submitting ? "Redirecting to payment..." : `Pay Now — $${(pkgSize.price + (pkgFulfillment === "delivery" ? (pkgDelivFee ?? 0) : 0)).toFixed(2)}`}
                  </button>
                  <p className="text-zinc-600 text-xs text-center mt-3">Secure payment via Stripe. Fred&apos;s crew will confirm by phone within 24 hours.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── À LA CARTE FLOW ───────────────────────────────────────────── */}
        {flow === "alacarte" && !showAlcForm && (
          <div>
            <button onClick={() => setFlow("choose")} className="text-zinc-400 hover:text-white text-sm mb-6 block">← Back</button>

            {/* Weekend closed banner */}
            {isWeekend && (
              <div className="bg-red-950 border border-red-800 rounded-2xl px-6 py-5 mb-6 flex items-start gap-4">
                <span className="text-2xl">🚫</span>
                <div>
                  <p className="text-red-400 font-black text-sm uppercase tracking-wide mb-1">We&apos;re closed on weekends</p>
                  <p className="text-zinc-400 text-sm">Online orders are available Monday – Friday. Browse the menu and come back Monday to place your order.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mb-8 flex-wrap items-center">
              <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">$100 order minimum</span>
              <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">Delivery from $7.99</span>
              <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full">24-hour notice</span>
            </div>

            <div className="flex gap-2 flex-wrap mb-8">
              {ALC_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setAlcCat(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${alcCat === cat.id ? "bg-teal-500 text-black" : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white"}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            {alcCategory.note && <p className="text-zinc-500 text-sm mb-6">{alcCategory.note}</p>}

            <div className="grid md:grid-cols-2 gap-4 mb-32">
              {alcCategory.items.map(item => (
                <button key={item.id} onClick={() => openModal(item, alcCategory)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-teal-500 rounded-2xl p-6 text-left transition-colors w-full">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {item.tag && <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-1">{item.tag}</p>}
                      <p className="font-black text-lg mb-2">{item.name}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {item.priceNote ? <p className="text-white font-bold text-sm">{item.priceNote}</p> : item.sizes ? <p className="text-white font-bold text-sm">from ${item.sizes[0].price}</p> : null}
                      <div className="mt-3 bg-teal-500 hover:bg-teal-400 text-black font-black w-9 h-9 rounded-full text-xl flex items-center justify-center">+</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {cart.length > 0 && (
              <div className={`fixed bottom-0 left-0 right-0 p-4 bg-black border-t z-30 ${meetsMin && !isWeekend ? "border-zinc-800" : "border-red-900/50"}`}>
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-lg">${cartSubtotal.toFixed(2)} <span className="text-zinc-400 font-normal text-sm">+ delivery (calculated at checkout)</span></p>
                    {!meetsMin && <p className="text-red-400 text-xs font-bold">${(ORDER_MIN - cartSubtotal).toFixed(2)} more to reach the $100 minimum</p>}
                    {isWeekend && <p className="text-red-400 text-xs font-bold">Closed weekends — orders open Monday</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setCartOpen(true)} className="border border-zinc-600 text-zinc-300 font-bold px-5 py-3 rounded-full text-sm hover:border-white transition-colors">Review ({cartCount})</button>
                    <button onClick={() => { if (meetsMin && !isWeekend) setShowAlcForm(true); }} disabled={!meetsMin || isWeekend}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-full text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* À LA CARTE ORDER FORM */}
        {flow === "alacarte" && showAlcForm && (
          <div>
            <button onClick={() => setShowAlcForm(false)} className="text-zinc-400 hover:text-white text-sm mb-8 block">← Back to menu</button>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
              <h2 className="font-black text-lg mb-4">Your Order</h2>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div><p className="font-bold text-sm">{item.itemName}</p>{item.size && <p className="text-zinc-500 text-xs">{item.size}{item.serving ? ` · ${item.serving}` : ""}</p>}</div>
                    <div className="flex items-center gap-3"><span className="font-black text-sm">${(item.price * item.qty).toFixed(2)}</span><button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-400 text-xs">✕</button></div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
                {cartDelivFee > 0 ? (
                  <div className="flex justify-between text-sm"><span className="text-zinc-400">Delivery</span><span>${cartDelivFee.toFixed(2)}</span></div>
                ) : (
                  <div className="flex justify-between text-sm text-zinc-600"><span>Delivery</span><span>enter address above</span></div>
                )}
                <div className="flex justify-between font-black text-lg mt-2"><span>Total</span><span className="text-yellow-400">${cartTotal.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-6">Event Info</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={alcForm.name} onChange={e => setAlcForm({ ...alcForm, name: e.target.value })} className={inputCls()} /></div>
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone *</label><input type="tel" placeholder="(214) 555-0100" value={alcForm.phone} onChange={e => setAlcForm({ ...alcForm, phone: e.target.value })} className={inputCls()} /></div>
                </div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email</label><input type="email" placeholder="jane@email.com" value={alcForm.email} onChange={e => setAlcForm({ ...alcForm, email: e.target.value })} className={inputCls()} /></div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-2 block">Pickup or Delivery? *</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAlcFulfillment("pickup")} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${alcFulfillment === "pickup" ? "border-yellow-400 bg-yellow-400/20 text-yellow-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"}`}>🚗 Pickup</button>
                    <button type="button" onClick={() => setAlcFulfillment("delivery")} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors ${alcFulfillment === "delivery" ? "border-yellow-400 bg-yellow-400/20 text-yellow-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-400"}`}>🚚 Delivery</button>
                  </div>
                </div>
                {alcFulfillment === "delivery" && (
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Delivery Address *</label>
                    <input
                      type="text"
                      placeholder="Street address (e.g. 1234 Main St, Suite 100)"
                      value={alcForm.address}
                      onChange={e => {
                        setAlcForm({ ...alcForm, address: e.target.value });
                        setAlcDelivFee(null); setAlcDelivDist(null); setAlcDelivMsg(""); setAlcDelivErr("");
                      }}
                      className={inputCls()}
                    />
                    <input
                      type="text"
                      placeholder="City, State, ZIP (e.g. Dallas, TX 75201)"
                      value={alcForm.address_city}
                      onChange={e => {
                        setAlcForm({ ...alcForm, address_city: e.target.value });
                        setAlcDelivFee(null); setAlcDelivDist(null); setAlcDelivMsg(""); setAlcDelivErr("");
                      }}
                      onBlur={e => {
                        if (alcForm.address.trim() && e.target.value.trim()) {
                          checkDeliveryFee(`${alcForm.address.trim()}, ${e.target.value.trim()}`, "alc");
                        }
                      }}
                      className={inputCls()}
                    />
                    {checkingAlcDeliv && <p className="text-zinc-500 text-xs">Checking delivery range...</p>}
                    {!checkingAlcDeliv && alcDelivMsg && <p className="text-teal-400 text-xs">✓ {alcDelivMsg}</p>}
                    {!checkingAlcDeliv && alcDelivErr && <p className="text-red-400 text-xs">✗ {alcDelivErr}</p>}
                  </div>
                )}
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Date * <span className="text-zinc-500 normal-case font-normal">(24-hour notice required)</span></label><input type="date" min={getMinDate(24)} value={alcForm.event_date} onChange={e => setAlcForm({ ...alcForm, event_date: e.target.value })} className={inputCls()} /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Special Requests</label><textarea placeholder="Allergies, setup notes, gate codes..." value={alcForm.special_requests} onChange={e => setAlcForm({ ...alcForm, special_requests: e.target.value })} className={`${inputCls()} resize-none h-20`} /></div>
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              {alcFulfillment === "delivery" && alcDelivErr && <p className="text-red-400 text-sm mt-3">✗ {alcDelivErr}</p>}
              <button
                onClick={handleAlcSubmit}
                disabled={submitting || (alcFulfillment === "delivery" && !!alcDelivErr)}
                className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50"
              >
                {submitting ? "Redirecting to payment..." : `Pay Now — $${(cartSubtotal + (alcFulfillment === "delivery" ? cartDelivFee : 0)).toFixed(2)}`}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">Secure payment via Stripe. We&apos;ll confirm by phone within 24 hours.</p>
            </div>
          </div>
        )}

        {/* ── QUOTE FLOW ────────────────────────────────────────────────── */}
        {flow === "quote" && (
          <div>
            <button onClick={() => setFlow("choose")} className="text-zinc-400 hover:text-white text-sm mb-8 block">← Back</button>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-xl font-black mb-2">Tell us about your event</h2>
              <p className="text-zinc-400 text-sm mb-6">Our team will reach out within 24 hours with a custom proposal.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Full Name *</label><input type="text" placeholder="Jane Smith" value={quoteForm.name} onChange={e => setQuoteForm({ ...quoteForm, name: e.target.value })} className={inputCls("yellow")} /></div>
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Phone *</label><input type="tel" placeholder="(214) 555-0100" value={quoteForm.phone} onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })} className={inputCls("yellow")} /></div>
                </div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Email *</label><input type="email" placeholder="jane@email.com" value={quoteForm.email} onChange={e => setQuoteForm({ ...quoteForm, email: e.target.value })} className={inputCls("yellow")} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Date *</label><input type="date" value={quoteForm.event_date} onChange={e => setQuoteForm({ ...quoteForm, event_date: e.target.value })} className={inputCls("yellow")} /></div>
                  <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Headcount</label><input type="text" placeholder="e.g. 50 people" value={quoteForm.headcount} onChange={e => setQuoteForm({ ...quoteForm, headcount: e.target.value })} className={inputCls("yellow")} /></div>
                </div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Type</label><input type="text" placeholder="Corporate lunch, Wedding, Shiva..." value={quoteForm.event_type} onChange={e => setQuoteForm({ ...quoteForm, event_type: e.target.value })} className={inputCls("yellow")} /></div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Event Location</label><input type="text" placeholder="Address or venue name" value={quoteForm.location} onChange={e => setQuoteForm({ ...quoteForm, location: e.target.value })} className={inputCls("yellow")} /></div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Budget Range</label>
                  <select value={quoteForm.budget} onChange={e => setQuoteForm({ ...quoteForm, budget: e.target.value })} className={inputCls("yellow")}>
                    <option value="">Select a range...</option>
                    <option>Under $500</option><option>$500 – $1,000</option><option>$1,000 – $2,500</option><option>$2,500 – $5,000</option><option>$5,000+</option>
                  </select>
                </div>
                <div><label className="text-xs text-zinc-400 uppercase tracking-wide mb-1 block">Anything else?</label><textarea placeholder="Dietary restrictions, vibe, special requests..." value={quoteForm.notes} onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} className={`${inputCls("yellow")} resize-none h-24`} /></div>
              </div>
              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              <button onClick={handleQuoteSubmit} disabled={submitting} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-full text-lg transition-colors mt-6 disabled:opacity-50">
                {submitting ? "Sending..." : "Send My Catering Inquiry"}
              </button>
              <p className="text-zinc-600 text-xs text-center mt-3">We&apos;ll be in touch within 24 hours. No commitment required.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── ITEM MODAL ──────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-black pr-4">{modal.name}</h2>
                <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-white text-2xl leading-none shrink-0">×</button>
              </div>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{modal.description}</p>

              {modalCatType === "sized" && modal.sizes && (
                <div className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Choose size</p>
                  <div className="space-y-2">
                    {modal.sizes.map(s => (
                      <label key={s.label} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${modalSize?.label === s.label ? "border-teal-500 bg-zinc-800" : "border-zinc-700 hover:border-teal-500"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" checked={modalSize?.label === s.label} onChange={() => setModalSize(s)} className="accent-teal-500" />
                          <div><span className="font-bold text-sm">{s.label}</span><span className="text-zinc-500 text-xs ml-2">{s.serving}</span></div>
                        </div>
                        <span className="font-black">${s.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {modal.options?.map(opt => (
                <div key={opt.key} className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">{opt.label}</p>
                  <div className="flex gap-3 flex-wrap">
                    {opt.choices.map(choice => (
                      <button key={choice} onClick={() => setModalOptions({ ...modalOptions, [opt.key]: choice })}
                        className={`px-5 py-2 rounded-full font-bold text-sm border transition-colors ${modalOptions[opt.key] === choice ? "border-teal-500 bg-teal-500/20 text-teal-300" : "border-zinc-600 text-zinc-400 hover:border-zinc-400"}`}>
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {modalCatType === "wrap" && (
                <div className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Quantity <span className="text-zinc-500 normal-case font-normal">(min 5)</span></p>
                  <div className="flex items-center gap-4 bg-zinc-800 rounded-full px-4 py-2 w-fit">
                    <button onClick={() => setModalQty(Math.max(WRAP_MIN, modalQty - 1))} className="text-xl font-bold text-zinc-400 hover:text-white">−</button>
                    <span className="font-black w-8 text-center">{modalQty}</span>
                    <button onClick={() => setModalQty(modalQty + 1)} className="text-xl font-bold text-zinc-400 hover:text-white">+</button>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">${WRAP_PRICE} each · Total: ${(WRAP_PRICE * modalQty).toFixed(2)}</p>
                </div>
              )}

              {modalCatType === "per_pound" && (
                <div className="mb-6">
                  <p className="font-bold mb-3 text-sm uppercase tracking-wide text-zinc-300">Pounds <span className="text-zinc-500 normal-case font-normal">(min 2 lbs)</span></p>
                  <div className="flex items-center gap-4 bg-zinc-800 rounded-full px-4 py-2 w-fit">
                    <button onClick={() => setModalLbs(Math.max(2, modalLbs - 1))} className="text-xl font-bold text-zinc-400 hover:text-white">−</button>
                    <span className="font-black w-8 text-center">{modalLbs}</span>
                    <button onClick={() => setModalLbs(modalLbs + 1)} className="text-xl font-bold text-zinc-400 hover:text-white">+</button>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">~{modalLbs * 4} servings at 4oz each</p>
                </div>
              )}

              <button onClick={addToCart} className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black py-3 rounded-full transition-colors mt-2">
                Add to Order — ${getModalPrice().toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ─────────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-end">
          <div className="bg-zinc-900 w-full max-w-sm h-full flex flex-col border-l border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-black">Your Order</h2>
              <button onClick={() => setCartOpen(false)} className="text-zinc-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? <p className="text-zinc-500 text-sm">Nothing added yet.</p> : cart.map(item => (
                <div key={item.id} className="border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm flex-1 pr-2">{item.itemName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-sm">${(item.price * item.qty).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                  {item.size && <p className="text-zinc-500 text-xs">{item.size}{item.serving ? ` · ${item.serving}` : ""}</p>}
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-800 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-zinc-500"><span>Delivery</span><span>calculated at checkout</span></div>
                <div className="flex justify-between font-black text-lg"><span>Subtotal</span><span className="text-yellow-400">${cartSubtotal.toFixed(2)}</span></div>
                {!meetsMin && <p className="text-red-400 text-xs">${(ORDER_MIN - cartSubtotal).toFixed(2)} more to reach the $100 minimum</p>}
                {isWeekend && <p className="text-red-400 text-xs font-bold">Orders are closed on weekends — come back Monday!</p>}
                <button onClick={() => { setCartOpen(false); if (meetsMin && !isWeekend) setShowAlcForm(true); }} disabled={!meetsMin || isWeekend}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-full transition-colors mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue to Details
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
