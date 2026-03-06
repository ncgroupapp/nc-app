# Interface Design System

## Intent
The user is an administrator or client managing a tendering system (licitaciones). They need to navigate tables of products, suppliers, and bids. The interface should feel like a modern, approachable B2B SaaS platform—clean, well-structured, but friendly, avoiding overly rigid or dense "legacy software" vibes.

## Theme & Palette: "Indigo & Clean White"
- **Surface:** Pure white background (`--background: oklch(1.00 0 0)`) for maximum contrast and a bright, airy workspace.
- **Brand/Action:** A vibrant, modern Indigo/Purple (`--primary: oklch(0.62 0.19 259.76)`) serves as the signature accent. It provides a friendly but professional focal point for primary actions and sidebar grounding.
- **Sidebar:** The sidebar shares the primary Indigo color (`--sidebar: oklch(0.62 0.19 259.76)`), creating a distinct navigation zone that contrasts sharply with the white canvas of the main content area.
- **Semantic Feedback:** Standard, recognizable hues for statuses.
  - Destructive: `oklch(0.64 0.21 25.39)` (Solid red)
  - Warning: `oklch(0.70 0.19 86.84)` (Amber)

## Structure & Depth
- **Depth Strategy: Layered Shadows.** 
  - The interface relies on subtle, standard drop shadows (`--shadow-sm` to `--shadow-md`) to lift cards and containers off the background. This creates a tactile, approachable interface where interactive elements and distinct sections feel physically separated.
- **Corner Radius: Approachable.** 
  - Primary radius is `0.375rem` (6px). This sits in the "friendly middle"—not too sharp (which feels overly technical), and not completely pill-shaped (which feels too consumer-focused).

## Key Component Patterns
- **Elevated Cards:** Content blocks (like product details or tender information) should be wrapped in cards with a subtle shadow and the standard `0.375rem` border radius to separate them from the main canvas.
- **Sidebar Navigation:** A solid-color sidebar creates a strong visual anchor on the left, keeping the complex data tables on the right feeling contained and focused.
- **Action Hierarchy:** Primary buttons use the bold Indigo accent. Secondary buttons should rely on subtle borders or muted backgrounds to avoid competing with the main actions.

## Spacing & Typography
- **Typography:** Modern, clean sans-serif ('Geist', 'Inter', or system fonts). The focus is on supreme legibility for data-heavy views.
- **Spacing:** Relies on the standard Tailwind scale (base 4px). Consistent padding inside cards ensures the layout breathes and doesn't feel overwhelmingly dense.