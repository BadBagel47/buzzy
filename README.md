# Buzzy

Mobilanpassat quiz med hostvy och separata spelarvyer, Firebase Authentication, Realtime Database och Hosting. Projektet kör en publik Spark-pilot; produktion på huvudkanalen är ett senare steg.

## Fortsätt här

- [Aktuell handoff](docs/HANDOFF.md): senaste verifierade publicering, återstående arbete och hur projektet återupptas.
- [Plan och mål](docs/PLAN.md): produktinriktning, lanseringsplan och pausade spår.
- [Arbetssätt](docs/WORKING_AGREEMENTS.md): ID:n, körbesked, modeller, verifiering och publicering.
- [Funktioner och buggar](docs/BACKLOG.md): backlogg med ID, typ (Funktion/Bugg/Utredning), status och beslut.
- [Webbguide](docs/WEBBSETUP.md): Firebase/GitHub och manuella publiceringssteg.

Handoff, plan, arbetssätt, funktioner och buggar hålls uppdaterade tillsammans, oavsett vilken AI-agent som arbetar. Agentinstruktionerna finns i [AGENTS.md](AGENTS.md). Äldre plan-/statusdokument är historik; börja i länkarna ovan.

## Projektstruktur

- `buzzy-live-pilot/`: aktiv app, generatorer och lokala emulator-/webbläsarprov.
- `buzzy-output/`: frysta HTML-referenser som generatorn läser; ändra aktiva transformationer och källfiler i appen.
- `ops/`: granskad regelevidens och avgränsade inventerings-/Hosting-operationer.
- `.github/workflows/`: manuella inventerings- och pilotflöden. En push publicerar inte automatiskt.
- `docs/`: aktuella planer, handoff och bakgrundsbeslut.

Previewkanalen använder samma riktiga Firebase-projekt och kvot som övriga tjänsten. Ingen betalplansändring är beställd. Användaren behöver inte installera verktyg eller köra terminalkommandon för publiceringen. Aktuell spellänk, kodrevision, provresultat och kanalens begränsningar finns i handoffen.

Den äldre README-texten bevaras i [arkivet](docs/archive/README_2026-11-08.md).
