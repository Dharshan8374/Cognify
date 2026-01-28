import React, { useEffect, useRef, useState } from 'react';
import { Music, TrendingUp, Guitar, Piano, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import { AudioAnalysis, ChordData } from '../App';

interface ChordTimelineProps {
  analysis: AudioAnalysis;
  currentTime: number;
  isPlaying: boolean;
}

export const ChordTimeline: React.FC<ChordTimelineProps> = ({
  analysis,
  currentTime,
  isPlaying
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'guitar' | 'piano' | 'notation'>('timeline');

  const prevChordIndexRef = useRef<number>(-1);

  // Auto-scroll to current chord
  useEffect(() => {
    if (!scrollRef.current || !isPlaying) return;

    const currentChordIndex = analysis.chords.findIndex(
      (chord, index) => {
        const nextChord = analysis.chords[index + 1];
        return currentTime >= chord.time && (!nextChord || currentTime < nextChord.time);
      }
    );

    // Only scroll if the index has changed to prevent UI freezing
    if (currentChordIndex >= 0 && currentChordIndex !== prevChordIndexRef.current) {
      prevChordIndexRef.current = currentChordIndex;

      const container = scrollRef.current;
      const child = container.children[currentChordIndex] as HTMLElement;

      if (container && child) {
        // Calculate center position
        const containerWidth = container.clientWidth;
        const childLeft = child.offsetLeft;
        const childWidth = child.clientWidth;

        const targetSubstr = childLeft - (containerWidth / 2) + (childWidth / 2);

        container.scrollTo({
          left: targetSubstr,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, isPlaying, analysis.chords]);

  const getCurrentChord = (): ChordData | null => {
    return analysis.chords.find((chord, index) => {
      const nextChord = analysis.chords[index + 1];
      return currentTime >= chord.time && (!nextChord || currentTime < nextChord.time);
    }) || null;
  };

  const getChordDiagram = (chord: string): string[] => {
    // Mock guitar chord diagrams - in production, this would use a chord dictionary
    const diagrams: { [key: string]: string[] } = {
      'C': ['x', '3', '2', '0', '1', '0'],
      'Dm': ['x', 'x', '0', '2', '3', '1'],
      'Em': ['0', '2', '2', '0', '0', '0'],
      'F': ['1', '3', '3', '2', '1', '1'],
      'G': ['3', '2', '0', '0', '0', '3'],
      'Am': ['x', '0', '2', '2', '1', '0'],
      'G7': ['3', '2', '0', '0', '0', '1'],
    };

    return diagrams[chord] || ['x', 'x', 'x', 'x', 'x', 'x'];
  };

  const getPianoKeys = (chord: string): { white: string[], black: string[], pressed: string[] } => {
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'D#', '', 'F#', 'G#', 'A#', ''];

    // Piano chord mappings
    const pianoChords: { [key: string]: string[] } = {
      'C': ['C', 'E', 'G'],
      'Dm': ['D', 'F', 'A'],
      'Em': ['E', 'G', 'B'],
      'F': ['F', 'A', 'C'],
      'G': ['G', 'B', 'D'],
      'Am': ['A', 'C', 'E'],
      'G7': ['G', 'B', 'D', 'F'],
      'C7': ['C', 'E', 'G', 'Bb'],
      'Fmaj7': ['F', 'A', 'C', 'E'],
    };

    const pressed = pianoChords[chord] || [];
    return { white: whiteKeys, black: blackKeys, pressed };
  };

  const getNotationSVG = (chord: string): string => {
    // Simple SVG notation for chords
    const notations: { [key: string]: string } = {
      'C': `
        <svg viewBox="0 0 200 120" className="w-full h-24">
          <g stroke="#374151" strokeWidth="1" fill="none">
            <line x1="20" y1="20" x2="180" y2="20"/>
            <line x1="20" y1="35" x2="180" y2="35"/>
            <line x1="20" y1="50" x2="180" y2="50"/>
            <line x1="20" y1="65" x2="180" y2="65"/>
            <line x1="20" y1="80" x2="180" y2="80"/>
          </g>
          <circle cx="40" cy="50" r="6" fill="#3B82F6"/>
          <circle cx="70" cy="35" r="6" fill="#3B82F6"/>
          <circle cx="100" cy="20" r="6" fill="#3B82F6"/>
          <text x="20" y="100" fill="#374151" fontSize="14" fontFamily="serif">C Major</text>
        </svg>
      `,
      'Dm': `
        <svg viewBox="0 0 200 120" className="w-full h-24">
          <g stroke="#374151" strokeWidth="1" fill="none">
            <line x1="20" y1="20" x2="180" y2="20"/>
            <line x1="20" y1="35" x2="180" y2="35"/>
            <line x1="20" y1="50" x2="180" y2="50"/>
            <line x1="20" y1="65" x2="180" y2="65"/>
            <line x1="20" y1="80" x2="180" y2="80"/>
          </g>
          <circle cx="40" cy="65" r="6" fill="#8B5CF6"/>
          <circle cx="70" cy="50" r="6" fill="#8B5CF6"/>
          <circle cx="100" cy="35" r="6" fill="#8B5CF6"/>
          <text x="20" y="100" fill="#374151" fontSize="14" fontFamily="serif">D Minor</text>
        </svg>
      `,
    };

    return notations[chord] || notations['C'];
  };

  const currentChord = getCurrentChord();
  const [showSimplified, setShowSimplified] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Music className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Chord Progression</h2>
          {currentChord && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
              <span className="text-sm text-blue-200">Now Playing:</span>
              <span className="text-lg font-bold text-white">{currentChord.chord}</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-200">{Math.round(currentChord.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex bg-white/20 rounded-lg p-1 space-x-1">
          <button
            onClick={() => setShowSimplified(!showSimplified)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center ${showSimplified
              ? 'bg-green-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            title="Hide passing notes"
          >
            {showSimplified ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
            Simplify
          </button>
          <div className="w-[1px] bg-white/20 mx-1"></div>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('guitar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'guitar'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            <Guitar className="w-4 h-4 inline mr-2" />
            Guitar
          </button>
          <button
            onClick={() => setViewMode('piano')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'piano'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            <Piano className="w-4 h-4 inline mr-2" />
            Piano
          </button>
          <button
            onClick={() => setViewMode('notation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'notation'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Notation
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {analysis.chords.map((chord, index) => {
          const isActive = currentChord?.time === chord.time;
          const isPast = currentTime > chord.time;
          const chordDiagram = getChordDiagram(chord.chord);
          const pianoKeys = getPianoKeys(chord.chord);

          return (
            <div
              key={index}
              className={`
                flex-shrink-0 p-4 rounded-lg border transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 scale-110 shadow-lg'
                  : isPast
                    ? 'bg-white/20 border-white/30'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }
              `}
              style={{ minWidth: '200px' }}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${isActive ? 'text-white' : 'text-white'}`}>
                  {chord.chord}
                </div>
                <div className={`text-xs mb-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  Bar {chord.bar}, Beat {chord.beat}
                </div>

                {/* View Specific Content */}
                <div className="flex justify-center my-2">
                  {viewMode === 'timeline' && analysis.melody && (
                    <div className="flex flex-col space-y-1 w-full max-h-[120px] overflow-y-auto custom-scrollbar">
                      {analysis.melody
                        .filter(m => m.time >= chord.time && (!analysis.chords[index + 1] || m.time < analysis.chords[index + 1].time))
                        .filter(m => !showSimplified || m.role === 'Chord Tone') // Simplify logic
                        .filter((m, i, arr) => i === 0 || m.note !== arr[i - 1].note) // Deduplicate
                        .map((note, idx) => {
                          let colorClass = "text-gray-400";
                          let bgClass = "bg-gray-700/50";
                          let interval = "";

                          if (note.role === "Chord Tone") {
                            colorClass = "text-green-300";
                            bgClass = "bg-green-500/20 border-green-500/30";
                            interval = "Target";
                          } else if (note.role === "Scale Note") {
                            colorClass = "text-blue-300";
                            bgClass = "bg-blue-500/20 border-blue-500/30";
                            interval = "Motion";
                          } else { // Passing Note
                            colorClass = "text-orange-300";
                            bgClass = "bg-orange-500/20 border-orange-500/30";
                            interval = "Tension";
                          }

                          return (
                            <div key={idx} className={`text-[10px] px-2 py-0.5 rounded border ${bgClass} ${colorClass} whitespace-nowrap flex justify-between`}>
                              <span>{note.note}</span>
                              <span className="opacity-70 text-[9px] uppercase tracking-wider ml-2">{interval}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {viewMode === 'guitar' && (
                    <div className="bg-amber-100/90 rounded p-2 text-black w-32 relative">
                      {/* Melody Highlight Overlay (Simplistic) */}
                      {analysis.melody && analysis.melody
                        .filter(m => m.time >= chord.time && (!analysis.chords[index + 1] || m.time < analysis.chords[index + 1].time))
                        .filter(m => isActive && Math.abs(m.time - currentTime) < 0.5) // Only current note
                        .slice(0, 1)
                        .map((m, mi) => (
                          <div key={mi} className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20 shadow-sm animate-bounce">
                            {m.note}
                          </div>
                        ))
                      }

                      <div className="grid grid-cols-6 gap-0.5 text-[8px] mb-1 font-bold">
                        {['E', 'A', 'D', 'G', 'B', 'e'].map(s => <div key={s}>{s}</div>)}
                      </div>
                      <div className="relative space-y-1">
                        {[0, 1, 2, 3].map((fret) => (
                          <div key={fret} className="grid grid-cols-6 gap-0.5 border-b border-gray-400 pb-1">
                            {chordDiagram.map((fretValue, sIdx) => {
                              const isPressed = fretValue !== 'x' && parseInt(fretValue) === fret;
                              return (
                                <div key={sIdx} className={`w-3 h-3 rounded-full mx-auto ${isPressed ? 'bg-blue-600' : ''}`}></div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewMode === 'piano' && (
                    <div className="bg-white rounded p-2 w-32 relative">
                      {/* Melody Highlight Overlay */}
                      {analysis.melody && analysis.melody
                        .filter(m => m.time >= chord.time && (!analysis.chords[index + 1] || m.time < analysis.chords[index + 1].time))
                        .filter(m => isActive && Math.abs(m.time - currentTime) < 0.5) // Only current note
                        .slice(0, 1)
                        .map((m, mi) => {
                          // Find key index for visualization (approximate)
                          // Just show a badge for now as mapping is complex
                          return (
                            <div key={mi} className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20 shadow-sm animate-bounce">
                              {m.note}
                            </div>
                          )
                        })
                      }

                      <div className="flex justify-between h-12 relative">
                        {/* Simplified Piano - White Keys */}
                        {pianoKeys.white.map((key, kIdx) => (
                          <div key={kIdx} className={`flex-1 border border-gray-300 ${pianoKeys.pressed.includes(key) ? 'bg-blue-500' : 'bg-white'}`}></div>
                        ))}
                        {/* Black Keys Mockup - simplified for small view */}
                        {pianoKeys.black.map((key, kIdx) => {
                          if (!key) return <div key={`spacer-${kIdx}`} className="absolute" style={{ width: 0 }} />;
                          return (
                            <div key={kIdx}
                              className={`absolute w-2 h-8 bg-black z-10 ${pianoKeys.pressed.includes(key) ? 'bg-blue-600' : ''}`}
                              style={{ left: `${(kIdx + 1) * 14.28 - 7}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {viewMode === 'notation' && (
                    <div dangerouslySetInnerHTML={{ __html: getNotationSVG(chord.chord).replace('width="100%"', 'width="150"').replace('height="100%"', 'height="80"') }} />
                  )}
                </div>

                <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  {Math.round(chord.time * 10) / 10}s
                </div>
                <div className="mt-2">
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {Math.round(chord.confidence * 100)}% confidence
                  </div>
                  <div className={`w-full bg-white/20 rounded-full h-1 mt-1`}>
                    <div
                      className={`h-1 rounded-full ${isActive ? 'bg-white' : 'bg-green-400'}`}
                      style={{ width: `${chord.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};