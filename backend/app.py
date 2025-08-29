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
from chord_extractor.extractors import Chordino

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
app = Flask(__name__)
CORS(app)
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
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp:
            file.save(temp.name)
            temp_path = temp.name
        logger.debug(f"Saved temp file at: {temp_path}")
    except Exception as e:
        log_exception("Failed to save temp file", e)
        return jsonify({'error': 'Failed to save uploaded file'}), 500

    # -------------------------
    # Chord extraction
    # -------------------------
    chords = []
    last_valid_time = None
    stats = {"total_events": 0, "skipped": 0, "no_chord": 0, "processed": 0}

    try:
        logger.info("Step 2: Running Chordino.extract()")
        chordino = Chordino()
        chords_with_timestamps = chordino.extract(temp_path)
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

    except Exception as e:
        log_exception("Chord extraction failed", e)
        return jsonify({'error': f'Chord extraction failed: {str(e)}'}), 500
    finally:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
            logger.debug(f"Temp file removed: {temp_path}")

    # -------------------------
    # Response
    # -------------------------
    result = {
        "duration": duration if chords else 0,
        "bpm": 120,               # placeholder
        "key": "C",               # placeholder
        "timeSignature": "4/4",   # placeholder
        "chords": chords,
        "debug": {"stats": stats}
    }
    return jsonify(result), 200

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
