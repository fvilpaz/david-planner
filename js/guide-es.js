// La guía de la app EN ESPAÑOL: los temas y sus pasos, los grupos del glosario (el botón 📖) y lo que sirve para encontrar
// el tema que toca en una pregunta de «cómo se hace…». La lógica (buscar, desplegar, imprimir) está en fervis-guia.js; el idioma
// de ahora lo elige js/i18n.js. Si cambia algo de la app, se cambia aquí Y en js/guide-en.js (los mismos temas, con los mismos
// ids): una prueba comprueba que cada botón del menú y de la casilla sale en la guía. Cada tema: id, emoji, título y pasos.
window.GuideTexts = window.GuideTexts || {};
window.GuideTexts.es = {
  topics: [
    ["empezar", "🧭", "Moverse por el cuadrante", [
      "El cuadrante muestra una semana, de lunes a domingo.",
      "‹ y › cambian de semana.",
      "Toca el título (con el 📅) para abrir un calendario y saltar a cualquier fecha.",
      "«Hoy» vuelve a esta semana (solo sale si estás en otra).",
      "Los nombres y los días se quedan fijos al deslizar; la tabla de clientes y camareros de debajo se desliza a la vez.",
      "Toca una casilla para editarla y un nombre para abrir la ficha de esa persona."]],
    ["casilla", "✏️", "Poner o cambiar un turno", [
      "Toca la casilla del día y la persona.",
      "Elige el Estado (Trabajo, Libre, Vacaciones, Baja…).",
      "Si es de trabajo: pon inicio y fin (si el fin es antes que el inicio, acaba al día siguiente: 22:00–02:00).",
      "«+ Segundo tramo» para un turno partido.",
      "«Dónde» elige el punto de venta (si los has creado).",
      "Guardar. «Vaciar» deja la casilla en blanco."]],
    ["clientes_camareros", "👥", "Clientes previstos y camareros", [
      "Debajo del cuadrante hay otra tabla, con la misma columna por día.",
      "«Clientes previstos» (su cabecera azul): escribe cuántos clientes esperas ese día (un número entero; vacío lo quita). Cámbialo cuando haga falta, por ejemplo si llega un vuelo.",
      "«Camareros»: lo cuenta la app sola (quien tiene un estado con horario y algún tramo): el total y, debajo, una etiqueta por punto de venta con su color («2 Cafetería»). Quien trabaja en dos sitios el mismo día cuenta una vez en el total y en los dos sitios.",
      "«Clientes por camarero»: los clientes entre los camareros de ese día (sale solo el número, por ejemplo «20»), calculado por la app en cuanto escribes los clientes. Si hay clientes y nadie trabaja, pone «sin camareros».",
      "Los clientes van por fecha: al repetir una semana entera, los clientes no se repiten (hay que escribirlos). Entran en la copia de seguridad y en el papel."]],
    ["horas_extra", "⏱️", "Horas extra", [
      "En la ventana de la casilla, en «Horas extra», pon cuántas: de 0,5 a 16, con coma o punto, en medias horas.",
      "Si quieres, escribe el motivo.",
      "En el cuadrante, la casilla lleva una franja fucsia a la derecha con «+2 h extra»; también sale al imprimir.",
      "Vacío = sin horas extra."]],
    ["intercambiar", "⇄", "Intercambiar dos turnos", [
      "Abre una casilla y pulsa «⇄ Intercambiar con…».",
      "Toca la otra casilla: de otra persona, otro día o incluso otra semana.",
      "Se cambian los dos turnos, con sus horas extra y su sitio. Si la otra está vacía, el turno se mueve.",
      "«Deshacer» unos segundos; «Cancelar» o tocar la misma casilla lo anula."]],
    ["copiar_turno", "📋", "Copiar un turno a otras casillas", [
      "Abre una casilla con turno y pulsa «📋 Copiar a…».",
      "Toca las casillas libres donde lo quieras (de cualquier persona, día o semana).",
      "Cada una recibe el estado, el horario y el sitio, sin horas extra.",
      "Lo que ya tiene algo no se pisa.",
      "«Deshacer» quita la última copia; «Hecho» termina."]],
    ["copiar_semanas", "🗓️", "Copiar semanas", [
      "Gestión → «Copiar la semana anterior».",
      "Elige en cuántas semanas (de 1 a 8) y pulsa Copiar.",
      "La semana anterior a la que ves se repite en esta y en las siguientes.",
      "Solo en casillas vacías, sin horas extra y sin quien ya no trabaje aquí; el sitio sí se copia. Los clientes previstos no (van por fecha)."]],
    ["personal", "👥", "Personal", [
      "Gestión → «Personal»: la lista. «+ Añadir persona».",
      "Toca a alguien para cambiar su nombre y su color (hay 20).",
      "El orden: arrastra el ⠿ o escribe el número del puesto.",
      "«Quitar»: sin turnos se borra; con turnos, «Dar de baja desde el…» (la semana que ves): deja de salir desde entonces y se conserva el histórico. «Volver a dar de alta» la recupera.",
      "La primera vez salen «Camarero 1» a «Camarero 4»: renómbralos tocando el nombre."]],
    ["estados", "🏷️", "Estados (Libre, Vacaciones, Baja…)", [
      "Gestión → «Estados»: los tipos de casilla.",
      "Vienen Trabajo, Libre, Vacaciones y Baja (baja médica). Puedes crear más, como «Asuntos propios».",
      "Cada estado tiene nombre, color y si «Cuenta como trabajo» (lleva horario y horas extra y usa el color de la persona; los demás usan su propio color).",
      "El primero es el que sale al abrir una casilla vacía.",
      "Uno que ya se usa no se puede quitar ni cambiar si cuenta como trabajo."]],
    ["puntos_de_venta", "📍", "Puntos de venta", [
      "Gestión → «Puntos de venta»: crea los sitios (Chiringuito, Cafetería, Pub…).",
      "Hasta que no haya uno, «Dónde» no sale en la casilla.",
      "Con puntos creados, cada tramo tiene su «Dónde» y el nombre sale pequeño debajo de la hora.",
      "Cada punto tiene su color (hay 20), como las personas: se elige al crearlo o al tocarlo.",
      "Gestión → «Colorear por»: «Persona» (cada tramo lleva el color de quien trabaja, como siempre) o «Punto de venta» (el color del sitio: ves de un vistazo dónde va cada uno). Solo sale si hay puntos creados.",
      "Uno en uso no se puede quitar, pero su nombre y su color sí se pueden cambiar."]],
    ["imprimir", "🖨️", "Imprimir o guardar en PDF", [
      "Gestión → «Imprimir / PDF» abre la impresión del navegador con la semana que ves y, debajo, la tabla de clientes y camareros.",
      "Sale en una hoja A4 apaisada y siempre en colores claros.",
      "Para guardar un PDF, elige «Guardar como PDF» como destino.",
      "También se lee bien en blanco y negro (se pierde el color por persona o por sitio)."]],
    ["copia_seguridad", "💾", "Copia de seguridad", [
      "Gestión → «Copia de seguridad».",
      "«Descargar copia» guarda un archivo con todo: guárdalo también fuera del móvil (Drive, correo, el PC).",
      "«Cargar una copia…» la recupera y pide confirmación; antes guarda lo que había como copia automática (se recupera en «Copias automáticas»), sin descargar nada.",
      "Hay copias automáticas dentro del navegador: una por semana, las 5 últimas, con «Recuperar».",
      "Si pasan 7 días sin descargar copia, sale un aviso arriba.",
      "Los datos viven solo en el navegador de ese aparato: si se borran, se pierden."]],
    ["temas", "🎨", "Temas de color", [
      "Gestión → «Tema»: Claro, Lino, Oscuro y Carbón; cambia el cuadrante y también la tabla de clientes.",
      "Debajo, «Color de las etiquetas»: desliza de Suave (0) a Vivo (100) para ver los colores más vivos, en cualquier tema.",
      "Se recuerda en cada aparato.",
      "Al imprimir siempre sale en claro."]],
    ["local_y_persona", "🏢", "Nombre del local y de la persona", [
      "Arriba a la izquierda, el cuadrado con el lápiz cambia el nombre del local y la ciudad (las iniciales salen solas).",
      "Arriba a la derecha, el círculo con el lápiz cambia el nombre de quien usa la app."]],
    ["instalar", "📲", "Instalar la app y usarla sin conexión", [
      "Se puede instalar como una aplicación: en el navegador, menú → «Instalar aplicación» o «Añadir a la pantalla de inicio» (depende del navegador).",
      "Una vez instalada, abre sin conexión.",
      "Fervis es lo único que necesita internet."]],
    ["fervis", "🤖", "Qué puede hacer Fervis", [
      "Se abre con el robot de arriba.",
      "Dice quién trabaja ahora o cualquier día y qué turno tiene cada persona.",
      "Cuenta: turnos partidos o seguidos, fines de semana libres, vacaciones, bajas; y de cada día, los clientes previstos, los camareros por sitio y los clientes por camarero.",
      "Explica cómo se usa la app y charla de cosas generales (contratos, descansos…), siempre orientativo.",
      "Solo lee los turnos: no cambia nada.",
      "Necesita la clave gratuita de Groq: icono de tres barras → Ajustes (se crea en console.groq.com).",
      "La papelera borra la conversación. Con muchas preguntas seguidas, el plan gratuito puede pedir esperar un minuto."]],
  ],

  // El glosario (botón 📖): los temas agrupados. Cada grupo: id, emoji, título y los ids de sus temas.
  groups: [
    ["turnos", "📅", "Turnos y casillas", ["empezar", "casilla", "clientes_camareros", "horas_extra", "intercambiar", "copiar_turno"]],
    ["gestion", "🛠️", "Menú Gestión", ["copiar_semanas", "personal", "estados", "puntos_de_venta", "imprimir", "copia_seguridad", "temas"]],
    ["app", "🏢", "Mi local, la app y Fervis", ["local_y_persona", "instalar", "fervis"]],
  ],

  // Para el modelo: el índice de temas (manual_app sin tema o con uno que no existe) y cómo se reconoce una pregunta de «cómo se hace…».
  // Se comparan las palabras de la pregunta con las de cada tema por sus 4 primeras letras (cambio/cambiar, copio/copiar), sin tildes.
  indexIntro: "Temas de la guía (pídelos uno a uno con manual_app y «tema»): ",
  howTo: /\b(como|donde|se puede|puedo|puede|manual|guia|ayuda|funcion|opcion|para que sirve|que hace|que puedes)\b/,
  stop: ["para", "como", "donde", "puedo", "puede", "quiero", "tengo", "hacer", "esta", "este", "esto", "unas", "unos", "tiene", "tienen", "sobre", "desde", "hasta"],
};
