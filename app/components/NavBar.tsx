export default function NavBar({ active }: { active?: string }) {
  const links = [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/menu" },
    { label: "Catering", href: "/catering" },
    { label: "Shabbat", href: "/shabbat" },
    { label: "Gift Cards", href: "/gift" },
    { label: "Group Orders", href: "/group" },
    { label: "Our Concepts", href: "/#concepts" },
    { label: "Our Story", href: "/story" },
  ];

  return (
    <nav className="bg-black border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <a href="/" className="flex items-center">
        <img src="/THR%20hor%20logo%20final.png" alt="The Hungry Rooster" className="h-12 w-auto" />
      </a>
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
        {links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className={`transition-colors hover:text-white ${active === label ? "text-white" : "text-zinc-400"}`}
          >
            {label}
          </a>
        ))}
      </div>
      <a href="/menu" className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-5 py-2 rounded-full text-sm transition-colors">
        Order Now
      </a>
    </nav>
  );
}
