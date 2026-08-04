export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  keywords: string[];
  category: string;
  readingMinutes: number;
  content: string; // HTML string
};

export const blogPosts: BlogPost[] = [
  {
    slug: "kosher-shabbat-dinner-delivery-dallas",
    title: "Kosher Shabbat Dinner Delivery in Dallas — The Hungry Rooster's Shabbat Box",
    description:
      "Looking for kosher Shabbat dinner delivery in Dallas? The Hungry Rooster delivers a fully prepared Shabbat box every Friday — fresh, home-style, and ready to serve.",
    publishedAt: "2025-07-18",
    updatedAt: "2025-07-18",
    keywords: [
      "kosher Shabbat dinner delivery Dallas",
      "Shabbat meals Dallas",
      "Shabbat box delivery Dallas",
      "kosher food delivery Dallas",
      "Shabbat dinner Dallas",
    ],
    category: "Shabbat",
    readingMinutes: 4,
    content: `
<p>Friday afternoons in Dallas can be chaotic — and for families who keep Shabbat, that crunch is real. Shopping, cooking, cleaning, getting everyone ready before candle lighting... it's a lot. The Hungry Rooster started the Shabbat Box specifically to take dinner off that list.</p>

<h2>What Is the Shabbat Box?</h2>
<p>Every week, Chef Fred puts together a fully prepared Shabbat dinner for two, four, or six people. Everything is kosher, home-style, and ready to serve — no reheating stress, no last-minute scramble. A typical Shabbat Box includes:</p>
<ul>
  <li>A protein main (think roasted chicken, brisket, or Fred's weekly special)</li>
  <li>Two sides — roasted vegetables, potatoes, rice, or seasonal options</li>
  <li>Challah (freshly baked, not store-bought)</li>
  <li>Soup when the menu calls for it</li>
</ul>
<p>The exact menu rotates weekly so it stays interesting. You can check what's in this week's box when you order on the <a href="/shabbat">Shabbat page</a>.</p>

<h2>How Delivery Works</h2>
<p>Orders are delivered to your door in the Dallas area every Friday, timed to arrive well before candle lighting. Delivery windows cover the greater Dallas area — if you're in North Dallas, Plano, Richardson, or nearby, you're covered.</p>
<p>Order cutoff is <strong>Friday at 9 AM</strong>. Orders placed after 9 AM won't make Friday's delivery, so we recommend ordering Thursday evening or Friday morning if your week is busy.</p>

<h2>Who Orders the Shabbat Box?</h2>
<p>Mostly families — couples, young kids, grandparents who want Shabbat at home without the full kitchen operation. But we also get a lot of singles and pairs who want something real for Friday night without the overhead of cooking for two. And out-of-town guests whose hosts don't have time to cook before Shabbat arrives.</p>

<h2>Is It Actually Kosher?</h2>
<p>Yes. The Hungry Rooster is a kosher kitchen. Everything is prepared under kosher supervision. If you have specific questions about supervision or certification, reach out directly and we'll be glad to walk you through it.</p>

<h2>How to Order</h2>
<p>Go to <a href="/shabbat">thehungryroostertx.com/shabbat</a>, pick your size, and check out. You'll get a confirmation email, and your box shows up Friday. That's it.</p>
<p>Questions? Email us at <a href="mailto:sales@thehungryroostertx.com">sales@thehungryroostertx.com</a> or use the contact form on the site.</p>
    `.trim(),
  },
  {
    slug: "weekly-kosher-dinner-drops-dallas",
    title: "Weekly Kosher Dinner Drops in Dallas — How The Hungry Rooster's Dinner Drop Works",
    description:
      "The Hungry Rooster delivers fresh kosher dinners to Dallas homes on Monday, Tuesday, and Thursday. No subscription required — just order, and Fred delivers.",
    publishedAt: "2025-07-25",
    updatedAt: "2025-07-25",
    keywords: [
      "weekly kosher dinner drops Dallas",
      "kosher dinner delivery Dallas",
      "kosher meal delivery Dallas",
      "kosher food Dallas",
      "kosher catering Dallas",
    ],
    category: "Dinner Drop",
    readingMinutes: 4,
    content: `
<p>A lot of people want to eat well on weeknights but don't have the time or energy to cook from scratch every day. For Dallas's kosher community, the options have historically been limited — cook it yourself, drive to a restaurant, or compromise on kashrut. The Hungry Rooster's Dinner Drop is a different answer.</p>

<h2>What's a Dinner Drop?</h2>
<p>A Dinner Drop is a freshly prepared kosher dinner delivered to your door on Monday, Tuesday, or Thursday. You order by noon, Chef Fred cooks it fresh, and it arrives the same day. No subscription, no meal kit to assemble — just a real dinner, ready to eat.</p>
<p>The menu rotates weekly with options like:</p>
<ul>
  <li>Grilled or roasted proteins (chicken, beef, salmon)</li>
  <li>Home-style sides — roasted potatoes, rice, sautéed vegetables</li>
  <li>Salads and starters when they're on the menu</li>
</ul>
<p>Everything is made in a kosher kitchen under kosher supervision.</p>

<h2>Who It's For</h2>
<p>Dinner Drops work well for a few different situations:</p>
<ul>
  <li><strong>Busy families</strong> who want a real weeknight dinner without the cooking. You get home, dinner is there.</li>
  <li><strong>Working professionals</strong> who keep kosher and don't have time to cook on weeknights.</li>
  <li><strong>Elderly parents or relatives</strong> who need reliable, fresh meals without going out.</li>
  <li><strong>Shiva meals and life events</strong> — we can drop dinners for a household during a mourning period or any time a family needs meals covered.</li>
</ul>

<h2>How to Order</h2>
<p>Go to <a href="/dinner">thehungryroostertx.com/dinner</a> and check the current week's menu. Choose what you want, enter your delivery address, and check out. Order by noon on your delivery day (Monday, Tuesday, or Thursday).</p>
<p>There's no subscription and no commitment. Order once, order every week — up to you.</p>

<h2>Delivery Area</h2>
<p>We deliver throughout the greater Dallas area, including North Dallas, Plano, Richardson, University Park, and surrounding communities. If you're not sure whether we reach you, email us at <a href="mailto:sales@thehungryroostertx.com">sales@thehungryroostertx.com</a> and we'll confirm.</p>

<h2>Catering and Group Orders</h2>
<p>If you're planning something bigger — a company lunch, an event, a recurring office delivery — check out our <a href="/catering">catering page</a> or our <a href="/group">group order program</a>. We set up dedicated ordering links for offices and groups so the process is simple every time.</p>
    `.trim(),
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
