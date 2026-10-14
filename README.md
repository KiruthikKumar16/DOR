# Destination Outfit Recommender (DOR)

A smart, AI-powered outfit recommendation and visual generation system that helps you pack and style the perfect clothes for your next trip. Powered by the **Gemini 3 Ecosystem** with dual-model architecture combining agentic reasoning and high-speed visual rendering.

---

## 🚀 Evolution to Gemini 3

The Digital Online Robot (DOR) has been upgraded from legacy models to the **Gemini 3 Dual-Model Architecture**, decoupling deep agentic reasoning from high-speed visual generation to deliver unmatched styling intelligence and ultra-fast visual rendering.

### 🧠 Dual-Model Architecture

```mermaid
flowchart TD
    User["User Request\n(Destination, Weather, Occasion, Vibe)"] --> Router["API Routing Layer\n(/api/recommendation)"]
    
    subgraph ReasoningEngine ["Reasoning / Agentic Backbone"]
        Router -->|"1. Complex Decision & Planning"| G3Flash["gemini-3-flash-preview\n• Thinking capability enabled\n• 65,536 Max Output Tokens\n• Multimodal (PDF, Audio, Video)"]
        G3Flash -->|"Thinking Trace + JSON"| OutfitData["Curated Outfit Spec\n+ Cultural Reasoning"]
    end
    
    subgraph VisualEngine ["Visual Engine (Nano Banana 2 Lite)"]
        OutfitData -->|"2. High-Speed Visual Generation"| NanoLite["gemini-3.1-flash-lite-image\n• Target 1K (1024x1024px)\n• Sub-2 Second Latency\n• Local Edits"]
        NanoLite -->|"Base64 Image"| ImageOutput["1K High-Definition Render"]
    end
    
    OutfitData --> Frontend["UI / Frontend Display\n• Thinking Process Trace\n• 1K Image Lightbox & Zoom\n• Interactive Outfit Editor"]
    ImageOutput --> Frontend
```

### 1. Reasoning/Agentic Backbone
- **Model ID**: `gemini-3-flash-preview`
- **Configuration**: Explicit "Thinking" capability enabled (`thinking_config: { include_thoughts: true }`)
- **Capacity**: Expanded `max_output_tokens` set to `65,536`
- **Capabilities**:
  - Complex multi-step reasoning for climate, weather fluctuations, cultural dress codes, and occasion etiquette
  - Cultural norm research and respectful styling synthesis
  - Multimodal analysis readiness (PDF packing lists, travel itinerary videos, and audio notes)
  - Full thought-process transparency exposed directly in the UI

### 2. Visual Engine (Nano Banana 2 Lite)
- **Model ID**: `gemini-3.1-flash-lite-image`
- **Performance**: High-speed visual generation and local edits
- **Constraints & Benchmarks**:
  - **Sub-2 Second Latency**: Near instantaneous visual generation pipeline
  - **1K Resolution (1024x1024px)**: Crisp, high-definition fashion portrait renders with fine fabric texture fidelity
  - **Local Edits**: Fast iterative clothing item adjustments preserving overall look consistency

---

## ✨ Features

- 🧠 **Agentic Thinking Display**: View step-by-step reasoning traces showing how climate, cultural norms, and occasion dress codes were factored into your recommendations.
- 🖼️ **1K High-Definition Visuals**: Sub-2 second generation of 1024x1024 fashion renders with an interactive 1K preview modal and download capabilities.
- 🌍 **Destination & Culture Aware**: Thoughtful cultural advice tailored specifically to your destination's regional etiquette.
- 🌤️ **Real-Time Weather Integration**: Dynamic weather forecasts factoring temperature, conditions, and precipitation into apparel choices.
- 👗 **Interactive Outfit Editor**: Tweak tops, bottoms, shoes, or accessories with instant sub-2 second visual regeneration.
- 📱 **Modern Responsive UI**: Built with Next.js 15, React 19, Tailwind CSS, and shadcn/ui with complete dark mode support.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **AI Ecosystem (Gemini 3)**:
  - `@google/generative-ai` SDK (v0.24.1+)
  - **Reasoning Backbone**: `gemini-3-flash-preview` (Thinking enabled, 65k context)
  - **Visual Engine**: `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite, 1K res, &lt;2s latency)
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Weather API**: OpenWeatherMap API

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18.17 or later (Node 20+ recommended)
- `pnpm` (recommended) or `npm`
- PostgreSQL database
- Google AI Studio API key (with Gemini 3 access)
- OpenWeatherMap API key

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/destination_outfit_recommender"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini 3 AI Ecosystem
GEMINI_API_KEY="your-gemini-api-key"
# Optional model overrides:
GEMINI_REASONING_MODEL="gemini-3-flash-preview"
GEMINI_VISUAL_MODEL="gemini-3.1-flash-lite-image"

# Weather API
OPENWEATHER_API_KEY="your-openweather-api-key"
```

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KiruthikKumar16/DOR.git
   cd DOR
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up the database**:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
DOR/
├── app/
│   ├── api/
│   │   ├── recommendation/    # Main dual-model recommendation route
│   │   ├── recommendations/   # Multi-outfit reasoning route
│   │   ├── reimage-outfit/    # Sub-2s 1K visual regeneration route
│   │   └── test/              # Dual-model diagnostics & health check
│   ├── recommendation/        # Recommendation page with Thinking view
│   ├── wardrobe/              # Saved outfit collections
│   └── profile/               # User sizing & style profile
├── components/
│   ├── outfit-result.tsx      # Thinking trace display & 1K image viewer
│   ├── outfit-editor.tsx      # Real-time outfit modifier
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── gemini.ts              # Gemini 3 dual-model initialization & logic
│   ├── api.ts                 # Frontend API client & types
│   ├── prisma.ts              # Prisma client instance
│   └── weather.ts             # OpenWeatherMap client
└── prisma/
    └── schema.prisma          # Database schema
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini 3](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenWeatherMap](https://openweathermap.org/)