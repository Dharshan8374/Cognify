import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { AudioAnalysis } from '../App';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate mock waveform data
  useEffect(() => {
    const generateWaveform = () => {
      const samples = 1000;
      const data = [];
      for (let i = 0; i < samples; i++) {
        data.push(Math.random() * 0.8 + 0.1);
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    waveformData.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = amplitude * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      if (i / waveformData.length < progress) {
        ctx.fillStyle = '#3B82F6'; // Blue for played portion
      } else {
        ctx.fillStyle = '#6B7280'; // Gray for unplayed portion
      }

      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  }, [waveformData, currentTime, duration]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate(time);
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlayStateChange(true);
  }, [onPlayStateChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [onPlayStateChange]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, [duration]);

  const resetTime = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
  }, []);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
      />

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
            onClick={resetTime}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>

        {analysis && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-gray-300">Key: </span>
              <span className="text-white font-semibold">{analysis.key}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-gray-300">BPM: </span>
              <span className="text-white font-semibold">{analysis.bpm}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-gray-300">Time: </span>
              <span className="text-white font-semibold">{analysis.timeSignature}</span>
            </div>
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={100}
          className="w-full h-24 cursor-pointer rounded-lg"
          onClick={handleSeek}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300 font-mono">
            {formatTime(currentTime)}
          </span>
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-300 font-mono">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-300" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (audioRef.current) {
                audioRef.current.volume = newVolume;
              }
            }}
            className="w-20 h-1 bg-white/20 rounded-full outline-none slider"
          />
        </div>
      </div>
    </div>
  );
};