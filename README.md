# Universal Food Analytics (React + Vite + Tailwind)

This app lets you upload a food image and uses Gemini to estimate:

- food item name
- calories
- protein
- carbohydrates
- fats
- fiber
- calcium
- vitamins
- minerals
- extra nutrition hints (sugar, sodium, notes)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your API key:

```bash
cp .env.example .env.local
```

Then set:

```env
VITE_GEMINI_API_KEY=your_key_here
```

## Run

```bash
npm run dev
```

Open the local URL shown in terminal, upload a food image, then click **Analyze Food**.

## Notes

- Nutrition is AI-estimated, not medical/lab-verified.
- For production security, call Gemini from a backend instead of exposing an API key in frontend code.
