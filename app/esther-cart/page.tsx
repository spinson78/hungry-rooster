export default function EstherCartPage() {
  return (
    <main className="bg-black text-white min-h-screen">

      {/* NAVBAR */}
      <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a href="/">
          <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
        </a>
        <a href="/" className="text-zinc-400 hover:text-white text-sm font-bold transition-colors">← Back home</a>
      </nav>

      {/* CONTENT */}
      <section className="px-6 py-16 max-w-2xl mx-auto flex flex-col items-center text-center">
        <img
          src="/esther%20glow%20up.png"
          alt="Esther's Cart"
          className="w-full object-contain mb-8"
        />
        <p className="text-zinc-400 text-lg">
          Find us at our cart location — details coming soon!
        </p>
      </section>

    </main>
  );
}
