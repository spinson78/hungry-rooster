import NavBar from "../components/NavBar";

export const metadata = {
  title: "Privacy Policy | The Hungry Rooster",
  description: "Privacy policy for The Hungry Rooster including SMS messaging terms.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <NavBar />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: June 2026</p>

        <div className="space-y-10 text-zinc-300 leading-relaxed">

          <div>
            <h2 className="text-xl font-black text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide when placing an order or signing up for communications, including your name, email address, phone number, and delivery address. We use this information solely to fulfill your orders and communicate with you about your purchases.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-3">2. SMS / Text Messaging</h2>
            <p>By opting in to SMS communications at checkout, you agree to receive text messages from The Hungry Rooster, including order confirmations, delivery updates, review requests, and occasional promotional offers.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Message frequency varies based on your order activity and promotional events.</li>
              <li>Message and data rates may apply.</li>
              <li>Reply <strong className="text-white">STOP</strong> at any time to unsubscribe from SMS messages.</li>
              <li>Reply <strong className="text-white">HELP</strong> for help or contact us at 945-215-7907.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-3">3. Non-Sharing of Mobile Information</h2>
            <p>Mobile information and messaging consent are not shared with third parties or affiliates for marketing or promotional purposes. We do not sell, rent, share, or disclose your mobile phone number to any third party. Your phone number is used exclusively for communications from The Hungry Rooster.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-3">4. How We Use Your Information</h2>
            <p>Information collected is used to process and fulfill orders, send order confirmations and updates, respond to customer inquiries, send promotional messages to customers who have opted in, and improve our service.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-3">5. Data Security</h2>
            <p>We take reasonable steps to protect your personal information from unauthorized access, use, or disclosure. Payment processing is handled securely by Stripe and we do not store credit card information.</p>
          </div>

          <div>
            <h2 className="text-xl font-black text-white mb-3">6. Contact Us</h2>
            <p>If you have any questions about this privacy policy or your personal information, please contact us:</p>
            <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="font-black text-white">The Hungry Rooster</p>
              <p>1499 Regal Row, Suite 206, Dallas, TX 75247</p>
              <p>Phone: <a href="tel:9452157907" className="text-yellow-400 hover:underline">945-215-7907</a></p>
              <p>Email: <a href="mailto:spinson78@gmail.com" className="text-yellow-400 hover:underline">spinson78@gmail.com</a></p>
            </div>
          </div>

        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-10 text-center">
        <p className="text-zinc-600 text-xs">© 2026 The Hungry Rooster. Food that happens to be kosher.</p>
      </footer>
    </main>
  );
}
