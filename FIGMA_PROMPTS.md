# Figma Wireframe Generation & Design Prompts

Use the following detailed design prompts to generate wireframes or design layouts using Figma AI, Relume, Wireframe Designer, Musho, or by guiding a designer.

---

## 🎨 Global Design System & Theme Specs
* **Style**: Premium, clean, modern e-commerce dashboard. Minimalist aesthetics with rounded corners (`8px` - `12px`), thin borders, and soft shadows.
* **Palette**: Sleek dark mode / high-contrast light mode hybrid. Deep slate backgrounds, violet/indigo accent colors (`#6366F1` or HSL equivalents), and clean neutral borders.
* **Typography**: Modern sans-serif (e.g., *Inter* or *Outfit*). High hierarchy contrast.

---

## 📝 Option A: The "All-in-One" Figma AI Prompt
*Copy and paste the prompt below into Figma AI, Relume, or wireframing plugins (e.g. Wireframe Designer).*

> **Prompt:**
> Design a complete web application wireframe for "Fashion Girl" — a modern, AI-powered custom-tailoring and fashion e-commerce marketplace. The app requires a clean, premium dashboard shell with a top bar (branding, user status "signed in as [email]", logout button) and a horizontal tab navigation bar. 
> Generate wireframe screens for the following tabs:
> 1. **Auth Shell**: A split-screen layout. Left side: beautiful fashion marketing image. Right side: login/signup form containing inputs for Username, Email, Password, Confirm Password, and a dropdown role selector ("Customer (Buyer)" or "Vendor (Tailor)"). Include a Google SSO login button and a guest account modal pop-up.
> 2. **Find Vendors Page (Customer View)**: A split layout. Left side: an interactive upload zone for reference fashion images and a text prompt input field with a search button. Right side: a grid list of matching vendor design cards showing high-quality clothing thumbnails, vendor profile info, description, and similarity match scores. Selecting a card reveals a slide-out order form panel with fields for customer measurements (chest, waist, hips, length, notes) and payment selectors.
> 3. **Upload Catalog Page (Vendor View)**: A clean drag-and-drop file uploader area for fashion designs, input fields for Item Title and Description, and an "Add to AI Catalog" button with loading state.
> 4. **My Orders Page**: A status board containing lists of orders. Each order card lists customer details, fabric selections, dimensions (chest, waist, etc.), status badge ("Pending", "In Progress", "Shipped", "Delivered"), and action buttons ("Make Payment" for buyers or "Update Status" dropdown for tailors).
> 5. **AI Tailor Copilot Page**: A split chat panel. Left: helpful custom-tailoring guidelines (measuring guides, fabric choices). Right: an active chat window with a message log and a prompt input field for the AI Copilot.

---

## 📑 Option B: Screen-by-Screen Detailed Prompts
*Use these prompts if you want to generate each page individually for higher detail.*

### 1. Authentication & Onboarding Screen
> **Figma Prompt:**
> "Wireframe for a SaaS login and registration screen for an AI tailoring platform called 'Fashion Girl'. Use a clean modern card layout centered in the screen. It should support two states:
> - **Login State**: Email field, password field, a primary 'Sign in' button, a horizontal separator line with 'or', a prominent Google Sign-in button, and guest credentials quick-login link.
> - **Register State**: Username, Email, Password, Confirm Password, a role dropdown selection ('Customer/Buyer' vs 'Vendor/Tailor'), and a primary 'Create Account' button.
> Ensure it feels premium, spacious, and has clear text link toggles between sign-in and sign-up."

### 2. Marketplace Home (Vendor Search & AI Matching)
> **Figma Prompt:**
> "A wireframe of a dual-column search interface for custom tailors. 
> - **Search Panel (Left Column, 1/3 width)**: Title 'Find Your Ideal Tailor', file upload box for reference images, text box for describing desired clothing, and a 'Find Matches' action button.
> - **Results Panel (Right Column, 2/3 width)**: A grid of matching vendor items. Each item card includes a design image placeholder, vendor name, similarity match percentage (e.g. '94% Match'), catalog description, and a 'Consult & Order' button.
> Keep the spacing grid at 24px, using light gray wireframe elements."

### 3. Catalog Uploader (Vendor Catalog Manager)
> **Figma Prompt:**
> "A wireframe for a vendor catalog uploader screen. Main container is a clean card featuring:
> - Header: 'Upload Design to AI Catalog'
> - Large file dropzone box with an icon (dotted border, upload description, max size label).
> - Input text fields for 'Design Title' and 'Description (describe fabrics, styles, measurements)'.
> - Bottom right action button: 'Index Design with CLIP AI'.
> - Include a sidebar section displaying currently uploaded catalog thumbnails for quick review."

### 4. Orders Dashboard (Customer & Vendor Views)
> **Figma Prompt:**
> "A wireframe dashboard for managing custom clothing orders. 
> - Top row: Quick summary cards (Total Orders, In Progress, Completed, Earnings).
> - Main Area: List of order cards. Each order card features: Order ID, Date, Client name, Dress preview icon, detailed measurements list (chest, waist, hips, length), status pill tag (e.g. 'Pending', 'Sewing', 'Shipped'), and action buttons like 'Pay Now' or 'Update Status'."

### 5. AI Tailor Copilot Widget
> **Figma Prompt:**
> "A wireframe of a conversational AI Chat interface for a fashion designer platform.
> - Left panel: Quick-click suggestions chips (e.g. 'Calculate Measurement Ease', 'Fabric Recommendations', 'Design Suggestions').
> - Central panel: Chat transcript area showing alternating system messages, user prompts, and AI response bubbles.
> - Bottom: Text input field with attachment icon and send button.
> Make the layout compact, clean, and intuitive."
