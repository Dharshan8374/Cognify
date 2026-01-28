import { useState, useEffect, useCallback, useRef } from 'react';
import { Chord, Note } from '@tonaljs/tonal';

// Types
export interface MidiState {
    enabled: boolean;
    connectedDevice: string | null;
    activeNotes: number[]; // MIDI Numbers (e.g. 60)
    activeNoteNames: string[]; // e.g. "C4"
    detectedChord: string | null;
}

export const useMidi = () => {
    const [midiState, setMidiState] = useState<MidiState>({
        enabled: false,
        connectedDevice: null,
        activeNotes: [],
        activeNoteNames: [],
        detectedChord: null
    });

    const activeNotesRef = useRef<Set<number>>(new Set());

    // Convert MIDI Number to Note Name (60 -> C4)
    const midiToNote = (midi: number) => {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = notes[midi % 12];
        return `${note}${octave}`;
    };

    const updateState = useCallback(() => {
        const notes = Array.from(activeNotesRef.current).sort((a, b) => a - b);
        const noteNames = notes.map(midiToNote);

        // Detect Chord
        let detected = null;
        if (noteNames.length >= 3) {
            // Remove octaves for chord detection "C4" -> "C"
            const chroma = noteNames.map(n => n.replace(/[0-9]/g, ''));
            const chords = Chord.detect(chroma);
            if (chords && chords.length > 0) {
                detected = chords[0];
            }
        }

        setMidiState(prev => ({
            ...prev,
            activeNotes: notes,
            activeNoteNames: noteNames,
            detectedChord: detected
        }));
    }, []);

    const onMidiMessage = useCallback((event: any) => {
        const [command, note, velocity] = event.data;

        // Note On (144) or Note Off (128)
        // Some keyboards send Note On with 0 velocity as Note Off
        if (command === 144 && velocity > 0) {
            activeNotesRef.current.add(note);
        } else if (command === 128 || (command === 144 && velocity === 0)) {
            activeNotesRef.current.delete(note);
        }

        updateState();
    }, [updateState]);

    const initMidi = useCallback(async () => {
        if (!navigator.requestMIDIAccess) {
            console.warn("Web MIDI API not supported");
            return;
        }

        try {
            const access = await navigator.requestMIDIAccess();

            // Get first input
            const inputs = Array.from(access.inputs.values());
            if (inputs.length > 0) {
                const input = inputs[0];
                input.onmidimessage = onMidiMessage;

                setMidiState(prev => ({
                    ...prev,
                    enabled: true,
                    connectedDevice: input.name || "Unknown MIDI Device"
                }));
            } else {
                setMidiState(prev => ({ ...prev, enabled: true, connectedDevice: null }));
            }

            access.onstatechange = (e) => {
                // Re-scan if devices change
                console.log("MIDI State Change", e);
            };

        } catch (err) {
            console.error("MIDI Init Failed", err);
        }
    }, [onMidiMessage]);

    // Keyboard Simulation (for testing without MIDI)
    // Maps A-K keys to C4-C5 white keys
    useEffect(() => {
        const keyMap: { [key: string]: number } = {
            'a': 60, // C4
            'w': 61, // C#4
            's': 62, // D4
            'e': 63, // D#4
            'd': 64, // E4
            'f': 65, // F4
            't': 66, // F#4
            'g': 67, // G4
            'y': 68, // G#4
            'h': 69, // A4
            'u': 70, // A#4
            'j': 71, // B4
            'k': 72  // C5
        };

        const handleDown = (e: KeyboardEvent) => {
            if (e.repeat || e.metaKey || e.ctrlKey || e.target instanceof HTMLInputElement) return;
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                activeNotesRef.current.add(note);
                updateState();
            }
        };

        const handleUp = (e: KeyboardEvent) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                activeNotesRef.current.delete(note);
                updateState();
            }
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        }
    }, [updateState]);


    return { midiState, initMidi };
};
