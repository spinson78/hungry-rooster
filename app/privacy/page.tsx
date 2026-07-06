export const metadata = {
  title: "Privacy Policy | The Hungry Rooster",
  description: "Privacy policy for The Hungry Rooster.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-black text-white min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-8 block">← The Hungry Rooster</a>
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-white font-black text-lg mb-2">1. Information We Collect</h2>
            <p>When you place an order or sign up for updates through our website (thehungryroostertx.com), we collect your name, email address, phone number, and delivery address. We use this information solely to process your orders and communicate with you about your purchases and our offerings.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">2. SMS / Text Messaging</h2>
            <p>If you opt in to receive text messages from The Hungry Rooster, you agree to receive recurring SMS messages including weekly menu announcements, Shabbat box availability, order updates, and occasional promotions.</p>
            <ul className="list-disc ml-5 mt-3 space-y-2">
              <li><strong className="text-white">Message frequency:</strong> Approximately 1–4 messages per week.</li>
              <li><strong className="text-white">Msg &amp; data rates may apply.</strong></li>
              <li><strong className="text-white">To opt out:</strong> Reply STOP to any message at any time. You will receive a one-time confirmation and no further messages will be sent.</li>
              <li><strong className="text-white">For help:</strong> Reply HELP or email sales@thehungryroostertx.com.</li>
              <li><strong className="text-white">Non-sharing:</strong> Your mobile phone number will never be sold, shared, or transferred to any third party for their marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">3. How We Use Your Information</h2>
            <p>We use your information to fulfill orders, send order confirmations, provide customer support, and — if you have opted in — send you promotional SMS messages. We do not sell or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">4. Data Security</h2>
            <p>We take reasonable measures to protect your personal information from unauthorized access or disclosure. Order and customer data is stored securely and accessible only to authorized staff.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">5. Third-Party Services</h2>
            <p>We use Stripe for payment processing and Twilio for SMS delivery. These services have their own privacy policies and security standards. We do not store full credit card numbers.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">6. Contact Us</h2>
            <p>For any privacy-related questions, contact us at:</p>
            <p className="mt-2"><strong className="text-white">The Hungry Rooster</strong><br />1499 Regal Row, Suite 206, Dallas TX<br />Email: sales@thehungryroostertx.com</p>
          </section>

        </div>
      </div>
    </main>
  );
}
