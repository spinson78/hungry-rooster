import type { Metadata } from "next";
import NavBar from "@/app/components/NavBar";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — The Hungry Rooster | Kosher Food & Delivery in Dallas",
  description:
    "Tips, stories, and guides about kosher food delivery in Dallas — Shabbat boxes, weeknight dinner drops, catering, and more from The Hungry Rooster.",
  openGraph: {
    title: "Blog — The Hungry Rooster",
    description: "Kosher food delivery guides and stories from Dallas's own Hungry Rooster.",
    url: "https://www.thehungryroostertx.com/blog",
    siteName: "The Hungry Rooster",
    type: "website",
  },
};

export default function BlogIndex() {
  return (
    <>
      <NavBar active="Blog" />
      <main className="min-h-screen bg-black text-white">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-10">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-4">From the Kitchen</p>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            The Hungry Rooster Blog
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Guides, stories, and everything you need to know about kosher food delivery in Dallas.
          </p>
        </section>

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-t border-zinc-800" />
        </div>

        {/* Posts */}
        <section className="max-w-3xl mx-auto px-6 pt-10 pb-20 space-y-12">
          {blogPosts.map((post) => (
            <article key={post.slug}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-teal-400">
                  {post.category}
                </span>
                <span className="text-zinc-700 text-xs">·</span>
                <time className="text-xs text-zinc-500" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt + "T12:00:00").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span className="text-zinc-700 text-xs">·</span>
                <span className="text-xs text-zinc-500">{post.readingMinutes} min read</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-3 leading-snug hover:text-yellow-400 transition-colors">
                <a href={`/blog/${post.slug}`}>{post.title}</a>
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">{post.description}</p>
              <a
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-sm font-black text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Read more →
              </a>
              <div className="border-t border-zinc-800 mt-12" />
            </article>
          ))}
        </section>

        {/* CTA */}
        <section className="bg-zinc-900 border-t border-zinc-800 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black text-white mb-4">Ready to order?</h2>
            <p className="text-zinc-400 mb-8">
              Shabbat boxes every Friday. Dinner drops Monday, Tuesday & Thursday.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/shabbat"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-7 py-3 rounded-full transition-colors"
              >
                Shabbat Box
              </a>
              <a
                href="/dinner"
                className="bg-teal-500 hover:bg-teal-400 text-black font-black px-7 py-3 rounded-full transition-colors"
              >
                Dinner Drop
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
