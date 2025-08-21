import { AudioAnalysis, ChordData } from '../App';

// Mock AI chord analysis - in production, this would connect to ML models
export const analyzeChordsAI = async (audioFile: File): Promise<AudioAnalysis> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create a mock audio context to get duration
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const duration = audioBuffer.duration;

  // Mock chord progressions for different song types
  const commonProgressions = [
    ['C', 'Am', 'F', 'G'],
    ['Am', 'F', 'C', 'G'],
    ['C', 'F', 'Am', 'G'],
    ['Dm', 'G', 'C', 'Am'],
    ['Em', 'C', 'G', 'D'],
  ];

  const progression = commonProgressions[Math.floor(Math.random() * commonProgressions.length)];
  
  // Generate mock BPM and key
  const bpms = [120, 124, 128, 132, 140, 100, 110];
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'];
  
  const bpm = bpms[Math.floor(Math.random() * bpms.length)];
  const key = keys[Math.floor(Math.random() * keys.length)];
  
  // Generate chord timeline
  const chords: ChordData[] = [];
  const chordsPerBar = 2; // 2 chords per bar
  const secondsPerBar = (60 / bpm) * 4; // 4 beats per bar
  const totalBars = Math.ceil(duration / secondsPerBar);
  
  for (let bar = 1; bar <= totalBars; bar++) {
    for (let chordInBar = 0; chordInBar < chordsPerBar; chordInBar++) {
      const time = (bar - 1) * secondsPerBar + (chordInBar * secondsPerBar / chordsPerBar);
      
      if (time >= duration) break;
      
      const chord = progression[(bar - 1 + chordInBar) % progression.length];
      const confidence = 0.75 + Math.random() * 0.25; // 75-100% confidence
      const beat = (chordInBar * 2) + 1; // Beat 1 or 3
      
      chords.push({
        time,
        chord,
        confidence,
        beat,
        bar
      });
    }
  }

  // Add some chord variations for realism
  const variations = ['7', 'maj7', 'm7', 'sus2', 'sus4'];
  chords.forEach((chord, index) => {
    if (Math.random() < 0.3 && !chord.chord.includes('m')) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      chord.chord += variation;
    }
  });

  return {
    duration,
    bpm,
    key,
    timeSignature: '4/4',
    chords
  };
};