import type { Metadata } from "next";
import NavBar from "../components/NavBar";

export const metadata: Metadata = {
  title: "Our Story | The Hungry Rooster",
  description:
    "Chef Jordona and Scarlet bring over 50 years of combined food service experience to every plate. Kosher certified by Dallas Kosher — the oldest certification agency in the Southwest.",
};

export default function StoryPage() {
  return (
    <main className="bg-black text-white min-h-screen">

      {/* NAV */}
      <NavBar active="Our Story" />

      {/* HERO */}
      <section className="px-6 pt-20 pb-10 max-w-6xl mx-auto">
        <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-4 text-center">The Hungry Rooster</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-center mb-6">
          Our Story
        </h1>
        <p className="text-zinc-400 text-xl text-center max-w-2xl mx-auto">
          50+ years of combined experience. One mission: food that hits different.
        </p>
      </section>

      {/* SQUAD GRAPHIC */}
      <section className="px-6 pb-10 max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-zinc-800">
          <img
            src="/the%20squad.png"
            alt="The Hungry Rooster Squad"
            className="w-full object-contain max-h-[320px]"
            style={{ mixBlendMode: "screen" }}
          />
        </div>
      </section>

      {/* WE DON'T JUST COOK */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">Who We Are</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              We Don&apos;t Just<br />Cook — We Crow.
            </h2>
          </div>
          <div>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Chef Jordona and industry expert Scarlet bring over 50 years of combined experience
              in food service. Our mission is clear: scratch-made meals bursting with bold
              flavors, genuine passion, and the kind of food that feels like home.
            </p>
            <p className="text-zinc-300 text-lg leading-relaxed mt-4">
              Whether you&apos;re ordering a quick bite or catering to a crowd, we prioritize
              freshness and authenticity — from our kitchen to your table. We create delicious,
              convenient food crafted with heart, hustle, and plenty of flavor.
            </p>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-zinc-800" />
      </div>

      {/* QUALITY SECTION */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 md:p-14">
          <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-3">Our Standard</p>
          <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
            Quality Food.<br />Anytime, Anywhere.
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed max-w-2xl">
            We believe quality should never be compromised — no matter when or where you enjoy your meal.
            Every decision we make, from sourcing the finest ingredients to meticulous preparation,
            cooking, and packaging, is crafted with you in mind. We attend to every detail to guarantee
            an exceptional experience, whether you&apos;re picking up, getting delivery, or hosting an event.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black border border-zinc-800 rounded-xl p-6">
              <p className="text-yellow-400 font-black text-3xl mb-2">50+</p>
              <p className="text-zinc-300 text-sm">Years of combined food service experience</p>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-6">
              <p className="text-teal-400 font-black text-3xl mb-2">100%</p>
              <p className="text-zinc-300 text-sm">Scratch-made — every dish, every time</p>
            </div>
            <div className="bg-black border border-zinc-800 rounded-xl p-6">
              <p className="text-yellow-400 font-black text-3xl mb-2">DK</p>
              <p className="text-zinc-300 text-sm">Dallas Kosher certified — oldest in the Southwest</p>
            </div>
          </div>
        </div>
      </section>

      {/* KOSHER SECTION */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-3">Kosher Certified</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Kosher? You bet your<br />tail feathers we are.
            </h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Certified by Dallas Kosher — the oldest kosher certification agency in the Southwest
              with over 50 years of legacy. This nonprofit delivers high-quality kosher supervision
              for discerning consumers and businesses locally and beyond.
            </p>
            <p className="text-zinc-300 text-lg leading-relaxed mt-4">
              The Hungry Rooster is proud to be a Dallas Kosher Certified partner. That means
              every dish, every ingredient, every time — you can eat with full confidence.
            </p>
            <a
              href="https://dallaskosher.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 mt-8 border border-zinc-700 hover:border-yellow-400 rounded-xl px-5 py-4 transition-colors group"
            >
              <span className="text-2xl">✡️</span>
              <div>
                <p className="font-black text-sm group-hover:text-yellow-400 transition-colors">Dallas Kosher Certified</p>
                <p className="text-zinc-500 text-xs">dallaskosher.org</p>
              </div>
            </a>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-5xl font-black text-yellow-400 leading-tight mb-2">Kosher?</p>
            <p className="text-4xl font-black text-white leading-tight">You bet your<br />tail feathers<br />we are!</p>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to eat?</h2>
        <p className="text-zinc-400 mb-10 text-lg">Order online, cater your next event, or send dinner as a gift.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/menu" className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-4 rounded-full text-lg transition-colors">
            Order Now
          </a>
          <a href="/catering" className="border-2 border-zinc-700 hover:border-zinc-400 text-white font-black px-8 py-4 rounded-full text-lg transition-colors">
            Book Catering
          </a>
          <a href="/gift" className="border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 font-black px-8 py-4 rounded-full text-lg transition-colors">
            Send a Gift
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
