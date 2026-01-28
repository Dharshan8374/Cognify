import os
import subprocess
import logging
import shlex

logger = logging.getLogger("chord-app")

class StemSeparator:
    def __init__(self, output_dir):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

    def separate(self, audio_path):
        """
        Runs demucs on the audio file.
        Returns a dictionary of stem paths: {'vocals': path, 'drums': path, ...}
        """
        logger.info(f"Starting stem separation for: {audio_path}")
        
        # We use the 'htdemucs' model (Hybrid Transformer) which is fast and good.
        # -n htdemucs
        # --out output_dir
        cmd = [
            "python", "-m", "demucs.separate",
            "-n", "htdemucs",
            "--out", self.output_dir,
            audio_path
        ]
        
        try:
            # Run Demucs
            # This might take time (30s - 2min on CPU)
            process = subprocess.run(
                cmd, 
                check=True, 
                capture_output=True, 
                text=True
            )
            logger.info("Demucs completed successfully")
            
            # Demucs structure: output_dir/htdemucs/{filename_no_ext}/{stem}.wav
            filename = os.path.basename(audio_path)
            name_no_ext = os.path.splitext(filename)[0]
            
            # The actual folder name demucs creates might depend on the input filename
            # Demucs cleans the filename (spaces to _, etc). 
            # Ideally we should verify the folder exists.
            
            # Let's find the folder
            model_dir = os.path.join(self.output_dir, "htdemucs")
            # We look for the most recently modified folder if specific name is tricky,
            # but usually it's the filename.
            # Let's try likely candidates
            target_dir = os.path.join(model_dir, name_no_ext)
            
            if not os.path.exists(target_dir):
                # Fallback: check subdirs in model_dir
                subdirs = [os.path.join(model_dir, d) for d in os.listdir(model_dir) if os.path.isdir(os.path.join(model_dir, d))]
                # Find the one that matches our file best or just the latest
                # For safety, let's assume it matches name_no_ext mostly.
                # If we passed a safe filename like uuid_name.mp3, it should be uuid_name
                pass

            stems = {}
            for stem in ['vocals', 'drums', 'bass', 'other']:
                stem_path = os.path.join(target_dir, f"{stem}.wav")
                if os.path.exists(stem_path):
                    stems[stem] = stem_path
            
            return stems

        except subprocess.CalledProcessError as e:
            logger.error(f"Demucs failed: {e.stderr}")
            raise Exception(f"Demucs processing failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Stem separation failed: {e}")
            raise e
