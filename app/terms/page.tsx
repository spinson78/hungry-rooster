export const metadata = {
  title: "Terms & Conditions | The Hungry Rooster",
  description: "Terms and conditions for The Hungry Rooster.",
};

export default function TermsPage() {
  return (
    <main className="bg-black text-white min-h-screen px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-8 block">← The Hungry Rooster</a>
        <h1 className="text-4xl font-black mb-2">Terms &amp; Conditions</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-white font-black text-lg mb-2">1. Ordering</h2>
            <p>By placing an order through thehungryroostertx.com, you agree to provide accurate contact and delivery information. Orders are subject to availability. The Hungry Rooster reserves the right to cancel or modify orders due to availability or unforeseen circumstances.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">2. Payments</h2>
            <p>All payments are processed securely through Stripe. By completing a purchase, you authorize the charge to your payment method. All sales are final unless otherwise agreed upon by The Hungry Rooster.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">3. SMS Terms</h2>
            <p>By opting in to SMS communications, you agree to the following:</p>
            <ul className="list-disc ml-5 mt-3 space-y-2">
              <li>You will receive recurring automated marketing and transactional text messages from The Hungry Rooster.</li>
              <li><strong className="text-white">Message frequency:</strong> Approximately 1–4 messages per week.</li>
              <li><strong className="text-white">Msg &amp; data rates may apply.</strong></li>
              <li>Consent to receive SMS is not a condition of any purchase.</li>
              <li>To opt out at any time, reply <strong className="text-white">STOP</strong>. You will receive one final confirmation message.</li>
              <li>For help, reply <strong className="text-white">HELP</strong> or contact us at sales@thehungryroostertx.com.</li>
              <li>Your phone number will not be shared with or sold to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">4. Dietary &amp; Allergen Notice</h2>
            <p>The Hungry Rooster operates under kosher standards. While we take care to maintain kosher integrity, customers with severe allergies should contact us directly before ordering. We cannot guarantee a completely allergen-free environment.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">5. Limitation of Liability</h2>
            <p>The Hungry Rooster is not liable for delays, errors, or losses arising from circumstances beyond our reasonable control. Our maximum liability to any customer is limited to the value of their most recent order.</p>
          </section>

          <section>
            <h2 className="text-white font-black text-lg mb-2">6. Contact</h2>
            <p>Questions about these terms? Contact us:</p>
            <p className="mt-2"><strong className="text-white">The Hungry Rooster</strong><br />1499 Regal Row, Suite 206, Dallas TX<br />Email: sales@thehungryroostertx.com</p>
          </section>

        </div>
      </div>
    </main>
  );
}
