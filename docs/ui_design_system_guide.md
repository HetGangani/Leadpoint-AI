# AI Sales Agent - UI Design System & Color Palette

## 1. Overview
This design system defines a modern, sleek aesthetic for an **AI Sales Agent** interface. It uses a cool-toned pastel background (lavender/ice blue) anchored by high-contrast black elements and elegant golden accents, complemented by functional indicators.

---

## 2. Color Palette & Hex Codes

| Element Category | UI Element / Role | Exact Color Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | Main Canvas | Soft Lavender | `#F2F0FF` | Primary background canvas |
| **Containers** | Cards, Panels, Sidebars | Ice Blue | `#E6F0FA` | Glassmorphism card surfaces |
| **Dark Accent** | Borders, Active Highlights | Soft Dark Magenta | `#5C1D3A` | Container outlines & warmth accents |
| **Primary CTAs** | Action Buttons | Jet Black | `#0F0F12` | High-contrast call-to-action buttons |
| **CTA Text** | Button Labels | Soft Metallic Gold | `#E5C158` | Elegant metallic text tone |
| **CTA Text Accent**| Gradient Highlight Tone | Bright Gold | `#F6E27A` | Start color for metallic linear gradient |
| **Status (Active)**| AI Live / Agent Active | Neon Mint Green | `#34D399` | Live waveform, online status |
| **Status (Warning)**| Pending / Warm Lead | Amber Yellow | `#FBBF24` | Follow-ups, pending states |
| **Status (Alert)**  | Disconnect / High Priority| Soft Crimson Red | `#F87171` | End call, drop-offs, errors |

---

## 3. UI Placement Strategy

1. **Background & Atmosphere:**
   - Base canvas: `#F2F0FF` (Soft Lavender).
   - Use a subtle ambient radial background gradient blending into `#E6F0FA` (Ice Blue) towards the top right.

2. **Panels & Dashboard Cards:**
   - Use `#E6F0FA` with 70–80% opacity and a backdrop blur (`backdrop-filter: blur(12px)`) for a glassmorphism feel.
   - Panel borders: Use `#5C1D3A` at 15–20% opacity (`rgba(92, 29, 58, 0.15)`) to create crisp, elegant edges.

3. **Primary Action Buttons (CTAs):**
   - Solid `#0F0F12` (Jet Black) fill.
   - Text color: Metallic gold gradient from `#F6E27A` to `#E5C158`.
   - Use a subtle gold border or subtle outer glow (`0px 4px 14px rgba(229, 193, 88, 0.25)`).

4. **Functional Indicators:**
   - **Mint Green (`#34D399`):** Live voice waveform animation, "AI Connected" indicator, successful conversion metrics.
   - **Amber Yellow (`#FBBF24`):** Mid-funnel leads, pending response status.
   - **Soft Crimson (`#F87171`):** "End Call" button, lost deal indicators, alert banners.

---

## 4. Ready-to-Use CSS Variables

```css
:root {
  /* Core Background & Surfaces */
  --bg-main: #F2F0FF;
  --bg-card: rgba(230, 240, 250, 0.75);
  --border-accent: rgba(92, 29, 58, 0.18);
  
  /* Buttons & CTAs */
  --btn-primary-bg: #0F0F12;
  --btn-gold-light: #F6E27A;
  --btn-gold-dark: #E5C158;
  
  /* Status Colors */
  --status-active: #34D399;
  --status-warning: #FBBF24;
  --status-alert: #F87171;
}

/* Base Body Styling */
body {
  background: radial-gradient(circle at top right, #E6F0FA 0%, #F2F0FF 60%);
  color: #0F0F12;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Glassmorphism Card Style */
.ui-card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-accent);
  border-radius: 16px;
  padding: 24px;
}

/* Metallic Gold Text inside Dark Button */
.btn-primary {
  background-color: var(--btn-primary-bg);
  border: 1px solid rgba(229, 193, 88, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0px 4px 14px rgba(15, 15, 18, 0.15);
  transition: all 0.2s ease-in-out;
}

.btn-primary span {
  background: linear-gradient(135deg, var(--btn-gold-light) 0%, var(--btn-gold-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0px 6px 20px rgba(229, 193, 88, 0.3);
}
```

---

## 5. Direct Prompt for ChatGPT / AI Developer

Copy and paste the box below directly into ChatGPT or your developer prompt:

> **System Prompt / Instruction:**
> "I am building a web app for an AI Sales Agent interface. Please implement the frontend using the following color palette and UI system:
> - **Main Background:** Soft Lavender (`#F2F0FF`) with subtle gradient to Ice Blue (`#E6F0FA`).
> - **Cards & Containers:** Glassmorphism Ice Blue (`rgba(230,240,250,0.75)`) with backdrop blur and soft dark magenta (`#5C1D3A`) borders at 15% opacity.
> - **Primary Buttons:** Jet Black (`#0F0F12`) with shiny metallic gold text (`#F6E27A` to `#E5C158`).
> - **Status Indicators:** Mint Green (`#34D399`) for AI active/waveforms, Amber Yellow (`#FBBF24`) for warnings/pending, Soft Red (`#F87171`) for alerts/end call.
> Please generate clean HTML/CSS/React code following these exact design guidelines."