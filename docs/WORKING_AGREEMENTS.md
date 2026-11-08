# Buzzy — arbetssätt

Uppdaterat 2026-11-08. Dessa punkter sammanfattar användarens löpande instruktioner. Nyare uttryckliga instruktioner i samtalet har företräde.

## Förslag och genomförande

- Samla nya önskemål med ID i [BACKLOG.md](BACKLOG.md). Förtydliga eller återöppna befintligt ID när det är samma fråga. Nästa lediga ID står där.
- Ändra inte appen bara för att ett önskemål registreras. Ett uttryckligt körbesked ger klartecken för angivet arbete. Fortsätt redan godkänt arbete utan upprepade tillståndsfrågor.
- Använd befintliga designmallar och färger. Hostens sekundärtext har riktmärket minst 14 px; granska responsiva undantag och dialoger. Bevara synligt tangentbordsfokus när mobilens tryckflash tas bort.
- Bevara utfällbara Settings-sektioners interna avstånd om användaren inte uttryckligen ändrar dem.
- Läs källan innan rotorsak påstås. Skilj mellan observerat fel, misstänkt orsak och faktiskt reproducerat fel.

## Modeller och resurser

- Föreslå modell för varje nytt arbete. Luna passar avgränsad dokumentation och enklare ändringar; Terra 6.1 high passar många riktade UI-arbeten. Sol high har rekommenderats för återanslutning, kvarstående animationsfel och behörighetsintegration.
- Rekommendera inte en mindre modell om bedömningen är att Sol behövs. Påstå inte att ett modellbyte gjorts om det inte faktiskt skett.
- Kör relevanta kontroller. Använd lokala demo-emulatorer och avlyssnade molnanrop när det går; dessa använder inte det verkliga projektets spelkvot. Gröna automatiska prov ersätter inte faktiska mobilutfall.

## Git och publicering

- Aktivt repo: `/workspace/buzzy`, GitHub `BadBagel47/buzzy`, gren `main`. Bevara arbete som redan ligger i arbetskopian.
- Commit och push har ingått i arbetsflödet, även för dokumentationsuppdateringar. Användaren har godkänt att Codex utför nödvändiga publiceringssteg där verktyg/behörighet finns.
- Användaren ska inte behöva installera verktyg eller köra terminalkommandon. Git-push har fungerat; senaste sessionen saknade fungerande Actions-dispatch. Kontrollera aktuell verktygstillgång vid behov, be inte om privata nycklar eller inloggningskoder.
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
