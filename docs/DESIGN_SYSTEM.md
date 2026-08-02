# DESIGN_SYSTEM.md

# VectorVault Design System

Version: 1.0  
Product Name: **VectorVault**  
Product Descriptor: **Enterprise Retrieval Platform** / **Secure Knowledge Platform**  
Header Breadcrumb Standard: `VectorVault > Workspace > Workstation`  
Sidebar Title: `VectorVault Workstation`  

---

# Design Philosophy

The design language of VectorVault is inspired by enterprise software rather than consumer applications.

The interface should feel like a professional workstation used by engineers, analysts, and security teams.

The visual identity must communicate:

• Trust  
• Stability  
• Precision  
• Simplicity  
• Quiet Confidence  
• Security  

The interface must never resemble a generic AI chatbot or an AI-generated dashboard.

Every screen should feel intentional, minimal, structured, and timeless.

---

# Brand Logo & Identity Standard

- **Brand Logo:** Outline briefcase SVG icon with 12% stroke width.
- **Header Breadcrumb Standard:** `VectorVault > Workspace > Workstation`
- **Sidebar Title:** `VectorVault Workstation`

---

# Visual Style

The UI should resemble products such as:

• Microsoft Azure Portal  
• Microsoft Fluent 2  
• Linear  
• Atlassian Admin  
• Apple Human Interface  
• Enterprise Internal Dashboards  

Avoid trendy visual effects.  
Avoid unnecessary decorations.  
Whitespace is a design element.

---

# Official Design Tokens (CSS Custom Properties)

```css
:root {
  /* App & Surface Foundations */
  --vv-app-bg: #b2c8d9ff;               /* Soft grayish matte blue */
  --vv-aura-accent: #c3defa;            /* Soft sky blue radial gradient aura */
  --vv-sidebar-bg: rgba(213, 224, 235, 0.70); /* Blended with dashboard bg */
  --vv-card-glass: rgba(255, 255, 255, 0.75); /* Glass card surface */
  --vv-card-border: rgba(255, 255, 255, 0.85);/* Glass card border */

  /* Primary Action Palette */
  --vv-primary: #245eb5ff;              /* Primary Action Button */
  --vv-primary-hover: #000080;        /* Deep Corporate Navy */

  /* Typography Palette */
  --vv-heading: #0F172A;                /* Headings & Section Titles */
  --vv-body: #4B5563;                   /* Body Text & Paragraphs */

  /* Extended Palette Tokens */
  --vv-azure-accent: #007FFF;
  --vv-ocean-blue: #009ACD;
  --vv-sky-blue: #87CEFA;
  --vv-powder-blue: #B0E0E6;
  --vv-soft-cyan: #00CED1;
  --vv-neutral-white: #FFFFFF;
}
```

---

# Official Color Palette Specifications

## Primary Action (`--vv-primary`)
**`#245eb5ff`**
- Primary buttons
- Interactive emphasis
- Active selection highlights

## Primary Action Hover (`--vv-primary-hover`)
**`#000080` (Deep Corporate Navy)**
- Primary button hover state
- Deep focus emphasis

## Headings & Titles (`--vv-heading`)
**`#0F172A`**
- Section headers
- Card titles
- Modal headings
- Hero typography

## Body Text (`--vv-body`)
**`#4B5563`**
- Primary copy
- Descriptive subheadings
- Form field labels
- Table row text

## App Background (`--vv-app-bg`)
**`#b2c8d9ff` (Soft grayish matte blue)**
- Main application backdrop
- Provides matte enterprise baseline

## Background Aura Accent (`--vv-aura-accent`)
**`#c3defa` (Soft sky blue radial gradient aura)**
- Soft background lighting aura
- Subtle radial highlight layer

## Sidebar Background (`--vv-sidebar-bg`)
**`rgba(213, 224, 235, 0.70)`**
- Seamlessly blended with the dashboard backdrop
- Translucent frosted glass effect

