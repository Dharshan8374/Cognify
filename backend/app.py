import os
import sys
import uuid
import time
import logging
import tempfile
import traceback
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
from werkzeug.utils import secure_filename
from flask import send_from_directory
from chord_extractor.extractors import Chordino
import librosa
import numpy as np
import scipy.io.wavfile as wavfile
import sqlite3
import json
from stem_separator import StemSeparator

# -----------------------------
# Database Setup
# -----------------------------
DB_NAME = "cognify.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id TEXT PRIMARY KEY,
            title TEXT,
            artist TEXT,
            created_at REAL,
            analysis_json TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on start
init_db()

# -----------------------------
# Logging setup
# -----------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

class SafeFormatter(logging.Formatter):
    """Formatter that inserts defaults so missing attributes don't crash logging."""
    def format(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return super().format(record)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(SafeFormatter("%(asctime)s %(levelname)s [%(request_id)s] %(message)s"))

logger = logging.getLogger("chord-app")
logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
logger.addHandler(handler)

# -----------------------------
# Flask app
# -----------------------------
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "DELETE", "OPTIONS"])
asgi_app = WsgiToAsgi(app)

# -----------------------------
# Helpers
# -----------------------------
def to_float(val):
    """Return float(val) or None; no exception thrown."""
    try:
        return float(val)
    except (TypeError, ValueError):
        return None

def freq_to_note_name(freq):
    return librosa.hz_to_note(freq)

def get_chord_notes(chord_name):
    # Simple dictionary for common chords - expand as needed or use a library
    # Logic: simplistic mapping for demo purposes
    # Ideally use a library like mingus or music21 if available, but let's keep it light
    root = chord_name[0]
    if len(chord_name) > 1 and chord_name[1] == '#':
        root = chord_name[:2]
    
    # Basic Intervals relative to root
    # Major: 0, 4, 7
    # Minor: 0, 3, 7
    # 7: 0, 4, 7, 10
    # Maj7: 0, 4, 7, 11
    # m7: 0, 3, 7, 10
    
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    try:
        root_idx = notes.index(root)
    except ValueError:
        return []

    intervals = [0, 4, 7] # Default Major
    if 'm' in chord_name and 'maj' not in chord_name:
        intervals = [0, 3, 7]
    
    chord_notes = []
    for interval in intervals:
        note = notes[(root_idx + interval) % 12]
        chord_notes.append(note)
    
    return set(chord_notes)

def is_scale_note(note_name, key):
    # Simplified scale check (Major scale of the key)
    # Key should be e.g. "C", "G#"
    if not key:
        return True # Default to true if no key detected
    
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    # Major scale intervals: 2, 2, 1, 2, 2, 2, 1
    major_scale_intervals = [0, 2, 4, 5, 7, 9, 11]
    
    try:
        root_idx = notes.index(key)
    except ValueError:
        return True
        
    scale_notes = set()
    for interval in major_scale_intervals:
        scale_notes.add(notes[(root_idx + interval) % 12])
        
    # note_name comes as "C#4", we need "C#"
    pitch_class = ''.join([c for c in note_name if not c.isdigit()])
    return pitch_class in scale_notes

def classify_note(note_name, chord_name, key):
    if not note_name or not chord_name:
        return "Passing Note"
    
    pitch_class = ''.join([c for c in note_name if not c.isdigit()])
    chord_notes = get_chord_notes(chord_name)
    
    if pitch_class in chord_notes:
        return "Chord Tone"
    elif is_scale_note(note_name, key):
        return "Scale Note"
    else:
        return "Passing Note"

def log_exception(msg, exc):
    logger.error(f"{msg}: {exc}")
    logger.debug("TRACEBACK:\n" + "".join(traceback.format_exc()))

# -----------------------------
# Request lifecycle hooks
# -----------------------------
@app.before_request
def add_request_context():
    g.request_id = uuid.uuid4().hex[:12]
    g.t0 = time.perf_counter()
    logger.info(f"Incoming {request.method} {request.path}")

@app.after_request
def add_request_id_header(resp):
    resp.headers["X-Request-ID"] = getattr(g, "request_id", "-")
    elapsed = time.perf_counter() - getattr(g, "t0", time.perf_counter())
    logger.info(f"Completed {request.method} {request.path} in {elapsed:.3f}s "
                f"→ {resp.status_code}")
    return resp

