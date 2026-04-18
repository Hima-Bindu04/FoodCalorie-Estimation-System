import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../utils/profileStorage'
import {
  calculateBMI,
  getBMIStatus,
  calculateWaterIntake,
  calculateProteinRequirement,
} from '../utils/healthCalculations'

const colorClasses = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  red: 'bg-red-500/20 text-red-300 border-red-500/40',
  slate: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
}

export default function HealthDashboard() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setProfile(getProfile())
  }, [])

  if (!profile || !profile.weight || !profile.height) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-100">Health Dashboard</h1>
        <p className="mt-4 rounded-xl bg-amber-500/20 p-6 text-amber-200">
          Please complete your profile first (gender, age, height, weight, diet,
          goal) to see your health insights.
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

  const bmi = calculateBMI(profile.weight, profile.height)
  const bmiStatus = getBMIStatus(bmi)
  const water = calculateWaterIntake(profile.weight)
  const protein = calculateProteinRequirement(profile.weight, profile.goal)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">
        Health Dashboard
      </h1>
      <p className="mt-2 text-slate-400">
        Your personalized health metrics based on your profile.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className={`rounded-xl border p-6 ${
            colorClasses[bmiStatus.color] || colorClasses.slate
          }`}
        >
          <p className="text-sm font-medium opacity-90">BMI Status</p>
          <p className="mt-1 text-2xl font-bold">{bmiStatus.label}</p>
          <p className="mt-1 text-sm opacity-80">BMI: {bmi}</p>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-6">
          <p className="text-sm font-medium text-slate-400">Water Intake</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">
            {water.glasses} glasses
          </p>
          <p className="mt-1 text-sm text-slate-400">
            ~{water.ml} ml per day
          </p>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-6">
          <p className="text-sm font-medium text-slate-400">Protein Required</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{protein}g/day</p>
          <p className="mt-1 text-sm text-slate-400">
            Goal: {profile.goal === 'slim' ? 'Slim' : profile.goal === 'muscle' ? 'Build Muscle' : 'Maintain'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-6">
          <p className="text-sm font-medium text-slate-400">Diet</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {profile.diet === 'veg' ? 'Vegetarian' : profile.diet === 'nonveg' ? 'Non-Vegetarian' : '-'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-slate-800/40 p-6 ring-1 ring-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">Quick Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {bmiStatus.label === 'Underweight' && (
            <li>• Focus on calorie-dense, nutrient-rich foods. Include healthy fats and proteins.</li>
          )}
          {bmiStatus.label === 'Perfect / Normal' && (
            <li>• Great! Maintain your balanced diet and stay active.</li>
          )}
          {(bmiStatus.label === 'Overweight' || bmiStatus.label === 'Obese') && (
            <li>• Consider a calorie deficit with nutrient-dense foods. Increase activity gradually.</li>
          )}
          <li>• Drink water throughout the day—aim for {water.glasses} glasses (~{water.ml} ml).</li>
          <li>• Target {protein}g of protein daily for your goal.</li>
        </ul>
      </div>
    </div>
  )
}
