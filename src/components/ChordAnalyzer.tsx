import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Upload, Music, Download, Guitar, FileMusic, AudioWaveform as Waveform, Music2, FolderOpen, Save, Piano } from 'lucide-react';
import { AudioUpload } from './AudioUpload';
import { AudioPlayer } from './AudioPlayer';
import { ChordTimeline } from './ChordTimeline';
import { ExportPanel } from './ExportPanel';
import { Library } from './Library';
import { analyzeChordsAI } from '../utils/chordAnalysis';
import { AudioAnalysis, ChordData } from '../App';



export const ChordAnalyzer: React.FC = () => {
  // Handler to reset the state for re-upload
  const handleReupload = useCallback(() => {
    setAudioFile(null);
    setAudioUrl('');
    setAnalysis(null);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);
  const location = useLocation();
  const locationState = location.state as { analysis?: AudioAnalysis, audioUrl?: string, audioFile?: File } | null;

  const [audioFile, setAudioFile] = useState<File | null>(locationState?.audioFile || null);
  const [audioUrl, setAudioUrl] = useState<string>(locationState?.audioUrl || '');
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(locationState?.analysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const navigate = useNavigate();

  const handleFileUpload = useCallback(async (file: File) => {
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis with realistic delay
      const analysisResult = await analyzeChordsAI(file);
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleSave = async () => {
    if (!analysis || !audioFile) return;
    try {
      setSaveStatus('saving');
      const res = await fetch('http://localhost:5000/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: audioFile.name.replace(/\.[^/.]+$/, "") || "Untitled Song",
          artist: "Unknown Artist",
          analysis: analysis
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

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
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center px-4 py-2 rounded-full bg-slate-800 border border-white/10 hover:bg-slate-700 transition-all text-sm font-medium text-white"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Library
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "bg-gray-800 border border-gray-700",
                    userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-gray-700",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <Library
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onLoad={(newAnalysis) => {
          setAnalysis(newAnalysis);
          // Only clear file, but if analysis has audioUrl, use it
          setAudioFile(null);
          if (newAnalysis.audioUrl) {
            setAudioUrl(newAnalysis.audioUrl);
          } else {
            setAudioUrl('');
          }
        }}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Modify check to show Player even if audioFile is null but audioUrl exists */}
        {!audioFile && !audioUrl ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                <Music className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                AI Chord Analyzer
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Upload your music and get instant chord progressions, lead sheets, and guitar diagrams
              </p>
            </div>

            <AudioUpload onFileUpload={handleFileUpload} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <Waveform className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
                <p className="text-gray-300 text-sm">Advanced ML models detect chords with 85%+ accuracy</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <Guitar className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Guitar Diagrams</h3>
                <p className="text-gray-300 text-sm">Visual chord shapes synchronized with your music</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <FileMusic className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Format Export</h3>
                <p className="text-gray-300 text-sm">CSV, MIDI, MusicXML, and PDF lead sheets</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Re-upload Button */}
            <div className="flex justify-end space-x-2">
              {analysis && audioFile && (
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saved'}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all text-sm font-medium border border-blue-500/30 ${saveStatus === 'saved'
                    ? 'bg-green-500/20 text-green-300 border-green-500/30 cursor-default'
                    : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white'
                    }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Analysis'}
                </button>
              )}
              <button
                onClick={handleReupload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-all"
                disabled={isAnalyzing}
                title="Upload a new audio file"
              >
                {isAnalyzing ? 'Analyzing...' : 'Upload New Audio'}
              </button>
            </div>
            {/* MIDI Practice Button */}
            {analysis && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => navigate('/practice', { state: { analysis, audioUrl, audioFile } })}
                  className="flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5"
                >
                  <Piano className="w-5 h-5 mr-2" />
                  Enter Practice Mode
                </button>
              </div>
            )}
            {/* Analysis Status */}
            {isAnalyzing && (
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analyzing Audio...</h3>
                    <p className="text-blue-200">AI is processing chord progressions and beat alignment</p>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Player */}
            {audioUrl && (
              <AudioPlayer
                audioUrl={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onPlayStateChange={handlePlayStateChange}
                analysis={analysis}
              />
            )}

            {/* Chord Timeline */}
            {analysis && (
              <ChordTimeline
                analysis={analysis}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            )}

            {/* Export Panel */}
            {analysis && (
              <ExportPanel
                analysis={analysis}
                audioFile={audioFile}
              />
            )}


          </div>
        )}
      </main>
    </div>
  );
};