# -----------------------------
# Route
# -----------------------------
@app.route('/analyze-chords', methods=['POST'])
def analyze_chords():
    logger.info("Step 1: Validating upload")

    if 'file' not in request.files:
        logger.warning("No 'file' part in form-data")
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        logger.warning("Empty filename in upload")
        return jsonify({'error': 'No file selected'}), 400

    original_name = file.filename
    safe_name = secure_filename(original_name)
    ext = os.path.splitext(safe_name)[1].lower()
    logger.debug(f"Uploaded file: original='{original_name}', safe='{safe_name}', ext='{ext}'")

    # -------------------------
    # Save to temp
    # -------------------------
    # -------------------------
    # Save to uploads (Persistent)
    # -------------------------
    try:
        # Create unique filename to avoid collisions
        unique_filename = f"{uuid.uuid4().hex}_{safe_name}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(save_path)
        
        # Audio URL for frontend
        audio_url = f"http://localhost:5000/uploads/{unique_filename}"
        
        logger.debug(f"Saved file at: {save_path}")
    except Exception as e:
        log_exception("Failed to save file", e)
        return jsonify({'error': 'Failed to save uploaded file'}), 500
        
    # Use the saved path for analysis
    temp_path = save_path
    
    # -------------------------
    # Stem Separation
    # -------------------------
    stems = {}
    stem_urls = {}
    separator = StemSeparator(app.config['UPLOAD_FOLDER'])
    
    # Default sources for analysis
    chord_source = temp_path
    melody_source = temp_path
    
    try:
        logger.info("Step 1.5: Running Stem Separation")
        # This might take time
        # We only run if not already separated (rudimentary check could be added)
        stems = separator.separate(temp_path)
        
        if 'other' in stems:
            chord_source = stems['other']
        if 'vocals' in stems:
            melody_source = stems['vocals']
            
        # Generate URLs for stems
        # Path relative to UPLOAD_FOLDER
        for name, path in stems.items():
            # path is e.g. .../uploads/htdemucs/song/vocals.wav
            # We need valid URL. 
            # Our serve_audio route handles /uploads/<path:filename>
            # So we need relative path from UPLOAD_FOLDER
            rel_path = os.path.relpath(path, app.config['UPLOAD_FOLDER'])
            # Ensure forward slashes for URL
            rel_path = rel_path.replace('\\', '/')
            stem_urls[name] = f"http://localhost:5000/uploads/{rel_path}"
            
        logger.info(f"Separation complete. Chords from {os.path.basename(chord_source)}, Melody from {os.path.basename(melody_source)}")

    except Exception as e:
        logger.error(f"Stem separation skipped/failed: {e}")
        # Fallback to original
        pass

    # -------------------------
    # Chord extraction
    # -------------------------
    chords = []
    melody_events = []
    last_valid_time = None
    stats = {"total_events": 0, "skipped": 0, "no_chord": 0, "processed": 0}

    try:
        logger.info("Step 2: Running Chordino.extract()")
        chordino = Chordino()
        # Use separated source if available
        chords_with_timestamps = chordino.extract(chord_source)
        logger.info(f"Chordino produced {len(chords_with_timestamps)} raw events")

        # 🔹 Debug print before processing (raw chords)
        print("\n=== Raw chords_with_timestamps (first 10) ===")
        for idx, item in enumerate(chords_with_timestamps[:10]):
            print(f"{idx}: {item}")
        print("============================================\n")

        # -------------------------
        # Process events
        # -------------------------
        logger.info("Step 3: Processing chord events")
        bar, beat, prev_time = 1, 1, 0.0

        for idx, item in enumerate(chords_with_timestamps):
            stats["total_events"] += 1

            # ✅ Handle ChordChange objects
            try:
                time_raw = getattr(item, "timestamp", None)
                chord = getattr(item, "chord", None)
            except Exception:
                stats["skipped"] += 1
                continue

            time_val = to_float(time_raw)
            if time_val is None or chord is None:
                stats["skipped"] += 1
                continue

            # Bar/beat detection
            if time_val - prev_time >= 2:
                bar += 1
                beat = 1
            else:
                beat += 1
            prev_time = time_val
            last_valid_time = time_val

            # Normalize chord
            if chord == "N":
                chord_out = "No Chord"
                stats["no_chord"] += 1
            else:
                chord_out = chord

            chords.append({
                "time": time_val,
                "chord": chord_out,
                "confidence": 1.0,
                "beat": beat,
                "bar": bar
            })
            stats["processed"] += 1

        duration = float(last_valid_time) if last_valid_time else 0.0
        logger.info(f"Processing complete → {len(chords)} usable events")

        # 🔹 Debug print processed chords
        print("\n=== Processed chords (first 10) ===")
        for idx, c in enumerate(chords[:10]):
            print(f"{idx}: {c}")
        print("===================================\n")

        # -------------------------
        # Melody Extraction (librosa)
        # -------------------------
        logger.info("Step 4: Extracting Melody")
        # Use separated source if available
        y, sr = librosa.load(melody_source)
        
        # Extract f0 using pyin (standard for melody)
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
        times = librosa.times_like(f0)
        
        # Detect Key (Global)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_index = np.argmax(np.sum(chroma, axis=1))
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        detected_key = notes[key_index]
        logger.info(f"Detected Key: {detected_key}")

        # Process Melody Notes
        # We sample points where f0 is voiced
        for i, val in enumerate(f0):
            if not np.isnan(val) and voiced_flag[i]:
                t = times[i]
                note = librosa.hz_to_note(val)
                
                # Find current chord
                current_chord = "N"
                # Simple linear search or improve with bisect if needed, but array is small
                for c in chords:
                    if c['time'] <= t:
                        current_chord = c['chord']
                    else:
                        break
                
                role = classify_note(note, current_chord, detected_key)
                
                # Reduce density: only take points every ~0.1s or so, or just dump all?
                # For UI performance, let's take all but frontend might need downsampling
                # Actually, let's just create events when note changes or significant time passes?
                # For now, simplistic raw dump, let frontend handle or decimate here.
                # Let's decimate to every 5th frame to reduce JSON size
                if i % 5 == 0: 
                    melody_events.append({
                        "time": float(t),
                        "pitch": float(val),
                        "note": note,
                        "role": role
                    })

    except Exception as e:
        log_exception("Chord extraction failed", e)
        return jsonify({'error': f'Chord extraction failed: {str(e)}'}), 500
    finally:
        # Do NOT delete the file, we keep it for playback
        pass

    # -------------------------
    # Response
    # -------------------------
    result = {
        "duration": duration if chords else 0,
        "bpm": 120,               # placeholder
        "key": detected_key,      
        "timeSignature": "4/4",   # placeholder
        "melody": melody_events,
        "chords": chords,
        "chords": chords,
        "melody": melody_events,
        "chords": chords,
        "audioUrl": audio_url,
        "stems": stem_urls,
        "debug": {"stats": stats}
    }
    return jsonify(result), 200

