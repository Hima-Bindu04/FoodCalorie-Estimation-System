import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '../utils/profileStorage'

const initialForm = {
  gender: '',
  age: '',
  height: '',
  weight: '',
  diet: '',
  goal: '',
}

export default function Profile() {
  const [form, setForm] = useState(initialForm)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const p = getProfile()
    if (p) setForm({ ...initialForm, ...p })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const profile = {
      gender: form.gender,
      age: Number(form.age) || null,
      height: Number(form.height) || null,
      weight: Number(form.weight) || null,
      diet: form.diet,
      goal: form.goal,
    }
    saveProfile(profile)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">
        My Profile
      </h1>
      <p className="mt-2 text-slate-400">
        Enter your details for personalized health insights and food suggestions.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-xl bg-slate-800/50 p-6 ring-1 ring-slate-700"
      >
        <div>
          <label className="block text-sm font-medium text-slate-200">
            Gender
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Age (years)
            </label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              min="1"
              max="120"
              placeholder="25"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Height (cm)
            </label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              min="50"
              max="250"
              placeholder="170"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              min="20"
              max="300"
              step="0.1"
              placeholder="70"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">
            Diet Preference
          </label>
          <select
            name="diet"
            value={form.diet}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select</option>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">
            Goal
          </label>
          <select
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select</option>
            <option value="slim">Slim Down / Lose Weight</option>
            <option value="muscle">Build Muscle</option>
            <option value="maintain">Maintain Weight</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-emerald-500 px-4 py-2.5 font-semibold text-black transition hover:bg-emerald-400"
        >
          Save Profile
        </button>

        {saved && (
          <p className="text-center text-sm text-emerald-400">
            Profile saved successfully!
          </p>
        )}
      </form>
    </div>
  )
}
