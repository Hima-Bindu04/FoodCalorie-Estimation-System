import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../utils/profileStorage'
import {
  calculateBMI,
  getBMIStatus,
  calculateWaterIntake,
  calculateProteinRequirement,
} from '../utils/healthCalculations'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

export default function FoodSuggestions() {
  const [profile, setProfile] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setProfile(getProfile())
  }, [])

  const fetchSuggestions = async () => {
    if (!profile?.weight || !profile?.height) {
      setError('Please complete your profile first.')
      return
    }
    if (!GEMINI_API_KEY) {
      setError('Missing API key. Add VITE_GEMINI_API_KEY in .env')
      return
    }

    setLoading(true)
    setError('')
    setSuggestions(null)

    const bmi = calculateBMI(profile.weight, profile.height)
    const bmiStatus = getBMIStatus(bmi)
    const water = calculateWaterIntake(profile.weight)
    const protein = calculateProteinRequirement(profile.weight, profile.goal)

    const dietLabel = profile.diet === 'veg' ? 'vegetarian' : 'non-vegetarian'
    const goalLabel =
      profile.goal === 'slim'
        ? 'lose weight / slim down'
        : profile.goal === 'muscle'
          ? 'build muscle'
          : 'maintain weight'

    const prompt = `You are a nutrition expert. Generate personalized food suggestions as JSON.

User profile:
- Gender: ${profile.gender || 'unknown'}
- Age: ${profile.age || 'unknown'} years
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- Diet: ${dietLabel}
- Goal: ${goalLabel}
- BMI: ${bmi} (${bmiStatus.label})
- Daily water intake needed: ${water.ml} ml (${water.glasses} glasses)
- Daily protein needed: ${protein}g

Return ONLY valid JSON (no markdown) with this structure:
{
  "summary": "2-3 sentence personalized summary",
  "water_tip": "Brief tip about water intake",
  "protein_tip": "Brief tip about meeting protein needs",
  "breakfast": ["3 breakfast suggestions"],
  "lunch": ["3 lunch suggestions"],
  "dinner": ["3 dinner suggestions"],
  "snacks": ["2-3 healthy snack suggestions"],
  "foods_to_avoid": ["2-3 foods to limit or avoid"],
  "general_tips": ["3-4 general nutrition tips"]
}

Make suggestions specific to their diet (${dietLabel}), goal (${goalLabel}), and BMI status (${bmiStatus.label}).`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        },
      )

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API error: ${res.status} ${errText}`)
      }

      const data = await res.json()
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text)?.join(' ') ||
        ''
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setSuggestions(parsed)
    } catch (err) {
      setError(err.message || 'Failed to fetch suggestions.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    )
  }

  if (!profile.weight || !profile.height) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-100">Food Suggestions</h1>
        <p className="mt-4 rounded-xl bg-amber-500/20 p-6 text-amber-200">
          Please complete your profile (height, weight, diet, goal) to get
          personalized food suggestions.
        </p>
        <Link
          to="/profile"
          className="mt-4 inline-block rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400"
        >
          Go to Profile
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">
        Food Suggestions
      </h1>
      <p className="mt-2 text-slate-400">
        AI-powered meal ideas based on your profile, goals, and dietary
        preferences.
      </p>

      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="mt-6 rounded-md bg-emerald-500 px-4 py-2.5 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Get Food Suggestions'}
      </button>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {suggestions && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700">
            <h2 className="text-lg font-semibold text-emerald-300">Summary</h2>
            <p className="mt-2 text-slate-300">{suggestions.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-slate-700">
              <h3 className="font-medium text-cyan-300">Water</h3>
              <p className="mt-1 text-sm text-slate-300">{suggestions.water_tip}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-slate-700">
              <h3 className="font-medium text-amber-300">Protein</h3>
              <p className="mt-1 text-sm text-slate-300">{suggestions.protein_tip}</p>
            </div>
          </div>

          {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
            <div
              key={meal}
              className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700"
            >
              <h3 className="font-semibold capitalize text-slate-200">{meal}</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                {(suggestions[meal] || []).map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700">
            <h3 className="font-semibold text-orange-300">Foods to Limit</h3>
            <ul className="mt-2 space-y-1 text-slate-300">
              {(suggestions.foods_to_avoid || []).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700">
            <h3 className="font-semibold text-emerald-300">General Tips</h3>
            <ul className="mt-2 space-y-1 text-slate-300">
              {(suggestions.general_tips || []).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
