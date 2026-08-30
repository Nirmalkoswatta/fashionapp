import React, { useState, useEffect, useRef } from "react";

// ==========================================
// MOCK DATA & INITIAL STATES
// ==========================================

const INITIAL_VENDORS = [
  {
    id: "v1",
    name: "Atelier Élégance",
    designer: "Claire Vaneau",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    cover: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
    matchScore: 96,
    specialty: "Haute Couture & Silk Gowns",
    location: "Paris / Remote Bespoke",
    rating: 4.9,
    reviews: 128,
    estimatedDays: "7-10 Days",
    matchedTags: ["Silk Gown", "Lace Detailing", "Corset Back"],
  },
  {
    id: "v2",
    name: "Maison de Soie",
    designer: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    cover: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    matchScore: 91,
    specialty: "Modern Minimalist Suits & Drapes",
    location: "Milan / Express Tailoring",
    rating: 4.8,
    reviews: 94,
    estimatedDays: "5-7 Days",
    matchedTags: ["Satin Finish", "Structural Fit", "Custom Lining"],
  },
  {
    id: "v3",
    name: "Velvet & Vine Studio",
    designer: "Aria Montgomery",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    cover: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    matchScore: 87,
    specialty: "Bespoke Bridal & Evening Wear",
    location: "New York / Atelier Direct",
    rating: 4.9,
    reviews: 210,
    estimatedDays: "12-14 Days",
    matchedTags: ["Velvet Accent", "Hand Embroidery"],
  },
];

const INITIAL_ORDERS = [
  {
    id: "ORD-8921",
    customer: "Sophia Laurent",
    email: "sophia.l@example.com",
    garment: "Rose Silk Evening Gown",
    fabric: "Silk Satin",
    deadline: "2026-08-28",
    amount: "$1,250.00",
    status: "Pending",
    measurements: { bust: 34.5, waist: 26.0, hips: 37.0, length: 58.0 },
  },
  {
    id: "ORD-8918",
    customer: "Camilla Zhang",
    email: "camilla.z@example.com",
    garment: "Structured Velvet Blazer",
    fabric: "Velvet",
    deadline: "2026-08-30",
    amount: "$890.00",
    status: "In Escrow",
    measurements: { bust: 36.0, waist: 28.5, hips: 39.0, length: 28.0 },
  },
  {
    id: "ORD-8902",
    customer: "Isabella Rossi",
    email: "isabella.r@example.com",
    garment: "Lace Overlay Cocktail Dress",
    fabric: "Lace & Chiffon",
    deadline: "2026-09-04",
    amount: "$1,420.00",
    status: "In Production",
    measurements: { bust: 33.0, waist: 25.0, hips: 35.5, length: 42.0 },
  },
  {
    id: "ORD-8895",
    customer: "Genevieve Thorne",
    email: "g.thorne@example.com",
    garment: "Bespoke Linen Jumpsuit",
    fabric: "Linen",
    deadline: "2026-09-10",
    amount: "$680.00",
    status: "Delivered",
    measurements: { bust: 35.0, waist: 27.0, hips: 38.0, length: 55.0 },
  },
];

const INITIAL_FABRICS = [
  { id: "cotton", name: "Organic Cotton", description: "Breathable, lightweight 100% natural weave", inStock: true },
  { id: "silk", name: "Mulberry Silk", description: "Grade 6A heavy silk satin with soft luster", inStock: true },
  { id: "denim", name: "Japanese Selvedge Denim", description: "Structured 12oz stretch selvedge", inStock: false },
  { id: "lace", name: "French Chantilly Lace", description: "Intricate floral scalloped lace trim", inStock: true },
  { id: "velvet", name: "Plush Silk Velvet", description: "Rich deep pile velvet with fluid drape", inStock: true },
  { id: "linen", name: "Belgian Flax Linen", description: "Softened vintage-wash linen blend", inStock: true },
];

