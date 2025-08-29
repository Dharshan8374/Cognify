import { AudioAnalysis } from '../App';

// Real-time AI chord analysis using backend API
export const analyzeChordsAI = async (audioFile: File): Promise<AudioAnalysis> => {
  const formData = new FormData();
  formData.append('file', audioFile);

  const response = await fetch('http://localhost:5000/analyze-chords', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze audio');
  }

  const data = await response.json();
  return data;
};