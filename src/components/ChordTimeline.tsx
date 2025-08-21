import React, { useEffect, useRef, useState } from 'react';
import { Music, TrendingUp, Guitar, Piano, BookOpen, Scale } from 'lucide-react';
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

  // Auto-scroll to current chord
  useEffect(() => {
    if (!scrollRef.current || !isPlaying) return;

    const currentChordIndex = analysis.chords.findIndex(
      (chord, index) => {
        const nextChord = analysis.chords[index + 1];
        return currentTime >= chord.time && (!nextChord || currentTime < nextChord.time);
      }
    );

    if (currentChordIndex >= 0) {
      const chordElement = scrollRef.current.children[currentChordIndex] as HTMLElement;
      if (chordElement) {
        chordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
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

  const getChordScale = (chord: string): { scale: string[], intervals: string[] } => {
    const scales: { [key: string]: { scale: string[], intervals: string[] } } = {
      'C': { 
        scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], 
        intervals: ['1', '2', '3', '4', '5', '6', '7'] 
      },
      'Dm': { 
        scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'], 
        intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] 
      },
      'Em': { 
        scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'], 
        intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] 
      },
      'F': { 
        scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'], 
        intervals: ['1', '2', '3', '4', '5', '6', '7'] 
      },
      'G': { 
        scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], 
        intervals: ['1', '2', '3', '4', '5', '6', '7'] 
      },
      'Am': { 
        scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], 
        intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] 
      },
      'G7': { 
        scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F'], 
        intervals: ['1', '2', '3', '4', '5', '6', 'b7'] 
      },
    };
    
    return scales[chord] || { scale: [], intervals: [] };
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
        
        <div className="flex bg-white/20 rounded-lg p-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'timeline' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('guitar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'guitar' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Guitar className="w-4 h-4 inline mr-2" />
            Guitar
          </button>
          <button
            onClick={() => setViewMode('piano')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'piano' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Piano className="w-4 h-4 inline mr-2" />
            Piano
          </button>
          <button
            onClick={() => setViewMode('notation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'notation' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Notation
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div 
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {analysis.chords.map((chord, index) => {
            const isActive = currentChord?.time === chord.time;
            const isPast = currentTime > chord.time;
            
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
              >
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${isActive ? 'text-white' : 'text-white'}`}>
                    {chord.chord}
                  </div>
                  <div className={`text-xs mb-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    Bar {chord.bar}, Beat {chord.beat}
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
      ) : viewMode === 'guitar' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(new Set(analysis.chords.map(c => c.chord))).map((chord) => {
            const diagram = getChordDiagram(chord);
            const isCurrentChord = currentChord?.chord === chord;
            
            return (
              <div
                key={chord}
                className={`
                  p-6 rounded-lg border transition-all
                  ${isCurrentChord 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400 shadow-lg' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                <h3 className={`text-2xl font-bold text-center mb-4 ${isCurrentChord ? 'text-blue-200' : 'text-white'}`}>
                  {chord}
                </h3>
                
                {/* Guitar Fretboard */}
                <div className="bg-amber-100/90 rounded-lg p-4">
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {['E', 'A', 'D', 'G', 'B', 'e'].map((string, i) => (
                      <div key={i} className="text-center text-xs text-gray-600 font-medium">
                        {string}
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    {/* Frets */}
                    {[0, 1, 2, 3].map((fret) => (
                      <div key={fret} className="grid grid-cols-6 gap-1 border-b border-gray-400 pb-2 mb-2">
                        {diagram.map((fretValue, stringIndex) => {
                          const isPressed = fretValue !== 'x' && parseInt(fretValue) === fret;
                          const isMuted = fretValue === 'x' && fret === 0;
                          
                          return (
                            <div
                              key={stringIndex}
                              className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${isPressed 
                                  ? 'bg-blue-500 text-white' 
                                  : isMuted 
                                  ? 'text-red-500' 
                                  : 'bg-gray-200'
                                }
                              `}
                            >
                              {fret === 0 && fretValue === 'x' ? '×' : 
                               fret === 0 && fretValue === '0' ? '○' :
                               isPressed ? fret : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'piano' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(new Set(analysis.chords.map(c => c.chord))).map((chord) => {
            const { white, black, pressed } = getPianoKeys(chord);
            const isCurrentChord = currentChord?.chord === chord;
            const chordScale = getChordScale(chord);
            
            return (
              <div
                key={chord}
                className={`
                  p-6 rounded-lg border transition-all
                  ${isCurrentChord 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400 shadow-lg' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                <h3 className={`text-2xl font-bold text-center mb-4 ${isCurrentChord ? 'text-blue-200' : 'text-white'}`}>
                  {chord}
                </h3>
                
                {/* Piano Keyboard */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="relative h-24">
                    {/* White Keys */}
                    <div className="flex">
                      {white.map((key, i) => (
                        <div
                          key={i}
                          className={`
                            flex-1 h-20 border border-gray-300 flex items-end justify-center pb-2 text-xs font-medium
                            ${pressed.includes(key) 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {key}
                        </div>
                      ))}
                    </div>
                    
                    {/* Black Keys */}
                    <div className="absolute top-0 flex">
                      {black.map((key, i) => {
                        if (!key) return <div key={i} className="w-8"></div>;
                        return (
                          <div
                            key={i}
                            className={`
                              w-6 h-12 -ml-3 mr-3 flex items-end justify-center pb-1 text-xs font-medium
                              ${pressed.includes(key) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                              }
                            `}
                            style={{ marginLeft: i === 0 ? '1.5rem' : '-0.75rem' }}
                          >
                            {key}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Scale Information */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                    <Scale className="w-4 h-4 mr-2" />
                    Related Scale
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {chordScale.scale.map((note, i) => (
                      <div key={i} className="text-center">
                        <div className={`
                          p-1 rounded mb-1 font-medium
                          ${pressed.includes(note) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700 text-gray-300'
                          }
                        `}>
                          {note}
                        </div>
                        <div className="text-gray-400">
                          {chordScale.intervals[i]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from(new Set(analysis.chords.map(c => c.chord))).map((chord) => {
            const isCurrentChord = currentChord?.chord === chord;
            const chordScale = getChordScale(chord);
            
            return (
              <div
                key={chord}
                className={`
                  p-6 rounded-lg border transition-all
                  ${isCurrentChord 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400 shadow-lg' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }
                `}
              >
                <h3 className={`text-2xl font-bold text-center mb-4 ${isCurrentChord ? 'text-blue-200' : 'text-white'}`}>
                  {chord}
                </h3>
                
                {/* Musical Notation */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="relative">
                    {/* Staff Lines */}
                    <svg viewBox="0 0 300 120" className="w-full h-24">
                      <g stroke="#374151" strokeWidth="1" fill="none">
                        <line x1="20" y1="20" x2="280" y2="20"/>
                        <line x1="20" y1="35" x2="280" y2="35"/>
                        <line x1="20" y1="50" x2="280" y2="50"/>
                        <line x1="20" y1="65" x2="280" y2="65"/>
                        <line x1="20" y1="80" x2="280" y2="80"/>
                      </g>
                      
                      {/* Treble Clef */}
                      <text x="25" y="55" fill="#374151" fontSize="24" fontFamily="serif">𝄞</text>
                      
                      {/* Notes based on chord */}
                      {chord === 'C' && (
                        <>
                          <circle cx="80" cy="80" r="4" fill="#3B82F6"/>
                          <circle cx="110" cy="65" r="4" fill="#3B82F6"/>
                          <circle cx="140" cy="50" r="4" fill="#3B82F6"/>
                        </>
                      )}
                      {chord === 'Dm' && (
                        <>
                          <circle cx="80" cy="72" r="4" fill="#8B5CF6"/>
                          <circle cx="110" cy="58" r="4" fill="#8B5CF6"/>
                          <circle cx="140" cy="43" r="4" fill="#8B5CF6"/>
                        </>
                      )}
                      {chord === 'Em' && (
                        <>
                          <circle cx="80" cy="65" r="4" fill="#10B981"/>
                          <circle cx="110" cy="50" r="4" fill="#10B981"/>
                          <circle cx="140" cy="35" r="4" fill="#10B981"/>
                        </>
                      )}
                      {chord === 'F' && (
                        <>
                          <circle cx="80" cy="58" r="4" fill="#F59E0B"/>
                          <circle cx="110" cy="43" r="4" fill="#F59E0B"/>
                          <circle cx="140" cy="80" r="4" fill="#F59E0B"/>
                        </>
                      )}
                      {chord === 'G' && (
                        <>
                          <circle cx="80" cy="50" r="4" fill="#EF4444"/>
                          <circle cx="110" cy="35" r="4" fill="#EF4444"/>
                          <circle cx="140" cy="72" r="4" fill="#EF4444"/>
                        </>
                      )}
                      {chord === 'Am' && (
                        <>
                          <circle cx="80" cy="43" r="4" fill="#8B5CF6"/>
                          <circle cx="110" cy="80" r="4" fill="#8B5CF6"/>
                          <circle cx="140" cy="65" r="4" fill="#8B5CF6"/>
                        </>
                      )}
                      
                      <text x="200" y="100" fill="#374151" fontSize="16" fontFamily="serif">{chord}</text>
                    </svg>
                  </div>
                </div>
                
                {/* Chord Analysis */}
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Chord Tones</h4>
                    <div className="flex flex-wrap gap-2">
                      {getPianoKeys(chord).pressed.map((note, i) => (
                        <span key={i} className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Scale Degrees</h4>
                    <div className="flex flex-wrap gap-2">
                      {chordScale.intervals.slice(0, getPianoKeys(chord).pressed.length).map((interval, i) => (
                        <span key={i} className="bg-purple-500 text-white px-2 py-1 rounded text-sm font-medium">
                          {interval}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};