const INITIAL_CHAT = [
  {
    id: 1,
    sender: "ai",
    text: "I am your AI Tailor Copilot powered by PyTorch & Ollama. Provide customer measurements or design constraints, and I will calculate precise fabric yardage, pattern adjustments, and seam allowances.",
    time: "10:14 AM",
  },
  {
    id: 2,
    sender: "vendor",
    text: "How much Mulberry Silk yardage is required for a bias-cut floor-length gown with a size 34 Bust and 37 Hips?",
    time: "10:15 AM",
  },
  {
    id: 3,
    sender: "ai",
    text: "For a bias-cut floor-length gown (Bust: 34\", Hips: 37\"), accounting for a 45-degree grainline bias drape + 15% wastage:\n\n• Required Fabric: 4.25 Yards (54\" width)\n• Recommended Seam Allowance: 5/8 inch French seams\n• Structural Note: Add light horsehair braid hem for skirt flare dynamics.",
    time: "10:15 AM",
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function FashionGirlApp() {
  // Navigation & Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [userRole, setUserRole] = useState("customer"); // 'customer' | 'vendor'
  const [activeView, setActiveView] = useState("portal"); // 'portal' | 'dashboard' | 'copilot'

  // Auth Form State
  const [emailInput, setEmailInput] = useState("sophia@fashiongirl.com");
  const [passwordInput, setPasswordInput] = useState("••••••••");
  const [nameInput, setNameInput] = useState("Sophia Laurent");

  // Toast Notification System State
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    if (userRole === "vendor") {
      setActiveView("dashboard");
    } else {
      setActiveView("portal");
    }
    addToast("Welcome Back!", `Signed in as ${userRole === "vendor" ? "Master Vendor" : "Customer"}.`, "success");
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    if (userRole === "vendor") {
      setActiveView("dashboard");
    } else {
      setActiveView("portal");
    }
    addToast("Account Created!", "Welcome to Fashion Girl bespoke platform.", "success");
  };

  // --- VIEW A: Customer Portal State ---
  const [uploadedImage, setUploadedImage] = useState(null);
  const [designPrompt, setDesignPrompt] = useState("Rose silk bias-cut evening gown with delicate lace corsetry");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedNode, setSelectedNode] = useState("A");
  
  const [measurements, setMeasurements] = useState({
    bust: "34.5",
    waist: "26.0",
    hips: "37.0",
    sleeve: "23.5",
  });

  const nodeRefs = {
    A: useRef(null),
    B: useRef(null),
    C: useRef(null),
    D: useRef(null),
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(URL.createObjectURL(file));
      addToast("Image Uploaded", "Your design sketch was attached.", "info");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      addToast("Image Uploaded", "Design sketch loaded into PyTorch pipeline.", "info");
    }
  };

  const triggerAiMatching = () => {
    if (!uploadedImage && !designPrompt.trim()) {
      addToast("Missing Input", "Please upload an image or provide a design description.", "error");
      return;
    }

    setIsAiProcessing(true);
    setAiStepIndex(0);

    const stepInterval = setInterval(() => {
      setAiStepIndex((prev) => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          setIsAiProcessing(false);
          addToast("AI Match Complete", "Matched top 3 custom tailors with 96% confidence!", "success");
          return 3;
        }
        return prev + 1;
      });
    }, 700);
  };

  const handleNodeClick = (nodeKey) => {
    setSelectedNode(nodeKey);
    if (nodeRefs[nodeKey]?.current) {
      nodeRefs[nodeKey].current.focus();
    }
  };

  // --- VIEW B: Vendor Dashboard State ---
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [fabrics, setFabrics] = useState(INITIAL_FABRICS);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const toggleFabricStock = (fabricId) => {
    setFabrics((prev) =>
      prev.map((f) => {
        if (f.id === fabricId) {
          const nextState = !f.inStock;
          addToast(
            nextState ? "Fabric Available" : "Fabric Out of Stock",
            `${f.name} availability set to ${nextState ? "In Stock" : "Out of Stock"}.`,
            nextState ? "success" : "info"
          );
          return { ...f, inStock: nextState };
        }
        return f;
      })
    );
  };

  // --- VIEW C: AI Tailor Copilot State ---
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isCopilotTyping]);

  const handleSendChatMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg = {
      id: Date.now(),
      sender: "vendor",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsCopilotTyping(true);

    setTimeout(() => {
      let botReply = "I have analyzed your request. Based on standard bespoke tailoring patterns, I recommend adding a 2-inch hem allowance and checking grainline tension before cutting.";
      const lower = userText.toLowerCase();
      if (lower.includes("lace") || lower.includes("embroider")) {
        botReply = "For French Chantilly lace applique: Hand-baste the motif along seam junctions prior to machine stitching. Use a Size 70/10 Microtex needle with fine silk thread.";
      } else if (lower.includes("measure") || lower.includes("waist") || lower.includes("bust")) {
        botReply = "Measurement Adjustment: If customer has a 34.5\" Bust and 26\" Waist (8.5\" differential), insert double waist darts (1.25\" width each) to ensure zero gaping around the lower ribcage.";
      } else if (lower.includes("fabric") || lower.includes("yard")) {
        botReply = "Fabric Calculation: For a full-length flared silhouette, estimate 4.5 yards of 54\" width fabric or 6.0 yards for 45\" width bolt.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsCopilotTyping(false);
      addToast("AI Copilot Responded", "Calculated fabric parameters successfully.", "info");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-pink-100/50 text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900 pb-16">
      {/* ==========================================
          HEADER / TOP NAVIGATION
          ========================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-rose-100 shadow-sm shadow-rose-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView("portal")}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-200 font-serif font-bold text-xl tracking-tighter">
              FG
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 block leading-tight">
                Fashion Girl
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-rose-500 uppercase block">
                Bespoke AI Tailoring Platform
              </span>
            </div>
          </div>

          {/* Navigation Tabs (When Authenticated) */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1 bg-pink-100/60 p-1.5 rounded-full border border-rose-200/50">
              <button
                onClick={() => setActiveView("portal")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeView === "portal"
                    ? "bg-white text-rose-600 shadow-md shadow-rose-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                Customer Portal
              </button>

              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeView === "dashboard"
                    ? "bg-white text-rose-600 shadow-md shadow-rose-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                Vendor Dashboard
              </button>

              <button
                onClick={() => setActiveView("copilot")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeView === "copilot"
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                AI Copilot
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAuthMode("login")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  authMode === "login"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "text-rose-700 bg-rose-50 hover:bg-rose-100"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  authMode === "register"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "text-rose-700 bg-rose-50 hover:bg-rose-100"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* User Profile / Status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-300 ring-offset-2 shadow-sm"
              />
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  addToast("Logged Out", "Signed out successfully.", "info");
                }}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden sm:block text-xs font-semibold text-rose-600 bg-pink-100 px-3 py-1.5 rounded-full border border-rose-200">
              ✦ Guest Preview Mode
            </div>
          )}
        </div>
      </header>

      {/* ==========================================
          UNAUTHENTICATED: LIGHT PINK LOGIN & REGISTER VIEWS
          ========================================== */}
      {!isAuthenticated && (
        <main className="max-w-md mx-auto px-4 pt-12 pb-16">
          <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-2xl shadow-rose-100/60 space-y-6 relative overflow-hidden">
            {/* Top Pink Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400"></div>

            <div className="text-center space-y-2 pt-2">
              <span className="text-[11px] font-bold tracking-widest text-rose-600 uppercase">
                Bespoke Tailoring Platform
              </span>
              <h1 className="font-serif text-3xl font-bold text-slate-900">
                {authMode === "login" ? "Welcome Back" : "Join Fashion Girl"}
              </h1>
              <p className="text-xs text-slate-500">
                {authMode === "login"
                  ? "Sign in to access your custom orders and AI tailor copilot"
                  : "Create an account to match with master tailors worldwide"}
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex bg-rose-50 p-1.5 rounded-2xl border border-rose-200/60">
              <button
                type="button"
                onClick={() => setUserRole("customer")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  userRole === "customer"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Customer (Buyer)
              </button>
              <button
                type="button"
                onClick={() => setUserRole("vendor")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  userRole === "vendor"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Vendor (Master Tailor)
              </button>
            </div>

            {/* LOGIN FORM */}
            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-pink-50/50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-pink-50/50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-200 transition-transform active:scale-[0.99]"
                >
                  Sign In to Platform →
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    placeholder="Sophia Laurent"
                    className="w-full bg-pink-50/50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-pink-50/50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Create Password</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full bg-pink-50/50 border border-rose-200/80 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-200 transition-transform active:scale-[0.99]"
                >
                  Create {userRole === "vendor" ? "Master Vendor" : "Customer"} Account →
                </button>
              </form>
            )}

            {/* SSO Quick Login Button */}
            <div className="pt-2 border-t border-rose-100 text-center space-y-3">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Or Continue With One-Click Demo
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAuthenticated(true);
                  addToast("Demo Signed In", "Logged in as Guest Demo User.", "success");
                }}
                className="w-full py-2.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-rose-800 font-bold text-xs border border-rose-200/80 transition-colors"
              >
                🌸 Quick Demo Guest Access
              </button>
            </div>

            <p className="text-center text-xs text-slate-500">
              {authMode === "login" ? "New to Fashion Girl?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="font-bold text-rose-600 hover:underline"
              >
                {authMode === "login" ? "Create an Account" : "Sign In Here"}
              </button>
            </p>
          </div>
        </main>
      )}

      {/* ==========================================
          AUTHENTICATED MAIN CONTENT
          ========================================== */}
      {isAuthenticated && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* ==========================================
              VIEW A: CUSTOMER PORTAL - AI MATCH & MEASURE
              ========================================== */}
          {activeView === "portal" && (
            <div className="space-y-10 animate-fade-in">
              {/* Hero Banner Section */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white p-8 sm:p-12 shadow-2xl shadow-rose-950/20">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400/40 backdrop-blur-md text-xs font-semibold text-rose-200 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                      PyTorch Vision Matching Engine
                    </span>
                    <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-white">
                      From Sketch to Silhouette. <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200">
                        Bespoke Tailoring Reimagined.
                      </span>
                    </h1>
                    <p className="text-rose-100/80 text-base max-w-xl font-normal leading-relaxed">
                      Upload your dream garment photo or sketch. Our PyTorch AI matches your design with top-tier master tailors, while our interactive visual silhouette ensures 100% precision sizing.
                    </p>
                  </div>

                  {/* Upload Card Hero Component */}
                  <div className="lg:col-span-5">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="relative group rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-dashed border-rose-200/40 hover:border-rose-300 p-6 text-center transition-all duration-300 hover:bg-white/15 cursor-pointer shadow-xl shadow-black/10"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      />

                      {uploadedImage ? (
                        <div className="relative rounded-xl overflow-hidden max-h-52">
                          <img src={uploadedImage} alt="Uploaded Design" className="w-full h-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-semibold px-4 py-2 bg-rose-600 rounded-full shadow-md">
                              Change Sketch Photo
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 py-4">
                          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-200 mx-auto flex items-center justify-center border border-rose-300/30 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-base">Upload your design sketch or photo</p>
                            <p className="text-rose-200/70 text-xs mt-1">Drag &amp; drop file here, or click to browse (PNG, JPG, WEBP)</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text Prompt Input */}
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={designPrompt}
                        onChange={(e) => setDesignPrompt(e.target.value)}
                        placeholder="e.g. Silk gown with lace back detailing..."
                        className="flex-1 bg-white/10 backdrop-blur-md border border-rose-200/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-rose-200/60 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <button
                        onClick={triggerAiMatching}
                        disabled={isAiProcessing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold text-xs shadow-lg shadow-rose-950/30 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                      >
                        {isAiProcessing ? "Matching..." : "Match Tailors →"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Match Cards Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-slate-900">Recommended Master Vendors</h2>
                    <p className="text-slate-500 text-xs mt-1">Matched via PyTorch image feature vectors &amp; fabric suitability</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200">
                    3 Master Matches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {INITIAL_VENDORS.map((vendor) => {
                    const isSelected = selectedVendorId === vendor.id;
                    return (
                      <div
                        key={vendor.id}
                        className={`group bg-white rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                          isSelected
                            ? "border-rose-500 ring-4 ring-rose-200 shadow-2xl shadow-rose-200"
                            : "border-rose-100 shadow-xl shadow-rose-100/40 hover:shadow-2xl hover:shadow-rose-100/60"
                        }`}
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={vendor.cover}
                              alt={vendor.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-rose-700 text-xs font-extrabold shadow-md flex items-center gap-1.5 border border-rose-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              {vendor.matchScore}% Match
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white">
                              <img
                                src={vendor.avatar}
                                alt={vendor.designer}
                                className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-md"
                              />
                              <div>
                                <h3 className="font-serif font-bold text-base text-white">{vendor.name}</h3>
                                <p className="text-[11px] text-rose-200">{vendor.designer}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-semibold text-rose-600">{vendor.specialty}</span>
                              <span className="font-bold text-slate-800">★ {vendor.rating}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {vendor.matchedTags.map((tag, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-md bg-pink-100/70 text-rose-800 text-[11px] font-semibold border border-rose-200/50">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0">
                          <button
                            onClick={() => {
                              setSelectedVendorId(vendor.id);
                              addToast("Vendor Selected", `You chose ${vendor.name}.`, "success");
                            }}
                            className={`w-full py-3 rounded-2xl font-semibold text-xs transition-all ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-lg"
                                : "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200"
                            }`}
                          >
                            {isSelected ? "✓ Vendor Selected" : "Select Vendor & Configure"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Measurement Section */}
              <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-xl shadow-rose-100/50 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100 pb-6">
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block mb-1">
                      Silhouette Sizing Engine
                    </span>
                    <h2 className="font-serif text-3xl font-bold text-slate-900">Custom Body Measurements</h2>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                    Unit: Inches (\")
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-pink-50/60 rounded-2xl border border-rose-200/60 relative">
                    <div className="relative w-64 h-96 flex items-center justify-center">
                      <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-md">
                        <path
                          d="M100,30 C110,30 115,40 110,50 C125,55 140,70 145,85 C148,100 135,120 130,135 C125,150 128,170 135,185 C142,200 140,220 132,240 C125,260 120,300 118,360 L82,360 C80,300 75,260 68,240 C60,220 58,200 65,185 C72,170 75,150 70,135 C65,120 52,100 55,85 C60,70 75,55 90,50 C85,40 90,30 100,30 Z"
                          fill="#ffffff"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                        />
                      </svg>

                      {/* Nodes A, B, C, D */}
                      <button
                        onClick={() => handleNodeClick("A")}
                        className={`absolute top-[100px] left-[90px] w-8 h-8 rounded-full font-bold text-xs shadow-lg transition-all ${
                          selectedNode === "A" ? "bg-rose-600 text-white ring-4 ring-rose-200 scale-125" : "bg-white text-rose-600 border border-rose-300"
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => handleNodeClick("B")}
                        className={`absolute top-[155px] left-[90px] w-8 h-8 rounded-full font-bold text-xs shadow-lg transition-all ${
                          selectedNode === "B" ? "bg-rose-600 text-white ring-4 ring-rose-200 scale-125" : "bg-white text-rose-600 border border-rose-300"
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() => handleNodeClick("C")}
                        className={`absolute top-[210px] left-[90px] w-8 h-8 rounded-full font-bold text-xs shadow-lg transition-all ${
                          selectedNode === "C" ? "bg-rose-600 text-white ring-4 ring-rose-200 scale-125" : "bg-white text-rose-600 border border-rose-300"
                        }`}
                      >
                        C
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-pink-50/50 border border-rose-200/80">
                        <label className="text-xs font-bold text-slate-800 block mb-1">A • Full Bust</label>
                        <input
                          ref={nodeRefs.A}
                          type="number"
                          value={measurements.bust}
                          onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                          className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-pink-50/50 border border-rose-200/80">
                        <label className="text-xs font-bold text-slate-800 block mb-1">B • Natural Waist</label>
                        <input
                          ref={nodeRefs.B}
                          type="number"
                          value={measurements.waist}
                          onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                          className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div className="p-4 rounded-2xl bg-pink-50/50 border border-rose-200/80">
                        <label className="text-xs font-bold text-slate-800 block mb-1">C • Full Hips</label>
                        <input
                          ref={nodeRefs.C}
                          type="number"
                          value={measurements.hips}
                          onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                          className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => addToast("Measurements Saved", "Bespoke profile saved.", "success")}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-200"
                    >
                      Confirm Sizing &amp; Proceed to Escrow →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW B: VENDOR DASHBOARD
              ========================================== */}
          {activeView === "dashboard" && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-100/40 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Gross Earnings</span>
                  <div className="font-serif text-4xl font-bold text-rose-600">$24,850.00</div>
                  <span className="text-xs text-emerald-600 font-bold">↑ +14.2% this month</span>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-100/40 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Funds Held in Escrow</span>
                  <div className="font-serif text-4xl font-bold text-emerald-600">$8,420.00</div>
                  <span className="text-xs text-slate-400">5 Active Customer Orders</span>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-xl shadow-rose-100/40 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Platform Protection Fee</span>
                  <div className="font-serif text-4xl font-bold text-slate-800">$2,485.00</div>
                  <span className="text-xs text-slate-400">10% Standard Rate</span>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW C: AI TAILOR COPILOT WIDGET
              ========================================== */}
          {activeView === "copilot" && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl shadow-rose-100/60 overflow-hidden flex flex-col h-[650px]">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-5 text-white flex items-center justify-between">
                  <h2 className="font-serif text-xl font-bold">💬 AI Tailor Copilot</h2>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full border border-white/30">Ollama mistral-nemo</span>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-pink-50/40">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === "vendor" ? "items-end" : "items-start"}`}>
                      <div className={`max-w-lg p-4 rounded-2xl text-xs font-medium ${msg.sender === "vendor" ? "bg-rose-500 text-white" : "bg-pink-100 text-slate-800 border border-rose-200"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-rose-100 flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask copilot about fabric yardage or measurements..."
                    className="flex-1 bg-pink-50/50 border border-rose-200 rounded-full px-5 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button type="submit" className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 font-bold">
                    →
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      )}

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto p-4 rounded-2xl bg-white border border-rose-200 shadow-2xl flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">{toast.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
