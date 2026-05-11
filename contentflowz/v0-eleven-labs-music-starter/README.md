# v0 Theme Song Generator

Generate AI-powered theme songs using the ElevenLabs Music API. Create custom compositions with advanced controls and detailed composition planning.

## Features

- **Simple Prompt Generation**: Describe your desired music and let AI create it
- **Advanced Composition Planning**: Section-by-section control with custom styles and lyrics
- **Professional Audio Player**: Custom controls with seek, volume, and metadata display
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Automatic theme switching with system preference detection
- **Real-time Preview**: See your prompt as you build it

## Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <your-repo>
   cd v0-theme-song-generator
   npm install
   \`\`\`

2. **Environment Variables**
   Set your ElevenLabs API key in your Vercel project settings:
   \`\`\`
   ELEVENLABS_API_KEY=your_api_key_here
   \`\`\`

3. **Development**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Deploy**
   Click the "Publish" button in v0 or deploy to Vercel:
   \`\`\`bash
   vercel deploy
   \`\`\`

## Usage

### Simple Generation
1. Select your genre, mood, and musical parameters
2. Add any additional directives
3. Click "Generate Theme Song"

### Advanced Composition Planning
1. Toggle "Use Composition Plan"
2. Add sections with custom names and durations
3. Define include/exclude styles for each section
4. Add lyrics lines for vocal sections
5. Generate your structured composition

## API Endpoints

- `POST /api/music/compose` - Generate music from prompts or composition plans
- `POST /api/music/plan` - Create structured composition plans

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Music API**: ElevenLabs Music API
- **Deployment**: Vercel

## License

Built with v0. "Prompt. Refine. Ship." tagline used under nominative fair use.
