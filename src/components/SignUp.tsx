import React from 'react';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Music2, ArrowLeft, Sparkles, Users, Award } from 'lucide-react';

export const SignUp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:text-blue-300 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
              <Music2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ChordAI</h1>
              <p className="text-sm text-gray-400">AI-Powered Music Analysis</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Get Started</h2>
          <p className="text-gray-300">Create your account and start analyzing music</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="bg-yellow-500/20 p-3 rounded-lg mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400 mx-auto" />
            </div>
            <p className="text-xs text-gray-300">Free to start</p>
          </div>
          <div className="text-center">
            <div className="bg-green-500/20 p-3 rounded-lg mb-2">
              <Users className="w-5 h-5 text-green-400 mx-auto" />
            </div>
            <p className="text-xs text-gray-300">10k+ users</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500/20 p-3 rounded-lg mb-2">
              <Award className="w-5 h-5 text-blue-400 mx-auto" />
            </div>
            <p className="text-xs text-gray-300">85% accuracy</p>
          </div>
        </div>

        {/* Clerk SignUp Component */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <ClerkSignUp 
            path="/sign-up"
            routing="path"
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: '#3B82F6',
                colorBackground: 'transparent',
                colorInputBackground: 'rgba(255, 255, 255, 0.1)',
                colorInputText: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#d1d5db',
                borderRadius: '0.75rem',
              },
              elements: {
                formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg transition-all',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white',
                headerSubtitle: 'text-gray-300',
                socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                formFieldLabel: 'text-gray-300',
                dividerLine: 'bg-white/20',
                dividerText: 'text-gray-400',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};