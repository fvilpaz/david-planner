# Servidor local para probar david-planner: http://localhost:8000
# Cada respuesta lleva «Cache-Control: no-store», así el navegador pide siempre la versión del disco
# (con `python -m http.server` usaba copias viejas del CSS y parecía que faltaban cosas).
# Uso, desde cualquier sitio: python servidor.py   (sirve la carpeta donde está este archivo)
import functools
import http.server
from pathlib import Path

CARPETA = Path(__file__).resolve().parent


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


handler = functools.partial(SinCache, directory=str(CARPETA))
print(f"Sirviendo {CARPETA} en http://localhost:8000 (sin caché). Ctrl+C para parar.", flush=True)
http.server.ThreadingHTTPServer(("127.0.0.1", 8000), handler).serve_forever()
