# Cognitive Music Analysis Platform - Technical Overview

## 1. Product Summary
**Cognify** is an AI-powered music education tool that deconstructs audio files into their musical components (Chords, Melody, Stems) to help musicians learn songs faster. Unlike standard players, it offers "X-Ray Vision" into the music structure.

## 2. Technical Architecture

### Backend (Python/Flask)
The core intelligence layer processing raw audio.
*   **Stem Separation**: Implemented using **Hybrid Transformer Demucs (HTDemucs)** via `torchaudio`. It splits a stereo mix into 4 discrete stems: *Vocals, Drums, Bass, Other*.
*   **Chord Recognition**: Utilizes **Chordino (Vamp Plugin)** via the `vamp` library. It analyzes the harmonic content (chromagrams) to output chord labels with timestamps.
*   **Melody Extraction**: Uses **Librosa's implementations (PYIN)** to extract fundamental frequency (f0) contours, converting Hertz to musical notes.
*   **Key Detection**: Analyzes the global chroma features to determine the root key (e.g., C Major, F# Minor), enabling "Scale Degree" analysis.
*   **Storage**: SQLite database tracks Song Metadata and Analysis JSON blobs for instant retrieval.

### Frontend (React + TypeScript)
A high-performance interactive visualisation layer.
*   **Audio Engine**: A custom-built **PRO Audio Engine** using the **Web Audio API**.
    *   **Polyphonic Mixing**: Decodes and plays 4 concurrent `AudioBufferSourceNodes` for stems.
    *   **Gain Node Mixer**: Real-time volume/mute control for each stem without latency.
    *   **Compounded Clock System**: A custom physics-based clock logic to handle **Variable Speed Playback** (Time Stretching) while maintaining sample-accurate synchronization across all stems.
    *   **Native Looping**: Uses hardware-level looping (`source.loop`) for glitch-free repetition of sections.
*   **Visualizers**:
    *   **Chord Timeline**: Auto-scrolling, synchronized grid of chord cards.
    *   **Instrument Views**: Dynamic Guitar Fretboard and Piano Roll that light up based on the current detected notes.
    *   **Theory Engine**: Real-time classification of notes (Chord Tone vs. Passing Note) based on the current harmonic context.

## 3. Key Differentiators (Implemented Features)
1.  **"Smart Mix"**: Users can isolate the Bass to learn the groove, or mute the Vocals to sing along (Karaoke Mode) using the separated stems.
2.  **Adaptive Practice**:
    *   **Speed Control**: 0.5x to 1.5x speed without pitch shifting (using HTML5) or with physics-based resampling (Web Audio).
    *   **A-B Looping**: Isolate difficult sections for repetitive practice.
3.  **Educational Intelligence**:
    *   It doesn't just show "C Major", it visualizes *how* to play it on Guitar/Piano.
    *   It identifies melody notes relative to the chord (e.g., "Major 3rd", "Perfect 5th").

## 4. Current Status
*   **Status**: Alpha / MVP Complete.
*   **Performance**: Backend analysis takes ~40-60s per song (GPU accelerated if available). Frontend playback is instant after loading.
*   **Next Steps**: PDF Lead Sheet Export, MIDI Download, and Mobile Optimization.
