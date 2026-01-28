import React, { useEffect, useState } from 'react';
import { Book, Play, Calendar, User, Trash2 } from 'lucide-react';
import { AudioAnalysis } from '../App';

interface Song {
    id: string;
    title: string;
    artist: string;
    createdAt: number;
}

interface LibraryProps {
    onLoad: (analysis: AudioAnalysis) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onLoad, isOpen, onClose }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSongs();
        }
    }, [isOpen]);

    const fetchSongs = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/api/songs');
            if (res.ok) {
                const data = await res.json();
                setSongs(data);
            }
        } catch (error) {
            console.error("Failed to load library", error);
        } finally {
            setLoading(false);
        }
    };

    const loadSong = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/songs/${id}`);
            if (res.ok) {
                const analysis = await res.json();
                onLoad(analysis);
                onClose();
            }
        } catch (error) {
            console.error("Failed to load song", error);
        }
    };

    const deleteSong = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this analysis?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/songs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSongs(songs.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete song", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <div className="flex items-center space-x-3">
                        <Book className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Your Library</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {loading ? (
                        <div className="flex justify-center p-8 text-gray-400">Loading library...</div>
                    ) : songs.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">No songs saved yet. Upload and analyze a track to save it here.</div>
                    ) : (
                        <div className="grid gap-4">
                            {songs.map(song => (
                                <div key={song.id}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex items-center justify-between transition-all group"
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{song.title}</h3>
                                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                                            <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {song.artist}</span>
                                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(song.createdAt * 1000).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => deleteSong(song.id, e)}
                                            className="p-3 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => loadSong(song.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg transform scale-90 hover:scale-100 transition-all"
                                            title="Load"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
