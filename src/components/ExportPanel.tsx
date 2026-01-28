import React, { useState } from 'react';
import { Download, FileText, Music, Code, FileImage, Check, Mic, MicOff } from 'lucide-react';
import { AudioAnalysis } from '../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPanelProps {
  analysis: AudioAnalysis;
  audioFile: File | null;
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
    },
    {
      id: 'vocals',
      name: 'Vocals Only',
      description: 'Isolated vocal track (WAV)',
      icon: Mic,
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'instrumental',
      name: 'Instrumental',
      description: 'Karaoke mix (No Vocals)',
      icon: MicOff,
      color: 'from-indigo-500 to-blue-600'
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

      const safeName = audioFile ? audioFile.name.replace(/\.[^/.]+$/, "") : (analysis.audioUrl ? analysis.audioUrl.split('/').pop()?.split('.')[0] : 'song');

      switch (formatId) {
        case 'csv':
          content = generateCSV();
          filename = `${safeName}_chords.csv`;
          mimeType = 'text/csv';
          break;
        case 'midi':
          content = generateMIDI();
          filename = `${safeName}_chords.mid`;
          mimeType = 'audio/midi';
          break;
        case 'musicxml':
          content = generateMusicXML();
          filename = `${safeName}_chords.xml`;
          mimeType = 'application/xml';
          break;
        case 'pdf':
          // PDF Logic handles its own download usually, but here we can get blob URL
          // doc.save() triggers download directly.
          // Let's refactor slightly to support the switch case flow.
          // generatePDF returns blob URL directly?
          // No, generatePDF() previously returned string content.
          // Let's change flow: if PDF, we handle differently or return special.

          const pdfUrl = generatePDF(); // Returns blob URL

          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = `${safeName}_leadsheet.pdf`;
          a.click();
          setCompletedFormats(prev => new Set(prev).add(formatId));
          return; // Exit here for PDF

        case 'vocals':
        case 'instrumental':
          // Call backend API
          // Ensure we have filename
          if (!analysis.audioUrl) throw new Error("No audio URL found");
          const originalFilename = analysis.audioUrl.split('/').pop();
          if (!originalFilename) throw new Error("Invalid audio filename");

          const res = await fetch(`http://localhost:5000/api/mix/${originalFilename}/${formatId}`);
          if (!res.ok) throw new Error("Download failed");

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a2 = document.createElement('a');
          a2.href = url;
          a2.download = `${safeName}_${formatId}.wav`;
          a2.click();
          URL.revokeObjectURL(url);
          setCompletedFormats(prev => new Set(prev).add(formatId));
          return;

        default:
          throw new Error('Unknown format');
      }

      // Create download for Text-based
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
      alert("Export failed: " + (error as any).message);
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
    return `MIDI File Generated for ${audioFile ? audioFile.name : 'Analyzed Song'}\nChords: ${analysis.chords.map(c => c.chord).join(', ')}`;
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
    // 1. Init Doc
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 2. Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    const title = audioFile ? audioFile.name.replace(/\.[^/.]+$/, "") : 'Analyzed Song';
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Key: ${analysis.key}   |   BPM: ${analysis.bpm}   |   Signature: ${analysis.timeSignature}`, pageWidth / 2, 30, { align: 'center' });

    // 3. Grid Layout using AutoTable
    // Group chords into bars. (Assuming 4 bars per line typically, but we have sparse data)
    // Let's create a table where each cell is a Bar.
    // Max Bar found?
    const maxBar = Math.max(...analysis.chords.map(c => c.bar));
    const bars: string[] = new Array(maxBar + 1).fill('');

    // Fill bars
    analysis.chords.forEach(c => {
      const existing = bars[c.bar];
      bars[c.bar] = existing ? `${existing} ${c.chord}` : c.chord;
    });

    // Create rows of 4 bars
    const rows: string[][] = [];
    for (let i = 1; i <= maxBar; i += 4) {
      const row = [
        `Bar ${i}`,
        bars[i] || '%',
        bars[i + 1] || '%',
        bars[i + 2] || '%',
        bars[i + 3] || '%'
      ];
      rows.push(row);
    }

    autoTable(doc, {
      head: [['#', 'Bar 1', 'Bar 2', 'Bar 3', 'Bar 4']],
      body: rows,
      startY: 40,
      styles: { fontSize: 12, cellPadding: 5, halign: 'center' },
      headStyles: { fillColor: [59, 130, 246] }, // Blue header
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 }, // Bar Number
      }
    });

    // 4. Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Generated by Cognify AI', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    return doc.output('bloburl').toString(); // We return string URL for blob
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