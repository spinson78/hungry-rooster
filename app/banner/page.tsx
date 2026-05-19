"use client";
import { useState, useEffect, useRef } from "react";

const BANNER_PASSWORD = "fredapproves";

export default function BannerBuilderPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [weekDate, setWeekDate] = useState("");
  const [orderUrl, setOrderUrl] = useState("hungry-rooster.vercel.app");
  const [monDate, setMonDate] = useState("");
  const [monMenu, setMonMenu] = useState("");
  const [tueDate, setTueDate] = useState("");
  const [tueMenu, setTueMenu] = useState("");
  const [thuDate, setThuDate] = useState("");
  const [thuMenu, setThuMenu] = useState("");
  const [shabDate, setShabDate] = useState("");
  const [shabMenu, setShabMenu] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const scalePreview = () => {
    if (!wrapRef.current || !innerRef.current) return;
    const scale = Math.min(1, wrapRef.current.offsetWidth / 820);
    innerRef.current.style.transform = `scale(${scale})`;
    innerRef.current.style.transformOrigin = "top left";
    wrapRef.current.style.height = `${Math.round(312 * scale)}px`;
  };

  useEffect(() => {
    scalePreview();
    window.addEventListener("resize", scalePreview);
    return () => window.removeEventListener("resize", scalePreview);
  }, [authed]);

  if (!authed) {
    return (
      <main style={{ background: "#111", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#1c1c1c", border: "1px solid #27272a", borderRadius: 16, padding: 40, width: 320, textAlign: "center" }}>
          <img src="/THR%20hor%20logo%20final.png" alt="THR" style={{ height: 36, margin: "0 auto 20px" }} />
          <p style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 18 }}>Banner Builder</p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && (password === BANNER_PASSWORD ? setAuthed(true) : setPasswordError(true))}
            style={{ width: "100%", background: "#27272a", border: "1px solid #3f3f46", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
          />
          {passwordError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>Incorrect password</p>}
          <button
            onClick={() => password === BANNER_PASSWORD ? setAuthed(true) : setPasswordError(true)}
            style={{ width: "100%", background: "#2dd4bf", color: "#000", fontWeight: 900, padding: "12px 0", borderRadius: 50, border: "none", fontSize: 15, cursor: "pointer", marginTop: 4 }}
          >
            Open Builder
          </button>
        </div>
      </main>
    );
  }

  const inputCls = "w-full text-sm text-white placeholder-zinc-600 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 outline-none focus:border-teal-500";
  const textareaCls = `${inputCls} resize-y`;

  return (
    <main style={{ background: "#111", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#2dd4bf", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>The Hungry Rooster</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Weekly Banner Builder</h1>
          <p style={{ color: "#71717a", fontSize: 13 }}>Fill in this week&apos;s menus — the banner updates live. Screenshot the preview to post on Facebook.</p>
        </div>

        {/* Details */}
        <div style={{ background: "#1c1c1c", border: "1px solid #27272a", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#52525b", marginBottom: 14 }}>Banner Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#71717a", display: "block", marginBottom: 5 }}>Week of</label>
              <input className={inputCls} type="text" placeholder="May 19 – 23, 2026" value={weekDate} onChange={e => setWeekDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#71717a", display: "block", marginBottom: 5 }}>Order link</label>
              <input className={inputCls} type="text" value={orderUrl} onChange={e => setOrderUrl(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Menus */}
        <div style={{ background: "#1c1c1c", border: "1px solid #27272a", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#52525b", marginBottom: 16 }}>This Week&apos;s Menus</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {/* Monday */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "#2dd4bf", borderBottom: "2px solid #2dd4bf", paddingBottom: 5, marginBottom: 10 }}>Monday</p>
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Date</label>
              <input className={inputCls} placeholder="Mon, May 20" value={monDate} onChange={e => setMonDate(e.target.value)} style={{ marginBottom: 8 }} />
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Menu</label>
              <textarea className={textareaCls} rows={4} placeholder={"Protein\nSide 1\nSide 2\nSide 3"} value={monMenu} onChange={e => setMonMenu(e.target.value)} />
            </div>
            {/* Tuesday */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "#2dd4bf", borderBottom: "2px solid #2dd4bf", paddingBottom: 5, marginBottom: 10 }}>Tuesday</p>
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Date</label>
              <input className={inputCls} placeholder="Tue, May 21" value={tueDate} onChange={e => setTueDate(e.target.value)} style={{ marginBottom: 8 }} />
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Menu</label>
              <textarea className={textareaCls} rows={4} placeholder={"Protein\nSide 1\nSide 2\nSide 3"} value={tueMenu} onChange={e => setTueMenu(e.target.value)} />
            </div>
            {/* Thursday */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "#2dd4bf", borderBottom: "2px solid #2dd4bf", paddingBottom: 5, marginBottom: 10 }}>Thursday</p>
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Date</label>
              <input className={inputCls} placeholder="Thu, May 23" value={thuDate} onChange={e => setThuDate(e.target.value)} style={{ marginBottom: 8 }} />
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Menu</label>
              <textarea className={textareaCls} rows={4} placeholder={"Protein\nSide 1\nSide 2\nSide 3"} value={thuMenu} onChange={e => setThuMenu(e.target.value)} />
            </div>
            {/* Shabbat */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "#e9c46a", borderBottom: "2px solid #e9c46a", paddingBottom: 5, marginBottom: 10 }}>✦ Shabbat</p>
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Date</label>
              <input className={inputCls} placeholder="Fri, May 24" value={shabDate} onChange={e => setShabDate(e.target.value)} style={{ marginBottom: 8 }} />
              <label style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 }}>Menu</label>
              <textarea className={textareaCls} rows={4} placeholder={"Protein\nSide 1\nSide 2\nChallah\n+ Dessert add-on"} value={shabMenu} onChange={e => setShabMenu(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preview label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#52525b" }}>Preview — 820 × 312 px Facebook Cover</p>
          <p style={{ fontSize: 11, color: "#3f3f46" }}>Win + Shift + S to snip the banner</p>
        </div>

        {/* Banner preview */}
        <div ref={wrapRef} style={{ width: "100%", overflow: "hidden", marginBottom: 20 }}>
          <div ref={innerRef}>
            <div style={{ width: 820, height: 312, background: "#0a0a0a", position: "relative", overflow: "hidden", borderRadius: 6, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

              {/* Header */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, background: "#111", borderBottom: "1px solid #1c1c1c", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
                <img src="/THR%20hor%20logo%20final.png" alt="THR" style={{ height: 24 }} />
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>Menu of the Week</span>
                <span style={{ color: "#2dd4bf", fontSize: 11, fontWeight: 700 }}>{weekDate || "Week of ..."}</span>
              </div>

              {/* Columns */}
              <div style={{ position: "absolute", top: 50, bottom: 36, left: 0, right: 150, display: "flex" }}>
                {[
                  { day: "Monday", accent: "#2dd4bf", date: monDate, menu: monMenu },
                  { day: "Tuesday", accent: "#2dd4bf", date: tueDate, menu: tueMenu },
                  { day: "Thursday", accent: "#2dd4bf", date: thuDate, menu: thuMenu },
                  { day: "Shabbat", accent: "#e9c46a", date: shabDate, menu: shabMenu },
                ].map((col, i) => (
                  <div key={i} style={{ flex: 1, borderRight: i < 3 ? "1px solid #1c1c1c" : "none", padding: "11px 11px 8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2.5, color: col.accent, marginBottom: 2 }}>{col.day}</div>
                    <div style={{ color: "#52525b", fontSize: 9, marginBottom: 6 }}>{col.date}</div>
                    <div style={{ height: 2, borderRadius: 1, background: col.accent, marginBottom: 8, flexShrink: 0 }} />
                    <div style={{ color: "#d4d4d8", fontSize: 11, lineHeight: 1.65, whiteSpace: "pre-wrap", overflow: "hidden" }}>{col.menu}</div>
                  </div>
                ))}
              </div>

              {/* Fred */}
              <div style={{ position: "absolute", right: 0, top: 50, bottom: 36, width: 150, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
                <img src="/white%20fred%20png.png" alt="Fred" style={{ height: "115%", objectFit: "contain", objectPosition: "bottom center", mixBlendMode: "screen" }} />
              </div>

              {/* Footer */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ color: "#000", fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>Order Now →</span>
                <span style={{ color: "rgba(0,0,0,0.3)", fontSize: 11 }}>|</span>
                <span style={{ color: "#000", fontSize: 13, fontWeight: 700, opacity: 0.65 }}>{orderUrl}</span>
              </div>

            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background: "#18181b", borderLeft: "3px solid #2dd4bf", borderRadius: "0 10px 10px 0", padding: "14px 18px", fontSize: 12, color: "#71717a", lineHeight: 1.8 }}>
          <strong style={{ color: "#a1a1aa" }}>To save as image:</strong> Open Chrome DevTools (F12) → Elements tab → find the banner div → right-click → <strong style={{ color: "#a1a1aa" }}>Capture node screenshot</strong>. Saves a perfect 820×312 PNG ready for Facebook.<br />
          Or press <strong style={{ color: "#a1a1aa" }}>Win + Shift + S</strong> and snip just the banner area above.
        </div>

      </div>
    </main>
  );
}
