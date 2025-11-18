'use client'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

function ProtectedDashboard() {
  return (
    <SignedIn>
      <Dashboard />
    </SignedIn>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <SignedOut>
            <Login />
          </SignedOut>
        }
      />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
