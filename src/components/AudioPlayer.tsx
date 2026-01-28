import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, Repeat, Zap, Mic, Drum, Guitar, Keyboard, Radio } from 'lucide-react';
import { AudioAnalysis } from '../App';
import { audioCache } from '../utils/AudioCache';

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  analysis: AudioAnalysis | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onTimeUpdate,
  onPlayStateChange,
  analysis
}) => {
  // Web Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<{ [key: string]: AudioBufferSourceNode }>({});
  const gainsRef = useRef<{ [key: string]: GainNode }>({});
  const buffersRef = useRef<{ [key: string]: AudioBuffer }>({});

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Mute States
  const [stemMutes, setStemMutes] = useState({
    vocals: false,
    drums: false,
    bass: false,
    other: false
  });
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Looping
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  // Time tracking
  const startTimeRef = useRef<number>(0); // When playback started (context time)
  const pauseTimeRef = useRef<number>(0); // Where we paused (song time)
  const anchorTimeRef = useRef<number>(0); // Song time at last rate change
  const anchorCtxTimeRef = useRef<number>(0); // Context time at last rate change
  const playbackRateRef = useRef<number>(1.0); // Ref for loop access
  const isLoopingRef = useRef<boolean>(false);
  const loopStartRef = useRef<number | null>(null);
  const loopEndRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync refs
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { loopStartRef.current = loopStart; }, [loopStart]);
  useEffect(() => { loopEndRef.current = loopEnd; }, [loopEnd]);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = async () => {
      if (!audioUrl) return;
      setIsLoading(true);
      setLoadingProgress(0);

      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        // reuse context if possible or make new one? 
        // For simplicity, new context each mount is safer to avoid state drift, 
        // but buffers are cached.
        const ctx = new Ctx();
        audioContextRef.current = ctx;

        // Master Gain (Final Output)
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Load Files
        const urlsToLoad = { master: audioUrl };
        if (analysis?.stems) {
          Object.assign(urlsToLoad, analysis.stems);
          // Default to muted master when stems exist
          setIsMasterMuted(true);
        }

        const total = Object.keys(urlsToLoad).length;
        let loaded = 0;

        for (const [key, url] of Object.entries(urlsToLoad)) {
          // Use Cache
          const audioBuffer = await audioCache.get(url, ctx);

          buffersRef.current[key] = audioBuffer;

          // Create Gain Node for this track
          const gainNode = ctx.createGain();
          gainNode.connect(masterGain);
          gainsRef.current[key] = gainNode;

          if (key === 'master') {
            setDuration(audioBuffer.duration);
          }
          loaded++;
          setLoadingProgress((loaded / total) * 100);
        }
      } catch (e) {
        console.error("Failed to load audio", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl, analysis]);


  // Helper to account for looping in linearized time
  const getNormalizedTime = useCallback((rawTime: number) => {
    const looping = isLoopingRef.current;
    const start = loopStartRef.current;
    const end = loopEndRef.current;

    if (looping && start !== null && end !== null && end > start) {
      if (rawTime >= end) {
        const loopLen = end - start;
        return start + ((rawTime - start) % loopLen);
      } else if (rawTime < start) {
        return start;
      }
    }
    return rawTime;
  }, []); // No deps, uses refs

  // Playback Logic
  const play = useCallback(() => {
    if (!audioContextRef.current || isLoading) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Ensure we start from a valid time within loop if looping
    let startOffset = pauseTimeRef.current;

    // Only normalize if we are resuming? 
    // If we just paused, pauseTimeRef is correct.
    // If we changed loop params while paused, we might need check.
    startOffset = getNormalizedTime(startOffset);

    // Create sources from buffers
    Object.entries(buffersRef.current).forEach(([key, buffer]) => {
      // Stop old if exists
      if (sourcesRef.current[key]) {
        try { sourcesRef.current[key].stop(); } catch (e) { }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Connect to its specific gain node
      if (gainsRef.current[key]) {
        source.connect(gainsRef.current[key]);
      }

      // Native Loop Support
      if (isLoopingRef.current && loopStartRef.current !== null && loopEndRef.current !== null) {
        source.loop = true;
        source.loopStart = loopStartRef.current;
        source.loopEnd = loopEndRef.current;
      }

      // Playback Rate - Set initial value
      source.playbackRate.value = playbackRateRef.current;

      // Calculate start offset
      // If we are "resuming", we use pauseTimeRef. 
      // Safe guard against out of bounds
      let offset = startOffset;
      if (offset >= duration) offset = 0;

      source.start(0, offset);
      sourcesRef.current[key] = source;
    });

    // Reset anchors for clock
    const now = ctx.currentTime;
    anchorCtxTimeRef.current = now;
    anchorTimeRef.current = startOffset;

    setIsPlaying(true);
    onPlayStateChange(true);

    // Start loop for time update
    const update = () => {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Calculate song time based on speed history
      // currentSongTime = anchorSongTime + (elapsedCtxTime * rate)
      const elapsedCtx = now - anchorCtxTimeRef.current;
      // USE REF here to get fresh value without effect re-run
      let trackTime = anchorTimeRef.current + (elapsedCtx * playbackRateRef.current);

      // Check for song end (only if NOT looping)
      const looping = isLoopingRef.current;
      const start = loopStartRef.current;
      const end = loopEndRef.current;

      if (looping && end !== null && start !== null) {
        trackTime = getNormalizedTime(trackTime);
      } else if (trackTime >= duration) {
        pause();
        pauseTimeRef.current = 0;
        setCurrentTime(0);
        return;
      }

      setCurrentTime(trackTime);
      onTimeUpdate(trackTime);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();

  }, [isLoading, duration, onPlayStateChange, onTimeUpdate, getNormalizedTime]); // REMOVED Loop Deps

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];

    // Update Clock Anchors BEFORE changing speed
    if (audioContextRef.current && isPlaying) {
      const now = audioContextRef.current.currentTime;
      const elapsedCtx = now - anchorCtxTimeRef.current;
      // Calc where we are at OLD speed
      let currentSongTime = anchorTimeRef.current + (elapsedCtx * playbackRateRef.current);

      // Normalize incase we looped while playing
      currentSongTime = getNormalizedTime(currentSongTime);

      // Re-anchor at this moment
      anchorTimeRef.current = currentSongTime;
      anchorCtxTimeRef.current = now;
    }

    setPlaybackRate(newSpeed);
    playbackRateRef.current = newSpeed; // Update Ref

    // Update active sources immediately
    Object.values(sourcesRef.current).forEach(source => {
      try {
        source.playbackRate.setValueAtTime(newSpeed, audioContextRef.current?.currentTime || 0);
      } catch (e) { }
    });
  };

  const toggleLoop = () => {
    // Loop changes do not require restart either if we use natives
    const newLooping = !isLooping;
    setIsLooping(newLooping);

    if (!newLooping) {
      setLoopStart(null);
      setLoopEnd(null);

      Object.values(sourcesRef.current).forEach(s => {
        s.loop = false;
      });
    }
  };

  // Effect to apply loop points dynamically when they change
  useEffect(() => {
    Object.values(sourcesRef.current).forEach(s => {
      if (isLooping && loopStart !== null && loopEnd !== null) {
        s.loop = true;
        s.loopStart = loopStart;
        s.loopEnd = loopEnd;
      } else {
        s.loop = false;
      }
    });
  }, [isLooping, loopStart, loopEnd]);

  const setLoopPointA = () => {
    setLoopStart(currentTime);
    if (!isLooping) setIsLooping(true);
  };

  const setLoopPointB = () => {
    if (loopStart !== null && currentTime > loopStart) {
      setLoopEnd(currentTime);
      if (!isLooping) setIsLooping(true);
    }
  };
  const pause = useCallback(() => {
    if (!audioContextRef.current) return;

    Object.values(sourcesRef.current).forEach(source => {
      try { source.stop(); } catch (e) { }
    });

    // Calculate finally where we stopped
    const now = audioContextRef.current.currentTime;
    const elapsedCtx = now - anchorCtxTimeRef.current;
    let rawPos = anchorTimeRef.current + (elapsedCtx * playbackRateRef.current);
    pauseTimeRef.current = getNormalizedTime(rawPos);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsPlaying(false);
    onPlayStateChange(false);
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [onPlayStateChange, getNormalizedTime]);

  const togglePlay = () => isPlaying ? pause() : play();

  // Mute Logic Effect
  useEffect(() => {
    // 1. Handle Master Mute (Original Song)
    if (gainsRef.current['master']) {
      // If master muted -> gain 0. Else 1.
      gainsRef.current['master'].gain.value = isMasterMuted ? 0 : 1;
    }

    // 2. Handle Stems
    Object.entries(stemMutes).forEach(([key, isMuted]) => {
      if (gainsRef.current[key]) {
        // If User wants Original (Master not muted), force mute stems?
        // Usually yes. Or mixing. Let's assume layering is allowed.
        // But if Master is ON, usually stems cause phasing if played together.

        // Smart logic:
        // If Master is On (isMasterMuted = false), Mute all Stems to avoid phasing.
        // Unless we want "Add Bass to Original". 
        // Let's stick to simple: Mute button = Mute.

        // However, for clean switch, usually:
        // Mode A: Master
        // Mode B: Stems

        gainsRef.current[key].gain.value = isMuted ? 0 : 1;
      }
    });

    // Phasing prevention hack: If Master is Unmuted (playing original), setting stems to 0 might be better,
    // but let's let user decide.

    // Actually, wait. 'isMasterMuted' defaults to TRUE when stems exist.
    // So normally Master is Silent, Stems are Loud.
    // If user toggles Master -> Master Loud.

  }, [stemMutes, isMasterMuted]);

  // Volume Effect
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Seek Logic
  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isLoading) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;

    // Reset anchors
    pauseTimeRef.current = newTime;
    anchorTimeRef.current = newTime;
    if (audioContextRef.current) {
      anchorCtxTimeRef.current = audioContextRef.current.currentTime;
    }

    setCurrentTime(newTime);
    onTimeUpdate(newTime);

    if (isPlaying) {
      play();
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Canvas drawing (Simplified for now)
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#3B82F6';
    ctx.clearRect(0, 0, 800, 100);
    const w = (currentTime / duration) * 800;
    ctx.fillRect(0, 0, w, 100);
  }, [currentTime, duration]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-300">Loading Stems... {Math.round(loadingProgress)}%</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={() => { pauseTimeRef.current = 0; setCurrentTime(0); if (isPlaying) play(); }}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
              <div className="w-[1px] h-8 bg-white/20 mx-2"></div>

              {/* Loop Controls */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                <button
                  onClick={setLoopPointA}
                  className={`px-3 py-1 rounded text-xs font-bold ${loopStart !== null ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Set Loop Start (A)"
                >
                  A
                </button>
                <button
                  onClick={toggleLoop}
                  className={`p-2 rounded-full transition-all ${isLooping ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                  title="Toggle Loop"
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  onClick={setLoopPointB}
                  className={`px-3 py-1 rounded text-xs font-bold ${loopEnd !== null ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Set Loop End (B)"
                >
                  B
                </button>
              </div>

              <div className="w-[1px] h-8 bg-white/20 mx-2"></div>

              {/* Speed Control */}
              <button
                onClick={changeSpeed}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium text-white min-w-[60px] justify-center"
                title="Playback Speed"
              >
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>{playbackRate}x</span>
              </button>
            </div>

            {/* Waveform / Progress Bar */}
            <div className="flex-1 mx-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={64}
                onClick={handleSeek}
                className="w-full h-16 bg-black/20 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-300" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-full outline-none slider"
              />
            </div>
          </div>

          <div className="flex justify-between text-xs font-mono text-gray-400 mb-4 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Mixer Controls */}
          {analysis?.stems && (
            <div className="flex flex-col items-center space-y-4 mt-6 p-4 bg-black/20 rounded-xl">
              <div className="flex items-center justify-between w-full max-w-md">
                <span className="text-sm font-medium text-gray-300">MIXER</span>
                <button
                  onClick={() => setIsMasterMuted(!isMasterMuted)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${!isMasterMuted
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-500'
                    }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>ORIGINAL</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                {[
                  { id: 'vocals', label: 'Vocals', icon: Mic, color: 'text-pink-400' },
                  { id: 'drums', label: 'Drums', icon: Drum, color: 'text-yellow-400' },
                  { id: 'bass', label: 'Bass', icon: Guitar, color: 'text-blue-400' },
                  { id: 'other', label: 'Other', icon: Keyboard, color: 'text-green-400' }
                ].map(stem => {
                  const Icon = stem.icon;
                  const isMuted = stemMutes[stem.id as keyof typeof stemMutes];
                  return (
                    <div key={stem.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => setStemMutes(prev => ({ ...prev, [stem.id]: !prev[stem.id as keyof typeof stemMutes] }))}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${!isMuted
                          ? `bg-white/10 border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]`
                          : 'bg-transparent border-white/5 text-gray-600'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${!isMuted ? stem.color : 'text-gray-600'}`} />
                      </button>
                      <span className={`text-xs font-bold uppercase tracking-wider ${!isMuted ? 'text-white' : 'text-gray-600'}`}>
                        {stem.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};