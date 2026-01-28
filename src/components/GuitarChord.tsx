import React from 'react';

interface GuitarChordProps {
    chord: string; // e.g., "C", "Am"
    className?: string;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ chord, className }) => {
    // Dictionary of finger positions (6 strings: E A D G B e)
    // 'x' = muted, '0' = open, '1'-'4' = fret
    const diagrams: { [key: string]: string[] } = {
        'C': ['x', '3', '2', '0', '1', '0'],
        'Cm': ['x', '3', '5', '5', '4', '3'],
        'D': ['x', 'x', '0', '2', '3', '2'],
        'Dm': ['x', 'x', '0', '2', '3', '1'],
        'E': ['0', '2', '2', '1', '0', '0'],
        'Em': ['0', '2', '2', '0', '0', '0'],
        'F': ['1', '3', '3', '2', '1', '1'],
        'Fm': ['1', '3', '3', '1', '1', '1'],
        'G': ['3', '2', '0', '0', '0', '3'],
        'Gm': ['3', '5', '5', '3', '3', '3'],
        'A': ['x', '0', '2', '2', '2', '0'],
        'Am': ['x', '0', '2', '2', '1', '0'],
        'B': ['x', '2', '4', '4', '4', '2'],
        'Bm': ['x', '2', '4', '4', '3', '2'],
        // 7ths
        'C7': ['x', '3', '2', '3', '1', '0'],
        'G7': ['3', '2', '0', '0', '0', '1'],
        'D7': ['x', 'x', '0', '2', '1', '2'],
        'A7': ['x', '0', '2', '0', '2', '0'],
        'E7': ['0', '2', '0', '1', '0', '0'],
    };

    // Normalize chord name (remove extensions if not found)
    // Simple fallback
    const positions = diagrams[chord] || diagrams[chord.replace(/maj7|7|sus4/, '')] || ['x', 'x', 'x', 'x', 'x', 'x'];

    return (
        <div className={`bg-amber-100/90 rounded-lg p-3 text-black font-sans shadow-lg ${className}`}>
            {/* String Names */}
            <div className="grid grid-cols-6 gap-1 text-[10px] mb-1 font-bold text-center border-b border-gray-400 pb-1">
                {['E', 'A', 'D', 'G', 'B', 'e'].map(s => <div key={s}>{s}</div>)}
            </div>

            {/* Fretboard (4 Frets usually enough for basic chords) */}
            <div className="relative space-y-2 py-1">
                {/* Nut line (thick if fret 0 is used widely, but we draw frets) */}

                {[1, 2, 3, 4].map((fret) => (
                    <div key={fret} className="grid grid-cols-6 gap-1 relative h-4">
                        {/* Fret Wire */}
                        <div className="absolute top-full left-0 right-0 h-[1px] bg-gray-400"></div>

                        {positions.map((code, sIdx) => {
                            // code is fret number or 'x'
                            const isPress = code !== 'x' && parseInt(code) === fret;
                            const isOpen = code !== 'x' && parseInt(code) === 0 && fret === 1; // Show open marker at top
                            const isMuted = code === 'x' && fret === 1;

                            return (
                                <div key={sIdx} className="relative flex justify-center items-center h-full">
                                    {/* String Line */}
                                    <div className="absolute top-0 bottom-0 w-[1px] bg-amber-800/50 z-0"></div>

                                    {isPress && (
                                        <div className="w-3 h-3 bg-blue-600 rounded-full z-10 shadow-sm"></div>
                                    )}
                                    {isOpen && (
                                        <div className="absolute -top-3 w-2 h-2 border border-blue-600 rounded-full z-10 bg-white/50"></div>
                                    )}
                                    {isMuted && (
                                        <div className="absolute -top-3 text-[10px] text-gray-500 font-bold">X</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            <div className="text-center mt-2 font-bold text-sm text-gray-700">{chord}</div>
        </div>
    );
};
