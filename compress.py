import os
from PIL import Image
from tkinter import Tk, filedialog

# Qualität (0-100)
QUALITY = 75

def compress_webp(path):
    try:
        with Image.open(path) as img:
            img.save(path, "WEBP", quality=QUALITY, method=6)
        print(f"OK: {path}")
    except Exception as e:
        print(f"Fehler bei {path}: {e}")

def process_folder(folder):
    for root, _, files in os.walk(folder):
        for file in files:
            if file.lower().endswith(".webp"):
                full_path = os.path.join(root, file)
                compress_webp(full_path)

if __name__ == "__main__":
    # GUI verstecken (nur Dialog anzeigen)
    root = Tk()
    root.withdraw()

    folder = filedialog.askdirectory(title="Ordner auswählen")

    if not folder:
        print("Kein Ordner gewählt.")
    else:
        print(f"Starte Verarbeitung: {folder}")
        process_folder(folder)
        print("Fertig.")