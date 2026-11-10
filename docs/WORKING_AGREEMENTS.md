# Buzzy — arbetssätt

Uppdaterat 2026-11-10. Dessa punkter sammanfattar användarens löpande instruktioner och gäller oavsett vilken AI-agent eller vilket verktyg som arbetar (se [AGENTS.md](../AGENTS.md)). Nyare uttryckliga instruktioner i samtalet har företräde.

## Förslag och genomförande

- Samla nya önskemål med ID i [BACKLOG.md](BACKLOG.md). Förtydliga eller återöppna befintligt ID när det är samma fråga. Nytt ID = högsta ID i tabellen + 1.
- Ändra inte appen bara för att ett önskemål registreras. Ett uttryckligt körbesked ger klartecken för angivet arbete. Fortsätt redan godkänt arbete utan upprepade tillståndsfrågor.
- Använd befintliga designmallar och färger. Hostens sekundärtext har riktmärket minst 14 px; granska responsiva undantag och dialoger. Bevara synligt tangentbordsfokus när mobilens tryckflash tas bort.
- Bevara utfällbara Settings-sektioners interna avstånd om användaren inte uttryckligen ändrar dem.
- Läs källan innan rotorsak påstås. Skilj mellan observerat fel, misstänkt orsak och faktiskt reproducerat fel.

## Modeller och resurser

- Föreslå en modellnivå för varje nytt arbete:
  - **Liten** för avgränsad dokumentation och enklare ändringar.
  - **Mellan** för de flesta riktade UI-arbeten.
  - **Största/starkaste resonemang** för återanslutning, kvarstående animationsfel och behörighetsintegration.

  Ange nivån och, om det är känt, motsvarande modell hos det aktuella verktyget. Exempel från 2026-11: Claude Haiku/Sonnet/Opus 5.5, där tidigare GPT-6.1 Luna/Terra/Sol motsvarar samma nivåer. Användaren väljer modell i sitt verktyg.
- Rekommendera inte en mindre modell om bedömningen är att den största behövs. Påstå inte att ett modellbyte gjorts om det inte faktiskt skett. Modellnamn i äldre backloggavsnitt är historik.
- Kör relevanta kontroller. Använd lokala demo-emulatorer och avlyssnade molnanrop när det går; dessa använder inte det verkliga projektets spelkvot. Gröna automatiska prov ersätter inte faktiska mobilutfall.

## Git och publicering

- Aktivt repo: GitHub `BadBagel47/buzzy`, gren `main`. Agenter arbetar normalt i en tillfällig klon per session; endast det som pushats till GitHub finns kvar mellan sessioner och mellan olika agenter. Bevara arbete som redan ligger i arbetskopian.
- Commit och push ingår i arbetsflödet, även för dokumentationsuppdateringar. Användaren har godkänt att den arbetande agenten utför nödvändiga publiceringssteg där verktyg och behörighet finns.
- Användaren ska inte behöva installera verktyg eller köra terminalkommandon. Vilka GitHub-/Actions-möjligheter som finns beror på agentens miljö. Kontrollera aktuell verktygstillgång vid start i stället för att anta den, och notera aktuellt läge i handoffen. Om Actions-dispatch saknas gör användaren Run workflow i webben. Be aldrig om privata nycklar eller inloggningskoder.
- Håll svaren korta och beskriv inte tekniken i detalj. Skriv vad som är gjort, vad användaren behöver göra och vad som återstår. Tekniska detaljer läggs i backloggen eller handoffen och ges i chatten bara på begäran.
- Varje steg som användaren ska utföra anges med en klickbar direktlänk till rätt sida, till exempel workflowet, Firebase-konsolen eller den råa filen som ska kopieras. Skriv länken i själva svaret, även när en dialogruta visas.
- Nuvarande publicering startas genom [Firebase - publish reviewed pilot](https://github.com/BadBagel47/buzzy/actions/workflows/firebase-pilot.yml). Push startar inte publicering. Följ [WEBBSETUP.md](WEBBSETUP.md).
- Konsolläge kräver en aktuell kontroll av Firebase-reglerna vid varje körning enligt workflowets uttryckliga kontroll. Bekräfta inte den kontrollen på användarens vägnar utan underlag.
- När regelhashen ska användas, klistra alltid in hela strängen i ett kodblock. Hämta/verifiera den mot `ops/rules-evidence/console-snapshot.json` och granskningen; använd inte en omskriven kopia ur minnet.
- Efter användarens “Klart”: kontrollera senaste workflowstatus och exakt källcommit. Ge därefter spellänken. Påstå inte lyckad publicering om status inte kunnat verifieras.

## Dokumentation och handoff

- [PLAN.md](PLAN.md): mål, prioriteringar, pausade spår och lanseringsplan.
- [BACKLOG.md](BACKLOG.md): funktioner, buggar och utredningar med ID, typ, status, återfall och godkända utfall. Övre tabellen är aktuell status; äldre avsnitt är historik.
- [HANDOFF.md](HANDOFF.md): konkret återstart, senaste publicerade källversion, återstående arbete, kända öppna buggar och verifieringsgränser.
- Uppdatera berörda dokument när beslut eller utfall förändras, enligt tabellen i [AGENTS.md](../AGENTS.md). Handoff ska vara kort nog att läsa vid nästa start och innehålla aktuellt läge, inte en växande chattlogg.
- Lagra inga privata nycklar, personliga inloggningsuppgifter eller fullständiga chattexporter i det offentliga repot.
