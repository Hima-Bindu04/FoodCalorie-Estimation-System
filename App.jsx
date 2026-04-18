import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FoodAnalyzer from './pages/FoodAnalyzer'
import Profile from './pages/Profile'
import HealthDashboard from './pages/HealthDashboard'
import FoodSuggestions from './pages/FoodSuggestions'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<FoodAnalyzer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/health" element={<HealthDashboard />} />
          <Route path="/suggestions" element={<FoodSuggestions />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
