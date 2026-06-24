"use client";
import { useState, useEffect, useCallback } from "react";
import NavBar from "@/app/components/NavBar";

// ─── Photo lists ──────────────────────────────────────────────────────────────
// To add more photos: drop them in Folder 1 or Folder 2 and add the filename below
const F1 = "/Hungry%20Rooster%20Food%20Photos";
const F2 = "/Hungry%20Rooster%20Food%20Pics%202";

type Photo = { src: string; alt: string };

function p(folder: string, file: string, alt: string): Photo {
  return { src: `${folder}/${encodeURIComponent(file)}`, alt };
}

const PHOTOS: Photo[] = [
  // ── Folder 1 ──
  p(F1, "Cauliflower Menu.jpeg",                       "Cauliflower Salad"),
  p(F1, "Caesar Salmon Wrap Menu.jpeg",                "Caesar Salmon Wrap"),
  p(F1, "ck tender bucket menu.png",                   "Chicken Tender Bucket"),
  p(F1, "Classic Freds Chicken Menu.jpeg",             "Classic Fred's Chicken"),
  p(F1, "Big Cluck Burrito Menu.jpeg",                 "Big Cluck Burrito"),
  p(F1, "Chicken Caesar Wrap Menu.jpeg",               "Chicken Caesar Wrap"),
  p(F1, "chicken and waffles menu.jpeg",               "Chicken & Waffles"),
  p(F1, "fish tacos menu.jpeg",                        "Fish Tacos"),
  p(F1, "Catering Full Service 1.jpeg",                "Full-Service Catering"),
  p(F1, "Catering Full Service 2.jpeg",                "Full-Service Catering Spread"),
  p(F1, "Assorted Wraps Catering.jpeg",                "Assorted Wraps"),
  p(F1, "Wraps Catering.jpeg",                         "Wrap Spread"),
  p(F1, "Caprese Platter Catering.jpeg",               "Caprese Platter"),
  p(F1, "Charcuterie Boards Catering.jpeg",            "Charcuterie Boards"),
  p(F1, "Charcuterie Catering Sidecar Social 2.jpeg",  "Charcuterie at Sidecar Social"),
  p(F1, "Charcuteris catering sidecar social 3.jpeg",  "Charcuterie Spread"),
  p(F1, "Cheese Board Catering.JPG",                   "Cheese Board"),
  p(F1, "Cinnamon Rolls Catering.jpeg",                "Cinnamon Rolls"),
  p(F1, "Eggrolls catering.jpeg",                      "Egg Rolls"),
  p(F1, "Fruit Platter Catering.jpeg",                 "Fresh Fruit Platter"),
  p(F1, "Pasta Catering.jpeg",                         "Pasta"),
  p(F1, "Roasted Veggies Catering.jpeg",               "Roasted Vegetables"),
  p(F1, "Roshahannah Catering.JPG",                    "Rosh Hashanah Spread"),
  p(F1, "salmon Skewers Catering.jpeg",                "Salmon Skewers"),
  p(F1, "veggie crudite catering.jpeg",                "Veggie Crudité"),
  p(F1, "catering Cauliflower Salad.jpeg",             "Cauliflower Salad — Catering"),
  p(F1, "fajita veggies catering.JPG",                 "Fajita Vegetables"),
  p(F1, "house Foccacia Catering.JPG",                 "Housemade Focaccia"),
  p(F1, "Roasted Chicken Shabbat.jpeg",                "Roasted Chicken"),
  p(F1, "Shabbat Box Friday.JPG",                      "Shabbat Box"),
  p(F1, "Shabbat.jpeg",                                "Shabbat Spread"),
  p(F1, "Round Challah Bakery.jpeg",                   "Round Challah"),
  p(F1, "Housemade Bagels Bakery.jpeg",                "Housemade Bagels"),
  p(F1, "House Babka Bakery.jpg",                      "House Babka"),
  p(F1, "house bread bakery.jpeg",                     "House Bread"),
  p(F1, "house dough bakery.jpeg",                     "House Dough"),
  p(F1, "Esther first outing.JPEG",                    "Esther's Cart — First Outing"),

  // ── Folder 2 ──
  p(F2, "Freds Chicken Sandwich.jpg",       "Fred's Chicken Sandwich"),
  p(F2, "Fish Taco 2 Menu.jpeg",            "Fish Tacos"),
  p(F2, "fish sanwich Menu.jpeg",           "Fish Sandwich"),
  p(F2, "Roasted Salmon Dinner.jpeg",       "Roasted Salmon"),
  p(F2, "Bourekas Catering.jpeg",           "Bourekas"),
  p(F2, "Mezza Platter Catering.jpeg",      "Mezza Platter"),
  p(F2, "Catering Platters.jpeg",           "Catering Platters"),
  p(F2, "Morning Tea Platter Catering.jpeg","Morning Tea Platter"),
  p(F2, "French Toast Catering.jpeg",       "French Toast"),
  p(F2, "SMU catering 1.jpeg",              "SMU Catering"),
  p(F2, "SMU Catering2.jpeg",               "SMU Catering Spread"),
  p(F2, "Private Catering 1.jpeg",          "Private Event Catering"),
  p(F2, "Private Catering 2.jpeg",          "Private Event Spread"),
  p(F2, "Lunch Box.jpg",                    "Lunch Box"),
  p(F2, "Lunchboxes 3 Catering.jpeg",       "Lunch Boxes"),
  p(F2, "Packed Lunchbox.jpg",              "Packed Lunch Box"),
  p(F2, "Challah Bakery.jpeg",              "Fresh Challah"),
  p(F2, "Challah Dough Bakery.jpeg",        "Challah Dough"),
  p(F2, "Brownie Box Bakery.jpg",           "Brownie Box"),
  p(F2, "Pecan Pie Bakery.JPG",             "Pecan Pie"),
  p(F2, "Pineapple Upside Down Bakery.jpeg","Pineapple Upside Down Cake"),
  p(F2, "Esther Event.jpeg",                "Esther's Cart at an Event"),

  // ── Public folder extras ──
  p("", "Lox Catering Display.jpeg",        "Lox Catering Display"),
  p("", "Artisan Bagels.jpeg",              "Artisan Bagels"),
];

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox(i => (i === null || i === 0) ? PHOTOS.length - 1 : i - 1), []);
  const next = useCallback(() => setLightbox(i => (i === null || i === PHOTOS.length - 1) ? 0 : i + 1), []);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, close, prev, next]);

  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar active="Gallery" />

      {/* Header */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-3">The Hungry Rooster</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Food that speaks for itself.</h1>
        <p className="text-zinc-400 text-lg max-w-xl">
          Scratch-made, chef-driven kosher food — from weekday menu staples to full-service catering and everything in between.
        </p>
      </section>

      {/* Masonry grid */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              className="break-inside-avoid mb-3 cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={() => setLightbox(i)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full block rounded-xl transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover caption */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 rounded-xl flex items-end">
                <p className="text-white text-xs font-bold px-3 py-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {photo.alt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-zinc-400 text-xs font-bold tracking-widest uppercase">
            {lightbox + 1} / {PHOTOS.length}
          </div>

          {/* Close */}
          <button
            className="absolute top-4 right-5 text-zinc-400 hover:text-white text-3xl leading-none transition-colors"
            onClick={close}
          >
            ×
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-4xl leading-none transition-colors px-3 py-2"
            onClick={e => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>

          {/* Image */}
          <div
            className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={PHOTOS[lightbox].src}
              alt={PHOTOS[lightbox].alt}
              className="max-h-[78vh] max-w-full object-contain rounded-xl"
            />
            <p className="text-zinc-300 text-sm font-bold">{PHOTOS[lightbox].alt}</p>
          </div>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-4xl leading-none transition-colors px-3 py-2"
            onClick={e => { e.stopPropagation(); next(); }}
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
