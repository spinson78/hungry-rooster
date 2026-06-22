import NavBar from "../../components/NavBar";

export default function MenuSuccessPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="text-7xl mb-6">🐓</div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">Order confirmed!</h1>
        <p className="text-zinc-400 text-lg mb-2 max-w-md">
          Payment received. Fred is already on it — your order is in the kitchen.
        </p>
        <p className="text-zinc-500 text-sm mb-10">Check your email for a receipt. Questions? Text us.</p>
        <a href="/menu" className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-10 py-4 rounded-full text-lg transition-colors">
          Back to Menu
        </a>
      </div>
    </main>
  );
}
