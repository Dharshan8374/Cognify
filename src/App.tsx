import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { LandingPage } from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ChordAnalyzer } from './components/ChordAnalyzer';
import { PracticeMode } from './components/PracticeMode';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

export interface ChordData {
  time: number;
  chord: string;
  confidence: number;
  beat: number;
  bar: number;
}

export interface MelodyEvent {
  time: number;
  pitch: number;
  note: string;
  role: 'Chord Tone' | 'Scale Note' | 'Passing Note';
}

export interface AudioAnalysis {
  duration: number;
  bpm: number;
  key: string;
  timeSignature: string;
  chords: ChordData[];
  melody: MelodyEvent[];
  audioUrl?: string;
  stems?: { [key: string]: string };
}

function App() {
  const { isLoaded } = useAuth();

  // Show loading screen while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing ChordAI...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/sign-in"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/sign-up"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ChordAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <PracticeMode />
            </ProtectedRoute>
          }
        />

        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;