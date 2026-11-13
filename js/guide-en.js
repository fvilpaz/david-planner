// The app guide IN ENGLISH: the topics and their steps, the glossary groups (the 📖 button) and what helps find the right topic
// in a "how do I…" question. Same topics and SAME ids as js/guide-es.js (the ids are what the model asks for); only the text
// changes. The names of buttons and menus between quotes are the ones the English interface shows (see js/lang-en.js).
window.GuideTexts = window.GuideTexts || {};
window.GuideTexts.en = {
  topics: [
    ["empezar", "🧭", "Moving around the schedule", [
      "The schedule shows one week, from Monday to Sunday.",
      "‹ and › change the week.",
      "Tap the title (with the 📅) to open a calendar and jump to any date.",
      "“Today” goes back to this week (it only shows if you are on another one).",
      "Names and days stay fixed when you scroll; the clients and waiters table below scrolls along with them.",
      "Tap a cell to edit it and a name to open that person's card."]],
    ["casilla", "✏️", "Setting or changing a shift", [
      "Tap the cell of the day and the person.",
      "Choose the Status (Work, Off, Holiday, Sick leave…).",
      "If it is a work status: enter start and end (if the end is before the start, it ends the next day: 22:00–02:00).",
      "“+ Second period” for a split shift.",
      "“Where” picks the outlet (if you have created them).",
      "Save. “Clear” leaves the cell blank."]],
    ["clientes_camareros", "👥", "Expected clients and waiters", [
      "Below the schedule there is another table, with the same column for each day.",
      "“Expected clients” (its blue header): type how many clients you expect that day (a whole number; empty removes it). Change it whenever you need, for example if a flight arrives.",
      "“Waiters”: the app counts it by itself (whoever has a status with hours and at least one period): the total and, below, a label for each outlet with its colour (“2 Café”). Someone who works at two outlets on the same day counts once in the total and in both outlets.",
      "“Clients per waiter”: the clients divided among that day's waiters (only the number shows, for example “20”), calculated by the app as soon as you type the clients. If there are clients and nobody is working, it says “no waiters”.",
      "Clients go by date: when you repeat a whole week, the clients are not repeated (you have to type them). They go into the backup and onto paper."]],
    ["horas_extra", "⏱️", "Overtime", [
      "In the cell window, under “Overtime”, enter how many: from 0.5 to 16, with a comma or a dot, in half hours.",
      "If you want, write the reason.",
      "In the schedule, the cell has a fuchsia strip on the right with “+2 h extra”; it also shows when printing.",
      "Empty = no overtime."]],
    ["intercambiar", "⇄", "Swapping two shifts", [
      "Open a cell and press “⇄ Swap with…”.",
      "Tap the other cell: another person, another day or even another week.",
      "Both shifts are swapped, with their overtime and outlet. If the other one is empty, the shift moves.",
      "“Undo” for a few seconds; “Cancel” or tapping the same cell cancels it."]],
    ["copiar_turno", "📋", "Copying a shift to other cells", [
      "Open a cell with a shift and press “📋 Copy to…”.",
      "Tap the free cells where you want it (any person, day or week).",
      "Each one receives the status, the hours and the outlet, without overtime.",
      "A cell that already has something is not overwritten.",
      "“Undo” removes the last copy; “Done” finishes."]],
    ["copiar_semanas", "🗓️", "Copying weeks", [
      "Manage → “Copy previous week”.",
      "Choose into how many weeks (1 to 8) and press Copy.",
      "The week before the one you see is repeated in this one and the following ones.",
      "Only in empty cells, without overtime and without anyone who no longer works here; the outlet is copied. Expected clients are not (they go by date)."]],
    ["personal", "👥", "Staff", [
      "Manage → “Staff”: the list. “+ Add person”.",
      "Tap someone to change their name and colour (there are 20).",
      "The order: drag the ⠿ or type the position number.",
      "“Remove”: with no shifts it is deleted; with shifts, “Deactivate from…” (the week you see): they stop showing from then on and the history is kept. “Reactivate” brings them back.",
      "The first time you see “Waiter 1” to “Waiter 4”: rename them by tapping the name."]],
    ["estados", "🏷️", "Status (Off, Holiday, Sick leave…)", [
      "Manage → “Status”: the types of cell.",
      "It comes with Work, Off, Holiday and Sick leave. You can create more, such as “Personal day”.",
      "Each status has a name, a colour and whether it “Counts as work” (it has hours and overtime and uses the person's colour; the others use their own colour).",
      "The first one is the one shown when you open an empty cell.",
      "One that is already in use cannot be removed or switched to count as work."]],
    ["puntos_de_venta", "📍", "Outlets", [
      "Manage → “Outlets”: create the places (Beach bar, Café, Pub…).",
      "Until there is one, “Where” does not show in the cell.",
      "With outlets created, each period has its “Where” and the name shows small below the time.",
      "Each outlet has its colour (there are 20), like the people: it is chosen when you create it or tap it.",
      "Manage → “Colour by”: “Person” (each period takes the colour of whoever works, as usual) or “Outlet” (the colour of the place: you see at a glance where each one is). It only shows if there are outlets.",
      "One in use cannot be removed, but its name and colour can be changed."]],
    ["imprimir", "🖨️", "Printing or saving as PDF", [
      "Manage → “Print / PDF” opens the browser's print dialog with the week you see and, below, the clients and waiters table.",
      "It comes out on one landscape A4 sheet and always in light colours.",
      "To save a PDF, choose “Save as PDF” as the destination.",
      "It also reads well in black and white (the colour per person or per outlet is lost)."]],
    ["copia_seguridad", "💾", "Backup", [
      "Manage → “Backup”.",
      "“Download backup” saves a file with everything: also keep it outside the phone (Drive, email, the PC).",
      "“Load a backup…” restores it and asks for confirmation; first it saves what was there as an automatic backup (you can restore it from “Automatic backups”), without downloading anything.",
      "There are automatic backups inside the browser: one a week, the last 5, with “Restore”.",
      "If 7 days pass without downloading a backup, a notice shows at the top.",
      "The data lives only in that device's browser: if it is deleted, it is lost."]],
    ["temas", "🎨", "Colour themes", [
      "Manage → “Theme”: Light, Linen, Dark and Charcoal; it changes the schedule and also the clients table.",
      "Below, “Label colour”: slide from Soft (0) to Vivid (100) to see brighter colours, in any theme.",
      "It is remembered on each device.",
      "When printing it always comes out in light."]],
    ["local_y_persona", "🏢", "Venue name and person's name", [
      "Top left, the square with the pencil changes the venue name and the city (the initials appear by themselves).",
      "Top right, the circle with the pencil changes the name of whoever uses the app."]],
    ["instalar", "📲", "Installing the app and using it offline", [
      "It can be installed as an app: in the browser, menu → “Install app” or “Add to home screen” (it depends on the browser).",
      "Once installed, it opens without a connection.",
      "Fervis is the only thing that needs internet."]],
    ["fervis", "🤖", "What Fervis can do", [
      "It opens with the robot at the top.",
      "It tells you who is working now or on any day and what shift each person has.",
      "It counts: split or straight shifts, weekends off, holidays, sick leave; and for each day, the expected clients, the waiters per outlet and the clients per waiter.",
      "It explains how to use the app and chats about general things (contracts, breaks…), always as guidance.",
      "It only reads the shifts: it changes nothing.",
      "It needs the free Groq key: three-bars icon → Settings (create it at console.groq.com).",
      "The bin clears the conversation. With many questions in a row, the free plan may ask you to wait a minute."]],
  ],

  groups: [
    ["turnos", "📅", "Shifts and cells", ["empezar", "casilla", "clientes_camareros", "horas_extra", "intercambiar", "copiar_turno"]],
    ["gestion", "🛠️", "Manage menu", ["copiar_semanas", "personal", "estados", "puntos_de_venta", "imprimir", "copia_seguridad", "temas"]],
    ["app", "🏢", "My venue, the app and Fervis", ["local_y_persona", "instalar", "fervis"]],
  ],

  indexIntro: "Guide topics (ask for them one by one with manual_app and “tema”): ",
  howTo: /\b(how|where|can i|can you|can it|is it possible|manual|guide|help|feature|option|what does|what is it for|what can)\b/,
  stop: ["what", "when", "with", "this", "that", "from", "have", "does", "your", "would", "could", "there", "about", "into", "them", "will", "should", "want", "need", "make", "which", "where", "show"],
};
