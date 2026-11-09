# Buzzy — arbetssätt

Uppdaterat 2026-11-10. Dessa punkter sammanfattar användarens löpande instruktioner. Nyare uttryckliga instruktioner i samtalet har företräde.

## Förslag och genomförande

- Samla nya önskemål med ID i [BACKLOG.md](BACKLOG.md). Förtydliga eller återöppna befintligt ID när det är samma fråga. Nästa lediga ID står där.
- Ändra inte appen bara för att ett önskemål registreras. Ett uttryckligt körbesked ger klartecken för angivet arbete. Fortsätt redan godkänt arbete utan upprepade tillståndsfrågor.
- Använd befintliga designmallar och färger. Hostens sekundärtext har riktmärket minst 14 px; granska responsiva undantag och dialoger. Bevara synligt tangentbordsfokus när mobilens tryckflash tas bort.
- Bevara utfällbara Settings-sektioners interna avstånd om användaren inte uttryckligen ändrar dem.
- Läs källan innan rotorsak påstås. Skilj mellan observerat fel, misstänkt orsak och faktiskt reproducerat fel.

## Modeller och resurser

- Föreslå modell för varje nytt arbete. Arbetet sker sedan 2026-11-10 med Claude. Ungefärlig motsvarighet till tidigare nivåer: Claude Haiku 5.5 (tidigare Luna) för avgränsad dokumentation och enklare ändringar; Claude Sonnet 5.5 (tidigare Terra high) för många riktade UI-arbeten; Claude Opus 5.5 (tidigare Sol high) för återanslutning, kvarstående animationsfel och behörighetsintegration. Användaren väljer modell i chattens modellväljare.
- Rekommendera inte en mindre modell om bedömningen är att Opus behövs. Påstå inte att ett modellbyte gjorts om det inte faktiskt skett. Äldre ID:n i backloggen kan nämna GPT-6.1 Luna/Terra/Sol; det är historik.
- Kör relevanta kontroller. Använd lokala demo-emulatorer och avlyssnade molnanrop när det går; dessa använder inte det verkliga projektets spelkvot. Gröna automatiska prov ersätter inte faktiska mobilutfall.

## Git och publicering

- Aktivt repo: GitHub `BadBagel47/buzzy`, gren `main`. Claude arbetar i en tillfällig klon per session (senast `/home/claude/buzzy`); endast det som pushats till GitHub finns kvar mellan sessioner. Bevara arbete som redan ligger i arbetskopian.
- Commit och push har ingått i arbetsflödet, även för dokumentationsuppdateringar. Användaren har godkänt att Claude (tidigare Codex) utför nödvändiga publiceringssteg där verktyg/behörighet finns.
- Användaren ska inte behöva installera verktyg eller köra terminalkommandon. Claude GitHub-appen är installerad för repot. Workflowstatus kan läsas, men Actions-dispatch saknas i Claude-sessionen; användaren gör Run workflow i webben. Kontrollera aktuell verktygstillgång vid behov, be inte om privata nycklar eller inloggningskoder.
- Nuvarande publicering startas genom [Firebase - publish reviewed pilot](https://github.com/BadBagel47/buzzy/actions/workflows/firebase-pilot.yml). Push startar inte publicering. Följ [WEBBSETUP.md](WEBBSETUP.md).
- Konsolläge kräver en aktuell kontroll av Firebase-reglerna vid varje körning enligt workflowets uttryckliga kontroll. Bekräfta inte den kontrollen på användarens vägnar utan underlag.
- När regelhashen ska användas, klistra alltid in hela strängen i ett kodblock. Hämta/verifiera den mot `ops/rules-evidence/console-snapshot.json` och granskningen; använd inte en omskriven kopia ur minnet.
- Efter användarens “Klart”: kontrollera senaste workflowstatus och exakt källcommit. Ge därefter spellänken. Påstå inte lyckad publicering om status inte kunnat verifieras.

## Dokumentation och handoff

- [PLAN.md](PLAN.md): mål, prioriteringar, pausade spår och lanseringsplan.
- [BACKLOG.md](BACKLOG.md): aktuella ID:n, status, återfall och godkända utfall. Övre tabellen är aktuell status; äldre avsnitt är historik.
- [HANDOFF.md](HANDOFF.md): konkret återstart, senaste publicerade källversion, återstående arbete och verifieringsgränser.
- Uppdatera berörda dokument när beslut eller utfall förändras. Handoff ska vara kort nog att läsa vid nästa start och innehålla aktuellt läge, inte en växande chattlogg.
- Lagra inga privata nycklar, personliga inloggningsuppgifter eller fullständiga chattexporter i det offentliga repot.
