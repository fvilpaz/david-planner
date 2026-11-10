# Servidor local para probar david-planner: http://localhost:8731
# PUERTO PROPIO (Nando, 10-nov-2026): el 8000 lo usa el ERP. Un service worker abarca toda la dirección donde se
# instala, así que cada proyecto en su puerto: si no, el de david-planner podría meterse en las respuestas del ERP.
# Cada respuesta lleva «Cache-Control: no-store», así el navegador pide siempre la versión del disco
# (con `python -m http.server` usaba copias viejas del CSS y parecía que faltaban cosas).
# Uso, desde cualquier sitio: python servidor.py   (sirve la carpeta donde está este archivo)
import functools
import http.server
import sys
from pathlib import Path

PUERTO = 8731
CARPETA = Path(__file__).resolve().parent


class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ServidorExclusivo(http.server.ThreadingHTTPServer):
    # Python pide «reutilizar la dirección» por defecto, y en Windows eso deja a DOS programas escuchar a la vez en el
    # mismo puerto (lo comprobé: un segundo servidor arrancaba sin avisar). Sin ello, si está ocupado, falla y avisa.
    allow_reuse_address = False


handler = functools.partial(SinCache, directory=str(CARPETA))
try:
    servidor = ServidorExclusivo(("127.0.0.1", PUERTO), handler)
except OSError:
    # Ocupado: avisar y parar, nunca quedarse con otro puerto a escondidas
    sys.exit(f"El puerto {PUERTO} está ocupado (¿otro servidor de david-planner abierto?). Ciérralo y vuelve a probar.")
print(f"Sirviendo {CARPETA} en http://localhost:{PUERTO} (sin caché). Ctrl+C para parar.", flush=True)
servidor.serve_forever()
