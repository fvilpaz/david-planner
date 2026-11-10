# SESSIONS — david-planner

## 10-nov-2026 — Arranque

**Hecho**
- Analizado `gestion-hosteleria` para ver qué se puede traer: el turno depende de la persona (`Shift.employee`),
  y las dos cuelgan de `core`, que está atado a eventos, pedidos, planos… No se copia código: se trae la lógica.
- Repositorio `fvilpaz/david-planner` creado (público) y clonado en `D:\Fernando\Coding\projects\david-planner`.
- `CLAUDE.md` (decisiones), `PLAN.md` (pasos 0–10) y este diario.

**Decidido**
- Página estática + PWA, datos en el navegador y copia en JSON: David solo quiere sustituir el PDF de la pared;
  un servidor con base de datos sería mantener mucho para poco.
- PDF con la impresión del navegador (sin jsPDF ni PNG): el CSS de impresión de gestion-hosteleria ya funciona.
- Intercambiar en dos toques y no arrastrando: en el móvil arrastrar dentro de una tabla que se desliza se
  confunde con desplazar.
- Dar de baja en vez de borrar: el histórico de semanas se conserva.
- Estados editables desde el principio (Nando): dejarlos fijos solo aplazaba el trabajo, y la lógica ya está
  probada en gestion-hosteleria (color de persona o de estado, un estado en uso no se borra).
- Sin gist de sincronización por ahora (token en el aparato, gist secreto no es privado, mezclar cambios es difícil).

**Aprendido**
- **PWA vs TWA:** la PWA es la web instalable (manifiesto + service worker); la TWA es esa PWA envuelta para
  Google Play. Sin tienda, basta la PWA.
- **El service worker solo arranca en `https` o `localhost`**: por eso se prueba con `python -m http.server` y no
  abriendo el archivo con doble clic.

**Siguiente**
- Paso 1: cuadrante de solo lectura con datos inventados, nombres y cabecera fijos y el footer.
