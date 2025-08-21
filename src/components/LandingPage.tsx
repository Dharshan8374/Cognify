import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, AudioWaveform as Waveform, Guitar, Piano, FileMusic, Sparkles, Users, Award, ArrowRight, Play, Download, Zap } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ChordAI</h1>
                <p className="text-xs text-gray-400">AI-Powered Music Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/sign-in">
                <button className="text-gray-300 hover:text-white transition-colors font-medium">
                  Sign In
                </button>
              </Link>
              <Link to="/sign-up">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8 shadow-2xl">
            <Music2 className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI-Powered
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
              Chord Analysis
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Upload your music and get instant chord progressions, lead sheets, 
            guitar diagrams, and piano arrangements with 85%+ accuracy
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/sign-up">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all flex items-center space-x-2 group">
                <span>Start Analyzing Music</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <button className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all flex items-center space-x-2 border border-white/20">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-400" />
              <span>10,000+ musicians trust us</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>85%+ accuracy guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need for Music Analysis
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional-grade tools that work with any audio format, 
            from bedroom recordings to studio masters
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Waveform className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Analysis</h3>
            <p className="text-gray-300 leading-relaxed">
              Advanced machine learning models analyze your audio with industry-leading 
              accuracy. Beat tracking, onset detection, and harmonic analysis in seconds.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Guitar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Guitar Diagrams</h3>
            <p className="text-gray-300 leading-relaxed">
              Visual chord shapes synchronized with your music timeline. 
              Perfect for guitarists learning new songs or teaching students.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Piano className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Piano Arrangements</h3>
            <p className="text-gray-300 leading-relaxed">
              Interactive piano keyboard with chord fingerings, scales, and music theory analysis. 
              See exactly which keys to press for each chord.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileMusic className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Multi-Format Export</h3>
            <p className="text-gray-300 leading-relaxed">
              Export to CSV, MIDI, MusicXML, and PDF lead sheets. 
              Compatible with all major DAWs and notation software.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Real-Time Sync</h3>
            <p className="text-gray-300 leading-relaxed">
              Watch chords highlight in perfect sync with your audio playback. 
              Interactive timeline with beat-accurate chord changes.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Instant Downloads</h3>
            <p className="text-gray-300 leading-relaxed">
              Get your results immediately. No waiting, no processing queues. 
              Download chord charts and lead sheets as soon as analysis completes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-3xl p-12 border border-blue-500/30 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Music Analysis?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of musicians, producers, and educators who use ChordAI 
            to unlock the secrets of their favorite songs.
          </p>
          
          <Link to="/sign-up">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center space-x-3 group">
              <span>Start Your Free Analysis</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          
          <p className="text-sm text-gray-400 mt-4">
            No credit card required • Instant access • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ChordAI</h3>
                <p className="text-xs text-gray-400">AI-Powered Music Analysis</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2025 ChordAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};