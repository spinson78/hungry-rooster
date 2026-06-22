import NavBar from "../components/NavBar";
export default function EstherCartPage() {
  return (
    <main className="bg-black text-white min-h-screen">

      {/* NAVBAR */}
      <NavBar />

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
