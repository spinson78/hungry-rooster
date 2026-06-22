import DinnerDropSection from "./components/DinnerDropSection";
import NavBar from "./components/NavBar";
import ShabbatSection from "./components/ShabbatSection";
import ShabbatReminderPopup from "./components/ShabbatReminderPopup";

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen">

      {/* NAVBAR */}
      <NavBar />

      {/* HERO */}
      <section className="px-6 py-20 md:py-32 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex justify-center">
          <img src="/white%20fred%20png.png" alt="Fred" className="max-w-xs w-full" />
        </div>
        <div className="flex-1">
          <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">
            Dallas, TX - Ghost Kitchen + Catering
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Go ahead.<br />
            <span className="text-yellow-400">Ruin your diet.</span><br />
            Fred approves.
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md leading-relaxed">
            Breakfast stacked. Salads snapped. Tenders slapped.
            Scratch-made, chef-driven food that happens to be kosher.
            Delivered to your coop.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="bg-zinc-700 text-zinc-400 font-black px-8 py-4 rounded-full text-lg cursor-not-allowed">
              Pickup / Delivery — Coming Soon
            </span>
            <span className="border-2 border-zinc-700 text-zinc-500 font-black px-8 py-4 rounded-full text-lg cursor-not-allowed">
              Book Catering — Coming Soon
            </span>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* FEATURED DISHES */}
      <section id="menu" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black">{"Here's what we're serving up"}</h2>
          <a href="/menu" className="text-teal-400 font-bold text-sm hover:text-teal-300 transition-colors">View full menu</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Cauliflower Salad", tag: "Fresh + Light" },
            { name: "Fish Sandwich", tag: "Fred Approved" },
            { name: "Caesar Salmon Wrap", tag: "Fresh Daily" },
            { name: "Chicken Strip Dinner", tag: "Fred Approved" },
          ].map((item) => (
            <div key={item.name} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-teal-500 transition-colors group cursor-pointer">
              <div className="aspect-square bg-zinc-800 flex items-center justify-center text-5xl">
                🍽️
              </div>
              <div className="p-4">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">{item.tag}</span>
                <p className="font-bold mt-1">{item.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* SHABBAT — dynamic */}
      <ShabbatSection />

      <div className="border-t border-zinc-800" />

      {/* DINNER DROP — dynamic */}
      <DinnerDropSection />

      <div className="border-t border-zinc-800" />

      {/* CONCEPTS */}
      <section id="concepts" className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black mb-2">Our Concepts</h2>
        <p className="text-zinc-400 mb-10">One kitchen. Three personalities. All Fred-approved.</p>
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <img src="/THR%20round%20final.png" alt="The Hungry Rooster" className="w-36 mb-5" />
            <h3 className="text-xl font-black mb-2">The Hungry Rooster</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              The main event. Breakfast, lunch, salads, and catering. Scratch-made, unapologetically good.
            </p>
            <a href="/menu" className="inline-block bg-yellow-400 text-black font-black px-6 py-2 rounded-full text-sm hover:bg-yellow-300 transition-colors">Order Here</a>
          </div>
          <div>
            <img src="/esther.png" alt="Esther's Cart" className="w-36 mb-5" />
            <h3 className="text-xl font-black mb-2">Esther&apos;s Cart</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Looking for Esther&apos;s location?{" "}
              <a href="/esther-cart" className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors">Click here.</a>
            </p>
          </div>
          <div>
            <div className="relative inline-block mb-5">
              <img src="/rico%20saucey.png" alt="Rico Saucey" className="w-36" />
              <span className="absolute top-2 right-0 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full rotate-12 shadow-lg">Coming Soon</span>
            </div>
            <h3 className="text-xl font-black mb-2">Rico Saucey</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Order kiosk with dirty sodas and serious flavor. Plus signature sauces to take home.
            </p>
            <a href="/rico" className="text-teal-400 text-sm font-bold hover:text-teal-300 transition-colors">Get saucy →</a>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* CATERING CTA */}
      <section id="catering" className="px-6 py-20 max-w-6xl mx-auto text-center">
        <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-4">Catering</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
          We pull up, feed your flock,<br />
          and make you look like a rockstar.
        </h2>
        <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
          Corporate. Schools. Weddings. Shiva. Whatever the occasion — we show up with food that hits.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <span className="bg-zinc-700 text-zinc-400 font-black px-10 py-5 rounded-full text-xl cursor-not-allowed inline-block">
            Order a Package — Coming Soon
          </span>
          <span className="border-2 border-zinc-700 text-zinc-500 font-black px-10 py-5 rounded-full text-xl cursor-not-allowed inline-block">
            Get a Custom Quote — Coming Soon
          </span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-10 w-auto mb-2" />
            <p className="text-zinc-500 text-sm">1499 Regal Row, Suite 206, Dallas, TX 75247</p>
            <p className="text-zinc-500 text-sm">Mon-Fri 9am-2pm CST</p>
            <p className="text-zinc-500 text-sm mt-1">Contact Us: <a href="tel:9452157907" className="hover:text-white transition-colors">945-215-7907</a></p>
          </div>
          <div className="flex items-center gap-6 text-zinc-400 text-sm font-semibold">
            <a href="https://instagram.com/thehungryroostertx" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://facebook.com/thehungryroostertx" className="hover:text-white transition-colors">Facebook</a>
            <a href="https://tiktok.com/@thehungryroostertx" className="hover:text-white transition-colors">TikTok</a>
          </div>
          <p className="text-zinc-600 text-xs">Food that happens to be kosher. Fred Approved.</p>
        </div>
      </footer>

      <ShabbatReminderPopup />
    </main>
  );
}