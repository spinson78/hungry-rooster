import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/app/components/NavBar";
import { blogPosts, getPostBySlug } from "@/lib/blog-posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — The Hungry Rooster`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.thehungryroostertx.com/blog/${post.slug}`,
      siteName: "The Hungry Rooster",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: "The Hungry Rooster",
      url: "https://www.thehungryroostertx.com",
    },
    publisher: {
      "@type": "Organization",
      name: "The Hungry Rooster",
      logo: {
        "@type": "ImageObject",
        url: "https://www.thehungryroostertx.com/THR%20hor%20logo%20final.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.thehungryroostertx.com/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar active="Blog" />
      <main className="min-h-screen bg-black text-white">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 pt-10">
          <nav className="text-xs text-zinc-600 flex items-center gap-2">
            <a href="/" className="hover:text-zinc-400 transition-colors">Home</a>
            <span>›</span>
            <a href="/blog" className="hover:text-zinc-400 transition-colors">Blog</a>
            <span>›</span>
            <span className="text-zinc-500">{post.category}</span>
          </nav>
        </div>

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 pt-8 pb-10">
          <div className="flex items-center gap-3 mb-5">
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
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">{post.description}</p>
        </header>

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-t border-zinc-800" />
        </div>

        {/* Body */}
        <article
          className="max-w-3xl mx-auto px-6 py-12 prose prose-invert prose-zinc
            prose-headings:font-black prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:text-yellow-300
            prose-li:text-zinc-300
            prose-strong:text-white
            max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <section className="border-t border-zinc-800 bg-zinc-900 py-16 mt-4">
          <div className="max-w-3xl mx-auto px-6 text-center">
            {post.category === "Shabbat" ? (
              <>
                <h2 className="text-3xl font-black text-white mb-3">Order This Week's Shabbat Box</h2>
                <p className="text-zinc-400 mb-8">
                  Cutoff is Friday at 9 AM. Order by Thursday evening to be safe.
                </p>
                <a
                  href="/shabbat"
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-3 rounded-full text-lg transition-colors inline-block"
                >
                  See This Week's Menu →
                </a>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-black text-white mb-3">Order a Dinner Drop</h2>
                <p className="text-zinc-400 mb-8">
                  Monday, Tuesday & Thursday. Order by noon, delivered same day.
                </p>
                <a
                  href="/dinner"
                  className="bg-teal-500 hover:bg-teal-400 text-black font-black px-8 py-3 rounded-full text-lg transition-colors inline-block"
                >
                  See This Week's Menu →
                </a>
              </>
            )}
          </div>
        </section>

        {/* Back to blog */}
        <div className="max-w-3xl mx-auto px-6 py-10">
          <a
            href="/blog"
            className="text-sm font-black text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Blog
          </a>
        </div>
      </main>
    </>
  );
}
