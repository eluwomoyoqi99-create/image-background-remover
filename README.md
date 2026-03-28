# Image Background Remover

A free, AI-powered image background remover built with Next.js + Tailwind CSS.

## Features

- 🚀 One-click background removal powered by Remove.bg API
- 🔒 Images processed in memory — never stored on server
- 📱 Mobile responsive
- 🖼️ Before/After comparison slider
- ⬇️ Download transparent PNG result

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Image comparison**: react-compare-slider
- **AI API**: Remove.bg

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/eluwomoyoqi99-create/image-background-remover.git
   cd image-background-remover
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Remove.bg API key
   ```

4. Get a free Remove.bg API key at: https://www.remove.bg/api

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eluwomoyoqi99-create/image-background-remover)

Add the `REMOVE_BG_API_KEY` environment variable in Vercel dashboard after deployment.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REMOVE_BG_API_KEY` | Your Remove.bg API key |