## Glass Card Surface & Border (`--vv-card-glass` & `--vv-card-border`)
**Surface:** `rgba(255, 255, 255, 0.75)`  
**Border:** `rgba(255, 255, 255, 0.85)`  
- Clean elevated card containers

---

# Background System

The application background uses a soft grayish matte blue baseline (`#b2c8d9ff`) enhanced with radial background aura accents (`#c3defa`).

Avoid: `#FFFFFF` as a full-page background.

Overlay Layers:
- Large radial gradients using `--vv-aura-accent` (`#c3defa`) with opacity below 12%.
- The background should feel smooth, soft, and premium.

---

# Sidebar Architecture

The sidebar system must fulfill the following architectural requirements:
- **Title:** `VectorVault Workstation`
- **Background:** `--vv-sidebar-bg` (`rgba(213, 224, 235, 0.70)`)
- **Collapsible State:** Must support a Collapsible state with an Expand/Collapse toggle.
- **Collapsed View:** Collapsed state displays icon-only navigation cleanly with instant tooltips.
- **Navigation Styling:** Navigation items rely on subtle hover effects and active state pills rather than heavy borders.

---

# Cards & Glass System

Glass Cards define the VectorVault interface structure.

- **Card Surface (`--vv-card-glass`):** `rgba(255, 255, 255, 0.75)`
- **Card Border (`--vv-card-border`):** `rgba(255, 255, 255, 0.85)`
- **Backdrop Blur:** 8px–12px
- **Border Width:** 1px
- **Radius:** 24px
- **Shadow:** `0 8px 32px rgba(40,60,90,.05)`

---

# Typography

- **Primary Font:** Plus Jakarta Sans
- **Code Font:** JetBrains Mono
- **Headings Color:** `#0F172A`
- **Body Text Color:** `#4B5563`

### Scale
- **Display:** 48px
- **Hero:** 36px
- **Section:** 28px
- **Card Title:** 22px
- **Metric:** 32px
- **Body:** 16px
- **Caption:** 13px
- **Label:** 12px

---

# Buttons & Interactive Elements

- **Primary Button (`--vv-primary`):** `#245eb5ff`
- **Primary Button Hover (`--vv-primary-hover`):** `#000080` (Deep Corporate Navy)
- **Secondary Button:** White surface with subtle border
- **Ghost Button:** Transparent background with subtle hover state
- **Hover Motion:** Slight translateY(-1px) elevation, zero scaling or bouncy animations.

---

# Icons & Brand Assets

- **Brand Logo:** Outline briefcase SVG icon with 12% stroke width.
- **Icon Set:** Lucide Icons, outline style, 2px stroke width.

---

# Summary of Strict Design Tokens

| Token Name | Token Variable | Value / Color | Usage Description |
| :--- | :--- | :--- | :--- |
| **App Background** | `--vv-app-bg` | `#b2c8d9ff` | Soft grayish matte blue app canvas |
| **Aura Accent** | `--vv-aura-accent` | `#c3defa` | Soft sky blue radial gradient aura |
| **Sidebar Background** | `--vv-sidebar-bg` | `rgba(213, 224, 235, 0.70)` | Blended translucent sidebar surface |
| **Glass Card Surface** | `--vv-card-glass` | `rgba(255, 255, 255, 0.75)` | Translucent glass card background |
| **Glass Card Border** | `--vv-card-border` | `rgba(255, 255, 255, 0.85)` | High-clarity subtle card stroke |
| **Primary Button** | `--vv-primary` | `#245eb5ff` | Primary action button fill |
| **Primary Button Hover** | `--vv-primary-hover` | `#000080` | Deep Corporate Navy hover state |
| **Headings / Titles** | `--vv-heading` | `#0F172A` | Slate dark heading color |
| **Body Text** | `--vv-body` | `#4B5563` | Slate medium body text color |
