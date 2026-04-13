# Content Flows Landing Page

An Astro-based landing page for the intelligent automation robot suite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Auth Handoff Setup

The site now owns the web login flow and redirects authenticated users into the
Flutter app with a short-lived backend handoff.

Required environment variables:

- `CLERK_PUBLISHABLE_KEY`
- `API_BASE_URL`
- `APP_WEB_URL`

Key routes:

- `/sign-in`
- `/sign-up`
- `/launch`

## 📂 Project Structure

```
website/
├── src/
│   ├── layouts/
│   │   └── Layout.astro          # Base HTML layout
│   ├── components/
│   │   ├── Navbar.astro          # Navigation header
│   │   ├── Hero.astro            # Hero section with rotating words
│   │   ├── Robots.astro          # Robot cards (SEO, Newsletter, Article)
│   │   ├── Features.astro        # Feature grid
│   │   ├── Pricing.astro         # Pricing tiers with toggle
│   │   ├── Testimonials.astro    # Customer testimonials
│   │   ├── FAQ.astro             # Expandable FAQ section
│   │   └── Footer.astro          # Footer with links
│   └── pages/
│       └── index.astro           # Main landing page
├── public/
│   └── images/                   # Static images (to be added)
├── astro.config.mjs              # Astro configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## 🎨 Design Features

- **Rotating Hero Text**: Animated word rotation ("write", "research", "analyze", "optimize")
- **Interactive Pricing Toggle**: Switch between monthly/annual pricing
- **Expandable FAQ**: Smooth accordion animations
- **Responsive Design**: Mobile-first approach with breakpoints
- **Gradient Accents**: Modern gradient buttons and badges
- **Hover Effects**: Smooth transitions on cards and buttons

## 🎯 Sections

1. **Hero** - Eye-catching intro with rotating keywords and social proof
2. **Robots** - Three robot cards (SEO, Newsletter, Article) with features
3. **Features** - 9 key features in a responsive grid
4. **Pricing** - Three tiers (Starter, Professional, Enterprise)
5. **Testimonials** - 6 customer testimonials
6. **FAQ** - 8 common questions with expandable answers
7. **Footer** - Links, social media, company info

## 🛠️ Technologies

- **Astro** - Static site generator
- **TypeScript** - Type safety
- **Modern CSS** - CSS custom properties, Grid, Flexbox
- **Vanilla JS** - Minimal interactive elements (pricing toggle, FAQ accordion)

## 🎨 Color Scheme

```css
--color-primary: #3b82f6 (Blue)
--color-secondary: #8b5cf6 (Purple)
--color-accent: #06b6d4 (Cyan)
--color-dark: #0f172a (Dark Blue)
--color-gray: #64748b (Gray)
--color-light-gray: #f1f5f9 (Light Gray)
```

## 📝 Customization

### Update Content
- Edit component files in `src/components/`
- Modify pricing in `Pricing.astro`
- Update testimonials in `Testimonials.astro`
- Change FAQ questions in `FAQ.astro`

### Add Images
- Place images in `public/images/`
- Update image paths in components
- Add logo, robot icons, testimonial avatars

### Change Colors
- Edit CSS variables in `src/layouts/Layout.astro`
- Consistent across all components

## 🚢 Deployment

This Astro site can be deployed to:
- **GitHub Pages** (recommended for this project)
- Vercel
- Netlify
- Cloudflare Pages

```bash
# Build for production
npm run build

# Output will be in dist/ directory
```

## 📊 Performance

- Static HTML generation
- Minimal JavaScript (only for interactive elements)
- Optimized CSS (scoped to components)
- Fast load times with Astro

## 🔗 Links

- [Astro Documentation](https://docs.astro.build)
- [Project Repository](https://github.com/your-repo)
- [Live Demo](https://your-domain.com)
