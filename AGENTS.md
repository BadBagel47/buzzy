# Buzzy: instruktioner för AI-agenter

Följ de övergripande agentreglerna: https://raw.githubusercontent.com/BadBagel47/agent-rules/main/AGENTS.md . Handoff: [`docs/HANDOFF.md`](docs/HANDOFF.md). Backlogg: [`docs/BACKLOG.md`](docs/BACKLOG.md). Nedan följer projektreglerna för Buzzy.

Den här filen gäller alla AI-agenter och verktyg som arbetar i repot, till exempel Claude, Codex, Copilot, Cursor och Gemini. `CLAUDE.md`, `GEMINI.md` och `.github/copilot-instructions.md` hänvisar hit. Ändra regler här, inte i hänvisningsfilerna.

## Läs vid start

1. [`docs/HANDOFF.md`](docs/HANDOFF.md) beskriver aktuellt läge, senaste publicering, nästa steg och kända öppna buggar.
2. [`docs/WORKING_AGREEMENTS.md`](docs/WORKING_AGREEMENTS.md) beskriver arbetssättet: körbesked, verifiering, git och publicering.
3. [`docs/PLAN.md`](docs/PLAN.md) beskriver mål, prioriteringar, pausade spår och lanseringsplan.
4. [`docs/BACKLOG.md`](docs/BACKLOG.md) innehåller funktioner, buggar och utredningar med ID, typ och status. Läs de ID:n som berörs.

Hämta senaste `main` och kontrollera `git status` före ändringar. Endast det som pushats till GitHub finns kvar till nästa session eller agent.

## Håll dokumenten aktuella

Användaren vill att handoff, mål, arbetssätt, funktioner och buggar hålls uppdaterade tillsammans, oberoende av vilken agent som arbetar. Uppdatera bara berörda filer, i samma commit som ändringen eller direkt efter.

| När detta ändras | Uppdatera |
|---|---|
| Nytt önskemål, ny bugg eller ett återfall | `BACKLOG.md`: ny rad med nytt ID (högsta ID i tabellen + 1) och typ (Funktion/Bugg/Utredning), eller återöppna befintligt ID. |
| Status för ett ID: körbesked, källändring, prov, publicering, användarprov | Statuskolumnen i `BACKLOG.md`, och `HANDOFF.md` om ändringen påverkar nästa steg |
| Publicering (körning, commit, kanal) | `HANDOFF.md`: senaste publicering. Eventuellt `PLAN.md`: nuvarande fas. |
| Mål, prioritering, pausat eller uppskjutet spår | `PLAN.md` |
| Ny eller ändrad instruktion om hur arbetet ska gå till | `WORKING_AGREEMENTS.md` |
| Kodstruktur, kommandon, verktygs- eller åtkomstläge | `HANDOFF.md` (Kod och kontroller / Publicering och åtkomst) |

Före avslut av ett arbetspass:

- Uppdatera datum i berörda dokument.
- Handoff ska beskriva aktuellt läge kortfattat, inte växa till en kronologisk chattlogg. Flytta detaljer till backloggens ID-avsnitt.
- Committa och pusha.

## Regler

- Nya önskemål samlas med ID före implementation. Registrering är inte ett körbeslut. Följ uttryckliga körbesked och redan givna godkännanden enligt arbetssättet.
- Dokumentera skillnaden mellan källändring, lokala prov, lyckad publicering och faktiskt mobilprov. Påstå aldrig mer än det som verifierats.
- Skriv agentneutralt i delade dokument, till exempel "agenten" i stället för ett produktnamn, om inte en uppgift gäller ett specifikt verktyg. Notera verktygsspecifika begränsningar i handoffen med datum.
- Lagra inga nycklar, inloggningsuppgifter eller chattexporter i repot, som är offentligt.
- Äldre planfiler utanför repot och arkiverade dokument är historiskt underlag. Senare användarinstruktioner har företräde. Bevara frysta prototypfiler och genomförda ändringar.
