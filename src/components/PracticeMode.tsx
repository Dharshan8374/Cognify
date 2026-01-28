import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Piano, Check, X, AlertTriangle, Guitar } from 'lucide-react';
import { AudioAnalysis } from '../App';
import { useMidi } from '../hooks/useMidi';
import { GuitarChord } from './GuitarChord';

export const PracticeMode: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { analysis, audioUrl, audioFile } = location.state || {}; // Expecting state

    // Redirect if direct access without state
    useEffect(() => {
        if (!analysis) {
            navigate('/dashboard');
        }
    }, [analysis, navigate]);

    const { midiState, initMidi } = useMidi();
    const [instrument, setInstrument] = useState<'piano' | 'guitar'>('piano');

    // Auto-init MIDI on mount
    useEffect(() => {
        if (!midiState.enabled) {
            initMidi();
        }
    }, [midiState.enabled, initMidi]);


    // Simplified Practice Logic:
    // We just show a big Chord Card. 
    // Since we don't have the Player running here (user wants focused practice),
    // we might need to let user *scroll* or *select* a chord to practice?
    // OR did they mean "Play along with the song"?
    // "redirects to this focused practice where we use the already generated chords to verfiy"
    // Usually practice implies looping or stepping. 
    // Let's implement a simple "Step Sequencer" style or just "Click to Advance"?
    // OR, we can re-mount the AudioPlayer here?
    // User said "redirects ... verify ... only after inserting a chord".
    // This implies STEP mode. 
    // Show Chord 1 -> User plays Correct -> Auto Advance to Chord 2.
    // This is a great "Flow" for practice. Let's do that!

    const [currentChordIndex, setCurrentChordIndex] = useState(0);
    // Filter out both "N.C." and "No Chord" variants from backend
    const chords = (analysis?.chords || []).filter((c: any) => c.chord !== 'N.C.' && c.chord !== 'No Chord');
    const currentChordData = chords[currentChordIndex];
    const targetChord = currentChordData?.chord || "";

    // Normalize for comparison
    const normalize = (c: string) => c.replace('M', ''); // Cmaj7 -> Cmaj7, CM -> C

    const isNoChord = targetChord === 'N.C.';

    // Logic: If N.C., we check if NO keys are pressed.
    const isCorrect = isNoChord
        ? midiState.activeNotes.length === 0
        : midiState.detectedChord && (normalize(midiState.detectedChord) === normalize(targetChord));

    // Auto-advance logic
    useEffect(() => {
        if (isCorrect) {
            // Delay slightly then advance
            const timer = setTimeout(() => {
                if (currentChordIndex < chords.length - 1) {
                    setCurrentChordIndex(p => p + 1);
                }
            }, 500); // 0.5s Celebration
            return () => clearTimeout(timer);
        }
    }, [isCorrect, currentChordIndex, chords.length]);


    if (!analysis) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-gray-800 flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard', { state: { analysis, audioUrl, audioFile } })}
                    className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex items-center space-x-6">
                    {/* Instrument Toggle */}
                    <div className="bg-gray-800 p-1 rounded-lg flex text-sm shadow-inner">
                        <button
                            onClick={() => setInstrument('piano')}
                            className={`px-3 py-1.5 rounded-md flex items-center transition-all ${instrument === 'piano' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Piano className="w-4 h-4 mr-2" /> Piano
                        </button>
                        <button
                            onClick={() => setInstrument('guitar')}
                            className={`px-3 py-1.5 rounded-md flex items-center transition-all ${instrument === 'guitar' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Guitar className="w-4 h-4 mr-2" /> Guitar
                        </button>
                    </div>

                    <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
                        <div className={`w-3 h-3 rounded-full ${midiState.connectedDevice ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-300">
                            {midiState.connectedDevice || "No MIDI"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">

                {/* Progress */}
                <div className="w-full max-w-2xl">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Chord {currentChordIndex + 1} of {chords.length}</span>
                        <span>{Math.round(((currentChordIndex) / chords.length) * 100)}% Complete</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentChordIndex) / chords.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* The Challenge */}
                <div className="flex items-center space-x-12">
                    {/* Target */}
                    <div className="text-center space-y-4">
                        {instrument === 'piano' ? (
                            <div className="text-9xl font-bold font-mono text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                                {isNoChord ? "REST" : targetChord}
                            </div>
                        ) : (
                            isNoChord ? (
                                <div className="w-64 h-80 flex items-center justify-center text-gray-500 font-bold text-2xl border-4 border-dashed border-gray-700 rounded-xl">
                                    MUTED
                                </div>
                            ) : (
                                <GuitarChord chord={targetChord} className="w-64 h-80 mx-auto transform scale-125 origin-top" />
                            )
                        )}

                        <div className="text-gray-500 text-lg">
                            {isNoChord ? "Release all keys" : `Bar ${currentChordData.bar} • Beat ${currentChordData.beat}`}
                        </div>
                    </div>

                    <div className="h-32 w-[1px] bg-gray-700"></div>

                    {/* Detected */}
                    <div className="text-center space-y-4">
                        <h2 className="text-gray-400 uppercase tracking-widest text-sm">You Played</h2>
                        <div className={`text-6xl font-bold font-mono transition-colors ${isCorrect ? 'text-green-400' : midiState.detectedChord ? 'text-red-400' : 'text-gray-700'
                            }`}>
                            {midiState.detectedChord || "?"}
                        </div>
                        <div className="text-gray-500 text-lg h-6">
                            {isCorrect ? "Perfect! Next..." : midiState.detectedChord ? "Try Again" : "Waiting..."}
                        </div>
                    </div>
                </div>

                {/* Feedback Banner */}
                {isCorrect && (
                    <div className="animate-bounce bg-green-500/20 text-green-400 border border-green-500/50 px-8 py-4 rounded-full text-xl font-bold flex items-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <Check className="w-8 h-8 mr-3" />
                        Correct! Moving to next chord...
                    </div>
                )}
                {!isCorrect && midiState.detectedChord && (
                    <div className="animate-pulse bg-red-500/10 text-red-400 border border-red-500/30 px-6 py-3 rounded-full text-lg font-medium flex items-center">
                        <X className="w-6 h-6 mr-2" />
                        Incorrect
                    </div>
                )}

            </main>

            {/* Instructions Footer */}
            <footer className="p-6 text-center text-gray-500 text-sm">
                Play using {instrument === 'piano' ? 'MIDI Keyboard or Keys A-K' : 'your guitar (visual reference)'}
            </footer>
        </div>
    );
};
