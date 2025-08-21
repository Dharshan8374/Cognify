import React, { useState } from 'react';
import { Download, FileText, Music, Code, FileImage, Check } from 'lucide-react';
import { AudioAnalysis } from '../App';

interface ExportPanelProps {
  analysis: AudioAnalysis;
  audioFile: File;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ analysis, audioFile }) => {
  const [exportingFormats, setExportingFormats] = useState<Set<string>>(new Set());
  const [completedFormats, setCompletedFormats] = useState<Set<string>>(new Set());

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV Timeline',
      description: 'Time-stamped chord data for spreadsheets',
      icon: FileText,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'midi',
      name: 'MIDI File',
      description: 'For DAWs and music software',
      icon: Music,
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'musicxml',
      name: 'MusicXML',
      description: 'For notation software (Finale, Sibelius)',
      icon: Code,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'pdf',
      name: 'Lead Sheet (PDF)',
      description: 'Printable chord chart with measures',
      icon: FileImage,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const handleExport = async (formatId: string) => {
    setExportingFormats(prev => new Set(prev).add(formatId));

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (formatId) {
        case 'csv':
          content = generateCSV();
          filename = `${audioFile.name.split('.')[0]}_chords.csv`;
          mimeType = 'text/csv';
          break;
        case 'midi':
          content = generateMIDI();
          filename = `${audioFile.name.split('.')[0]}_chords.mid`;
          mimeType = 'audio/midi';
          break;
        case 'musicxml':
          content = generateMusicXML();
          filename = `${audioFile.name.split('.')[0]}_chords.xml`;
          mimeType = 'application/xml';
          break;
        case 'pdf':
          content = generatePDF();
          filename = `${audioFile.name.split('.')[0]}_leadsheet.pdf`;
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Unknown format');
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setCompletedFormats(prev => new Set(prev).add(formatId));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportingFormats(prev => {
        const newSet = new Set(prev);
        newSet.delete(formatId);
        return newSet;
      });
    }
  };

  const generateCSV = (): string => {
    const headers = ['Time', 'Chord', 'Confidence', 'Beat', 'Bar'];
    const rows = analysis.chords.map(chord => [
      chord.time.toFixed(2),
      chord.chord,
      (chord.confidence * 100).toFixed(1) + '%',
      chord.beat.toString(),
      chord.bar.toString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateMIDI = (): string => {
    // Mock MIDI data - in production, use a proper MIDI library
    return `MIDI File Generated for ${audioFile.name}\nChords: ${analysis.chords.map(c => c.chord).join(', ')}`;
  };

  const generateMusicXML = (): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Chord Analysis</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      ${analysis.chords.map((chord, i) => `
        <harmony>
          <root>
            <root-step>${chord.chord.charAt(0)}</root-step>
          </root>
          <kind>${chord.chord.includes('m') ? 'minor' : 'major'}</kind>
        </harmony>
      `).join('')}
    </measure>
  </part>
</score-partwise>`;
  };

  const generatePDF = (): string => {
    // Mock PDF content - in production, use a PDF library like jsPDF
    return `PDF Lead Sheet for ${audioFile.name}
Key: ${analysis.key}
BPM: ${analysis.bpm}
Time Signature: ${analysis.timeSignature}

Chord Progression:
${analysis.chords.map((chord, i) => `${i + 1}. ${chord.chord} (Bar ${chord.bar})`).join('\n')}`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <Download className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Export Options</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportFormats.map((format) => {
          const Icon = format.icon;
          const isExporting = exportingFormats.has(format.id);
          const isCompleted = completedFormats.has(format.id);

          return (
            <div
              key={format.id}
              className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${format.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{format.name}</h3>
                    <p className="text-sm text-gray-400">{format.description}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExport(format.id)}
                disabled={isExporting}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
                  ${isCompleted
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : isExporting
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : `bg-gradient-to-r ${format.color} hover:shadow-lg text-white`
                  }
                `}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export {format.name}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
        <h3 className="font-semibold text-blue-200 mb-2">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2">{Math.round(analysis.duration)}s</span>
          </div>
          <div>
            <span className="text-gray-400">Chords Found:</span>
            <span className="text-white ml-2">{analysis.chords.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Avg Confidence:</span>
            <span className="text-white ml-2">
              {Math.round(analysis.chords.reduce((sum, chord) => sum + chord.confidence, 0) / analysis.chords.length * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">Unique Chords:</span>
            <span className="text-white ml-2">{new Set(analysis.chords.map(c => c.chord)).size}</span>
          </div>
        </div>
      </div>
    </div>
  );
};