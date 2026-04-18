import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL
const GEMINI_MODEL_FALLBACKS = [DEFAULT_GEMINI_MODEL, 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite']

const nutritionLabels = {
  calories_kcal: 'Calories (kcal)',
  protein_g: 'Protein (g)',
  carbohydrates_g: 'Carbohydrates (g)',
  fats_g: 'Fats (g)',
  fiber_g: 'Fiber (g)',
  calcium_mg: 'Calcium (mg)',
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4']

function numberOrDash(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return value.toLocaleString()
}

function parseRetryDelaySeconds(errorText, retryAfterHeader) {
  const headerSeconds = Number(retryAfterHeader)
  if (!Number.isNaN(headerSeconds) && headerSeconds >= 0) {
    return Math.ceil(headerSeconds)
  }
  const retryDelayMatch = errorText.match(
    /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)"/i,
  )
  if (retryDelayMatch?.[1] && retryDelayMatch?.[2]) {
    const amount = Number(retryDelayMatch[1])
    const unit = retryDelayMatch[2].toLowerCase()
    const isMinute = /^m|min|mins|minute|minutes$/.test(unit)
    return Math.ceil(isMinute ? amount * 60 : amount)
  }
  const genericWaitMatch = errorText.match(
    /(retry in|please wait|try again in)\s+(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)/i,
  )
  if (genericWaitMatch?.[2] && genericWaitMatch?.[3]) {
    const amount = Number(genericWaitMatch[2])
    const unit = genericWaitMatch[3].toLowerCase()
    const isMinute = /^m|min|mins|minute|minutes$/.test(unit)
    return Math.ceil(isMinute ? amount * 60 : amount)
  }
  return null
}

function normalizeModelName(modelName) {
  return String(modelName || '').trim().replace(/^models\//i, '')
}

function buildModelCandidates(primaryModel) {
  const firstChoice = normalizeModelName(primaryModel) || DEFAULT_GEMINI_MODEL
  return [...new Set([firstChoice, ...GEMINI_MODEL_FALLBACKS])]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function FoodAnalyzer() {
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const vitaminsText = useMemo(() => {
    if (!result?.vitamins?.length) return '-'
    return result.vitamins.join(', ')
  }, [result])

  const mineralsText = useMemo(() => {
    if (!result?.minerals?.length) return '-'
    return result.minerals.join(', ')
  }, [result])

  const macroChartData = useMemo(() => {
    if (!result?.nutrition) return []
    const n = result.nutrition
    const items = [
      { name: 'Protein', value: n.protein_g || 0, color: PIE_COLORS[0] },
      { name: 'Carbs', value: n.carbohydrates_g || 0, color: PIE_COLORS[1] },
      { name: 'Fats', value: n.fats_g || 0, color: PIE_COLORS[2] },
      { name: 'Fiber', value: n.fiber_g || 0, color: PIE_COLORS[3] },
    ].filter((d) => d.value > 0)
    return items
  }, [result])

  const microChartData = useMemo(() => {
    if (!result?.nutrition) return []
    const n = result.nutrition
    const items = [
      { name: 'Calcium (mg)', value: n.calcium_mg || 0, color: PIE_COLORS[4] },
      { name: 'Sugar (g)', value: n.sugar_g || 0, color: PIE_COLORS[5] },
      { name: 'Sodium (mg)', value: (n.sodium_mg || 0) / 10, color: PIE_COLORS[2] },
    ].filter((d) => d.value > 0)
    return items
  }, [result])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setResult(null)
    setError('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const toBase64 = async (file) => {
    const bytes = await file.arrayBuffer()
    let binary = ''
    const byteArray = new Uint8Array(bytes)
    for (let i = 0; i < byteArray.length; i += 1) {
      binary += String.fromCharCode(byteArray[i])
    }
    return btoa(binary)
  }

  const extractJson = (responseText) => {
    const cleaned = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    return JSON.parse(cleaned)
  }

  const analyzeFood = async () => {
    if (!imageFile) {
      setError('Please upload a food image first.')
      return
    }
    if (!GEMINI_API_KEY) {
      setError('Missing API key. Add VITE_GEMINI_API_KEY in .env.local.')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const imageBase64 = await toBase64(imageFile)
      const prompt = `
You are a universal food analysis system.
Analyze the food in this image and return only valid JSON.

Rules:
- Identify a likely food item name.
- Estimate nutrition for the visible serving in image.
- Include calories, proteins, calcium, vitamins, carbohydrates, fats, fibre, and useful extras.
- If uncertain, provide best estimate.
- Do not include markdown, comments, or extra text.

JSON schema:
{
  "food_item_name": "string",
  "estimated_serving_description": "string",
  "confidence_percent": number,
  "nutrition": {
    "calories_kcal": number,
    "protein_g": number,
    "carbohydrates_g": number,
    "fats_g": number,
    "fiber_g": number,
    "calcium_mg": number,
    "sugar_g": number,
    "sodium_mg": number
  },
  "vitamins": ["string"],
  "minerals": ["string"],
  "notes": "string"
}
`.trim()

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: imageFile.type,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }

      const modelCandidates = buildModelCandidates(GEMINI_MODEL)
      let payload = null

      for (let attempt = 0; attempt < 2; attempt += 1) {
        let response = null
        let notFoundErrorText = ''
        let retryAfterSeconds = null

        for (const modelName of modelCandidates) {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            },
          )
          if (response.ok) break

          const errorText = await response.text()
          if (response.status === 429) {
            retryAfterSeconds = parseRetryDelaySeconds(
              errorText,
              response.headers.get('retry-after'),
            )
            response = null
            break
          }
          const modelMissing =
            response.status === 404 &&
            /not found|not supported for generateContent/i.test(errorText)
          if (modelMissing) {
            notFoundErrorText = errorText
            response = null
            continue
          }
          throw new Error(`Gemini request failed: ${response.status} ${errorText}`)
        }

        if (response?.ok) {
          payload = await response.json()
          break
        }
        if (retryAfterSeconds !== null) {
          const waitSeconds = Math.max(0, retryAfterSeconds)
          if (attempt === 0) {
            if (waitSeconds > 0) {
              setError(`Gemini quota hit. Waiting ${waitSeconds}s, then retrying automatically...`)
              await sleep(waitSeconds * 1000)
            }
            continue
          }
          throw new Error(
            `Gemini quota exceeded after retry. Please wait ${waitSeconds}s and try again.`,
          )
        }
        throw new Error(
          `Gemini request failed: 404 No compatible model found. Tried: ${modelCandidates.join(', ')}. ${notFoundErrorText}`.trim(),
        )
      }

      if (!payload) throw new Error('No response payload received from Gemini.')

      const text =
        payload?.candidates?.[0]?.content?.parts?.[0]?.text ||
        payload?.candidates?.[0]?.content?.parts?.map((p) => p.text)?.join(' ') ||
        ''
      if (!text) throw new Error('No response text received from Gemini.')

      const parsed = extractJson(text)
      setResult(parsed)
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing image.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Food Analyzer
      </h1>
      <p className="mt-2 text-slate-300">
        Upload a food photo and get AI-estimated nutrition details with charts.
      </p>

      <div className="mt-8 grid gap-6 rounded-xl bg-slate-800/50 p-5 ring-1 ring-slate-700 sm:grid-cols-2">
        <section className="space-y-4">
          <label htmlFor="food-image" className="block text-sm font-medium text-slate-200">
            Food image
          </label>
          <input
            id="food-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full cursor-pointer rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-emerald-400"
          />
          <button
            type="button"
            onClick={analyzeFood}
            disabled={isLoading}
            className="w-full rounded-md bg-emerald-500 px-4 py-2.5 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Food'}
          </button>
          {error ? (
            <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Uploaded food"
              className="h-64 w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-600 text-sm text-slate-400">
              Image preview will appear here
            </div>
          )}
        </section>
      </div>

      {result ? (
        <section className="mt-8 space-y-6 rounded-xl bg-slate-800/40 p-5 ring-1 ring-slate-700">
          <h2 className="text-2xl font-semibold">{result.food_item_name}</h2>
          <p className="text-sm text-slate-300">
            Serving: {result.estimated_serving_description || '-'} | Confidence:{' '}
            {numberOrDash(result.confidence_percent)}%
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(nutritionLabels).map(([key, label]) => (
              <div key={key} className="rounded-md bg-slate-900/80 p-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-lg font-semibold text-emerald-300">
                  {numberOrDash(result?.nutrition?.[key])}
                </p>
              </div>
            ))}
            <div className="rounded-md bg-slate-900/80 p-3">
              <p className="text-xs text-slate-400">Sugar (g)</p>
              <p className="text-lg font-semibold text-emerald-300">
                {numberOrDash(result?.nutrition?.sugar_g)}
              </p>
            </div>
            <div className="rounded-md bg-slate-900/80 p-3">
              <p className="text-xs text-slate-400">Sodium (mg)</p>
              <p className="text-lg font-semibold text-emerald-300">
                {numberOrDash(result?.nutrition?.sodium_mg)}
              </p>
            </div>
          </div>

          {macroChartData.length > 0 && (
            <div className="rounded-lg bg-slate-900/60 p-4">
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                Macronutrients (g)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}g`}
                    >
                      {macroChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} g`, '']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {microChartData.length > 0 && (
            <div className="rounded-lg bg-slate-900/60 p-4">
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                Other Nutrients
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={microChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) =>
                        name.includes('Sodium') ? `${name}: ${(value * 10).toFixed(0)}` : `${name}: ${value}`
                      }
                    >
                      {microChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        if (name?.includes?.('Sodium')) return [`${(value * 10).toFixed(0)} mg`, '']
                        return [value, '']
                      }}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-md bg-slate-900/80 p-4 text-sm">
            <p>
              <span className="font-semibold text-slate-200">Vitamins:</span>{' '}
              <span className="text-slate-300">{vitaminsText}</span>
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-200">Minerals:</span>{' '}
              <span className="text-slate-300">{mineralsText}</span>
            </p>
            <p className="mt-2">
              <span className="font-semibold text-slate-200">Notes:</span>{' '}
              <span className="text-slate-300">{result.notes || '-'}</span>
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
