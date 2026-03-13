# C.A.R.E.N. Design Guidelines

## Design Approach: Futuristic Emergency Interface
Drawing inspiration from sci-fi interfaces (Cyberpunk 2077, Blade Runner) combined with high-stakes emergency UI patterns (medical devices, aviation controls). The aesthetic is predetermined: dark cyber with glassmorphism, neon accents, and space backgrounds.

## Core Design Elements

### Typography Hierarchy
- **Primary Font**: "Orbitron" or "Rajdhana" (Google Fonts) - geometric, tech-forward
- **Secondary Font**: "Inter" for body text - maximum legibility
- **Scale**: Mobile-first sizing
  - Hero/Emergency Actions: text-5xl to text-6xl (bold)
  - Section Headers: text-3xl to text-4xl (semibold)
  - Card Titles: text-xl to text-2xl (medium)
  - Body: text-base to text-lg (regular)
  - Micro-copy: text-sm (medium for emphasis)

### Spacing System
Tailwind units: 3, 4, 6, 8, 12, 16, 20
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16 (mobile), py-20 to py-24 (desktop)
- Card gaps: gap-6 to gap-8
- Button padding: px-8 py-4 (large emergency actions), px-6 py-3 (standard)

### Layout Structure

**Hero Section** (100vh):
- Full-screen immersive entry with space background image
- Glassmorphic overlay panel (backdrop-blur-xl, border with neon glow)
- Large emergency button (w-64 h-64, circular, pulsing animation)
- Status indicators strip at top (GPS, Connection, Battery)
- Quick-action carousel below hero (horizontal scroll on mobile)

**Emergency Dashboard** (below hero):
- 2x2 grid on mobile, 3-column on desktop
- Large glassmorphic cards with neon borders
- Each card: Icon (96px), Title, Quick description, Arrow/Chevron
- Cards: Legal Rights, Emergency Contacts, Roadside Assistance, Location Share

**Feature Sections** (stacked):
- Voice Command Center: Waveform visualization, microphone button, command examples
- GPS Protection Map: Interactive map preview, coordinates display, geofence status
- Emergency Response Timeline: Vertical stepper showing protocol steps
- Trust Indicators: Statistics in glowing number cards (3-column grid)

**Footer**:
- Glassmorphic bar with blurred background
- Emergency hotline (large, always visible)
- Legal disclaimers, Privacy, Social links
- "Powered by CAREN" with neon underline

### Component Library

**Emergency Action Button**:
- Circular, 256px diameter (mobile), glassmorphic with strong neon border
- Centered icon + text, pulsing glow effect
- Blurred background when overlaying images

**Status Cards**:
- Glassmorphic background (backdrop-blur-md)
- 1px neon border (varies: cyan/purple/green)
- Inner glow on hover
- Rounded-2xl corners
- p-8 padding

**Input Fields** (for emergency forms):
- Glass background, neon underline border
- Large text (text-lg), high contrast placeholder
- Focus: Glow effect on border
- Rounded-xl

**Navigation** (sticky top bar):
- Glassmorphic backdrop-blur-lg
- Logo left, hamburger menu right (mobile)
- Emergency call button always visible (right side, pulsing)

**Alert Banners**:
- Full-width, glassmorphic
- Icon left, message center, action right
- Border-l-4 with neon accent color
- py-4 px-6

### Interaction Patterns

- All primary CTAs: Large touch targets (min 56px height)
- Cards: Subtle lift on tap/hover (transform scale)
- Emergency button: Continuous subtle pulse, intensifies on hover
- Page transitions: Fade with slight blur
- Loading states: Neon progress bars with glow

### Images Section

**Hero Background**: 
- Full-viewport space nebula or cosmic scene (deep purples, blues, blacks)
- Stars, galaxies, or abstract space patterns
- High resolution, optimized for mobile
- Applied with gradient overlay for text contrast

**Feature Section Backgrounds**:
- Abstract digital grid patterns (subtle, behind glass panels)
- Futuristic dashboard mockups showing GPS/maps
- 3D rendered emergency icons in neon style

**Icon Library**: 
- Heroicons via CDN (outline style for light feel)
- Custom emergency icons as inline SVG where needed (shield, location pin, phone with pulse)

### Grid Systems

Mobile: Single column, full-width cards with gap-6
Tablet (md:): 2-column for feature grids, 1-column for primary content
Desktop (lg:): 3-column max for feature grids, constrained content max-w-7xl

### Accessibility

- Minimum text contrast: 7:1 (AAA standard for emergency scenarios)
- Focus indicators: Thick neon outline (4px)
- Touch targets: Minimum 48x48px (56px preferred for critical actions)
- Screen reader labels on all interactive elements
- Skip-to-content link for keyboard navigation

### Mobile Optimization

- Bottom navigation bar for core functions (Home, Map, Contacts, Profile)
- Swipe gestures: Left for menu, right for quick emergency dial
- Landscape mode: Optimized dashboard with side panel layout
- One-handed operation: Critical buttons in thumb-reach zone