@app.route('/uploads/<path:filename>')
def serve_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# -----------------------------
# Library Routes
# -----------------------------
@app.route('/api/save', methods=['POST'])
def save_song():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    song_id = str(uuid.uuid4())
    title = data.get('title', 'Untitled')
    artist = data.get('artist', 'Unknown')
    analysis = data.get('analysis')
    
    if not analysis:
        return jsonify({'error': 'No analysis data'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('INSERT INTO songs (id, title, artist, created_at, analysis_json) VALUES (?, ?, ?, ?, ?)',
                  (song_id, title, artist, time.time(), json.dumps(analysis)))
        conn.commit()
        conn.close()
        return jsonify({'id': song_id, 'message': 'Saved successfully'}), 200
    except Exception as e:
        log_exception("Save failed", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/songs', methods=['GET'])
def list_songs():
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('SELECT id, title, artist, created_at FROM songs ORDER BY created_at DESC')
        rows = c.fetchall()
        conn.close()
        
        songs = [{'id': r[0], 'title': r[1], 'artist': r[2], 'createdAt': r[3]} for r in rows]
        return jsonify(songs), 200
    except Exception as e:
        log_exception("List songs failed", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/songs/<song_id>', methods=['GET', 'DELETE'])
def handle_song(song_id):
    if request.method == 'GET':
        try:
            conn = sqlite3.connect(DB_NAME)
            c = conn.cursor()
            c.execute('SELECT analysis_json FROM songs WHERE id = ?', (song_id,))
            row = c.fetchone()
            conn.close()
            
            if row:
                return jsonify(json.loads(row[0])), 200
            else:
                return jsonify({'error': 'Song not found'}), 404
        except Exception as e:
            log_exception("Get song failed", e)
            return jsonify({'error': str(e)}), 500

    elif request.method == 'DELETE':
        try:
            conn = sqlite3.connect(DB_NAME)
            c = conn.cursor()
            
            c.execute('SELECT analysis_json FROM songs WHERE id = ?', (song_id,))
            row = c.fetchone()
            
            if row:
                data = json.loads(row[0])
                audio_url = data.get('audioUrl')
                if audio_url:
                    filename = audio_url.split('/')[-1]
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    if os.path.exists(file_path):
                        try:
                            os.remove(file_path)
                            logger.info(f"Deleted file: {file_path}")
                        except Exception as e:
                            logger.warning(f"Failed to delete file {file_path}: {e}")

                        except Exception as e:
                            logger.warning(f"Failed to delete file {file_path}: {e}")

            c.execute('DELETE FROM songs WHERE id = ?', (song_id,))
            conn.commit()
            conn.close()
            
            return jsonify({'message': 'Song deleted'}), 200
        except Exception as e:
            log_exception("Delete song failed", e)
            return jsonify({'error': str(e)}), 500

@app.route('/api/mix/<path:filename>/<mix_type>', methods=['GET'])
def download_mix(filename, mix_type):
    """
    filename: the unique filename of the original upload (e.g. uuid_song.mp3)
              or the folder name if we tracked it differently. 
              Actually, our stem_urls reveal the structure: /uploads/htdemucs/{name_no_ext}/...
    mix_type: 'vocals' | 'instrumental'
    """
    try:
        # Reconstruct stem folder path
        # filename passed here is likely the basename of the original file
        # But wait, frontend has `audioUrl` which is full URL.
        # We need the relative path or ID. 
        # Ideally frontend sends the `analysis.stems.vocals` URL but that's raw.
        # Let's handle it by assuming filename is the one we stored.
        
        # Security: filename should be just a name
        safe_name = secure_filename(filename)
        
        # The stem folder usually matches the file basename without extension
        name_no_ext = os.path.splitext(safe_name)[0]
        # But remember, uuid was prepended. 
        
        # Best way: Check if the folder exists in htdemucs
        htdemucs_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'htdemucs')
        
        target_dir = os.path.join(htdemucs_dir, name_no_ext)
        if not os.path.exists(target_dir):
            # Try finding a folder that *ends* with the original name or starts with UUID?
            # Or iterate to find match.
            # Simplified: assuming standard demucs behavior
            pass

        if not os.path.exists(target_dir):
             return jsonify({'error': 'Stems not found'}), 404

        if mix_type == 'vocals':
            return send_from_directory(target_dir, 'vocals.wav', as_attachment=True)
            
        elif mix_type == 'instrumental':
            # Check if pre-mixed exists
            mix_path = os.path.join(target_dir, 'instrumental.wav')
            if not os.path.exists(mix_path):
                # Mix on the fly
                # Load stems
                stems = ['drums.wav', 'bass.wav', 'other.wav']
                mixed_audio = None
                sample_rate = 44100
                
                for stem in stems:
                    p = os.path.join(target_dir, stem)
                    if os.path.exists(p):
                        sr, data = wavfile.read(p)
                        sample_rate = sr
                        # Ensure float for mixing
                        if data.dtype != np.float32:
                             data = data.astype(np.float32) / (np.iinfo(data.dtype).max if np.issubdtype(data.dtype, np.integer) else 1.0)
                        
                        if mixed_audio is None:
                            mixed_audio = data
                        else:
                            # Handle length mismatch (rare if same demucs run)
                            min_len = min(len(mixed_audio), len(data))
                            mixed_audio = mixed_audio[:min_len] + data[:min_len]
                
                if mixed_audio is not None:
                     # Clip and convert back to 16-bit PCM for compatibility
                     mixed_audio = np.clip(mixed_audio, -1.0, 1.0)
                     mixed_audio = (mixed_audio * 32767).astype(np.int16)
                     wavfile.write(mix_path, sample_rate, mixed_audio)
                else:
                    return jsonify({'error': 'Could not create mix'}), 500

            return send_from_directory(target_dir, 'instrumental.wav', as_attachment=True)
            
        else:
             return jsonify({'error': 'Invalid mix type'}), 400

    except Exception as e:
        log_exception("Mix download failed", e)
        return jsonify({'error': str(e)}), 500

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
