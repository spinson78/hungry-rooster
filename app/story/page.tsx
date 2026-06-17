import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | The Hungry Rooster",
  description:
    "Chef Jordona and Scarlet bring over 50 years of combined food service experience to every plate. Kosher certified by Dallas Kosher — the oldest certification agency in the Southwest.",
};

export default function StoryPage() {
  return (
    <main className="bg-white text-black min-h-screen">

      {/* NAV */}
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <a href="/menu" className="hover:text-white transition-colors">Menu</a>
          <a href="/catering" className="hover:text-white transition-colors">Catering</a>
          <a href="/story" className="text-white">Our Story</a>
          <a href="/gift" className="hover:text-yellow-400 text-yellow-400/80 transition-colors">🎁 Gift Cards</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-black text-white px-6 py-20 text-center">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-4">The Hungry Rooster</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
          Our Story
        </h1>
      </section>

      {/* SECTION 1 — We Don't Just Cook */}
      <section className="bg-[#C5D9E8] px-6 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
            We Don&apos;t Just Cook—We Crow!
          </h2>
          <p className="text-[17px] leading-relaxed text-zinc-800">
            Chef Jordona and industry expert Scarlet bring over 50 years of combined experience
            in food service. Our mission is clear: to serve scratch-made meals bursting with bold
            flavors, a fun atmosphere, and genuine passion! Whether you&apos;re enjoying a quick bite
            or catering to a crowd, we create delicious, convenient food that feels like home—crafted
            with heart, hustle, and plenty of flavor. From our kitchen to your table, we prioritize
            freshness and authenticity, ensuring you keep coming back for more!
          </p>
        </div>
      </section>

      {/* SECTION 2 — Quality Food */}
      <section className="bg-white px-6 py-16 md:py-20 border-b border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
            Quality Food, Anytime, Anywhere!
          </h2>
          <p className="text-[17px] leading-relaxed text-zinc-700">
            We believe that quality should never be compromised, no matter when or where you decide
            to enjoy your meal. Every decision we make— from sourcing the finest ingredients to the
            meticulous preparation, cooking, and packaging— is crafted with you in mind. We attend
            to every detail to guarantee you an exceptional experience, whether you&apos;re picking up
            your order, receiving a delivery, or hosting an event.
          </p>
        </div>
      </section>

      {/* SECTION 3 — Kosher Certified */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">

          {/* Graphic placeholder — drop in the "Kosher? You bet your tail feathers we are!" image */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <div className="bg-[#3B82C4] rounded-2xl overflow-hidden aspect-square flex items-center justify-center text-white text-center p-8">
              {/* Replace this div with: <img src="/kosher-rooster.png" alt="Kosher certified" className="w-full h-full object-cover" /> */}
              <div>
                <p className="text-4xl font-black leading-tight mb-4">Kosher?</p>
                <p className="text-3xl font-black leading-tight mb-4">You bet your<br />tail feathers<br />we are!</p>
                <div className="text-6xl mt-4">🐓</div>
              </div>
            </div>
            <p className="text-zinc-400 text-xs text-center mt-2">Graphic coming soon — drop your image here</p>
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-yellow-500 font-bold text-sm uppercase tracking-widest mb-3">Kosher Certified</p>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
              Kosher certified by Dallas Kosher.
            </h2>
            <p className="text-[17px] leading-relaxed text-zinc-700">
              Certified by Dallas Kosher, THE Dallas Kosher boasts a legacy of over 50 years as the
              oldest kosher certification agency in the Southwest. This nonprofit organization delivers
              high-quality kosher supervision and certification for discerning consumers and businesses
              both locally and beyond. The Hungry Rooster is proud to be recognized as a Dallas Kosher
              Certified partner.
            </p>

            {/* Dallas Kosher badge */}
            <div className="mt-8 inline-flex items-center gap-3 border-2 border-zinc-200 rounded-xl px-5 py-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-2xl">✡️</div>
              <div>
                <p className="font-black text-sm">Dallas Kosher Certified</p>
                <p className="text-zinc-500 text-xs">dallaskosher.org</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to eat?</h2>
        <p className="text-zinc-400 mb-8 text-lg">Order online, cater your next event, or send dinner as a gift.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/menu" className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-4 rounded-full text-lg transition-colors">
            Order Now
          </a>
          <a href="/catering" className="border-2 border-zinc-700 hover:border-zinc-400 text-white font-black px-8 py-4 rounded-full text-lg transition-colors">
            Book Catering
          </a>
          <a href="/gift" className="border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 font-black px-8 py-4 rounded-full text-lg transition-colors">
            🎁 Send a Gift
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-zinc-800 px-6 py-10 text-center">
        <p className="text-zinc-500 text-sm">1499 Regal Row, Suite 206, Dallas, TX 75247 · Mon–Fri 9am–2pm CST</p>
        <p className="text-zinc-600 text-xs mt-2">Food that happens to be kosher. Fred Approved.</p>
      </footer>

    </main>
  );
}
