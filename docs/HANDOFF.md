# Buzzy — läs först vid fortsatt arbete

Uppdaterad 2026-11-21. Läs därefter [arbetssättet](WORKING_AGREEMENTS.md), [planen](PLAN.md) och relevanta ID:n i [backloggen](BACKLOG.md). Senare användarinstruktioner har företräde. Äldre dokument som säger “senaste” kan beskriva tidigare faser.

## Agentregler och inventering

- Agentregler: v1.6 (2026-11-13), https://raw.githubusercontent.com/BadBagel47/agent-rules/main/AGENTS.md . Anpassat till v1.5 och v1.6 2026-11-13; repot följde inte agentreglerna dessförinnan.
- Inventory: 2026-11-13
- Projektspråk: engelska i produkttexten (host, spelare, viewer). Dokument på svenska, kod och commits på engelska.
- Publiceringsmetod: Firebase Hosting via push till `release` (se Publicering och åtkomst). Push till `main` publicerar inte.
- Grenar: `main`, `release` (spegel av `main` för publicering) och `restore/fore-cloudflare` (återställningspunkt före #408), alla avsiktligt kvar. Tagg `fore-viewer` är återställningspunkt. Inga öppna PR:er eller Issues.
- Känslig information (kontrollerat 2026-11-13, alla grenar och hela historiken): Firebase-webbnyckeln finns i koden och historiken och är offentlig av design; databasreglerna skyddar datan. `sk-ant-api03-localtestkey…` i proven är en påhittad testnyckel. Hostens frågor och svar lagras i databasen under `private`, som bara hosten kan läsa. Demofrågornas svar (#388) finns i källkoden, men de är bara exempel. `.gitignore` täcker `.env`.
- Verktygsläge 2026-11-18, Claude-molnsession: push till `main`, `release` och andra grenar fungerar, `gh` läser via REST (GraphQL och skrivning via API är spärrat), taggar kan inte pushas direkt; de skapas via arbetsflödet `create-tags.yml`.
- Verktygsläge 2026-11-21: agenten kan inte läsa privata utkast till säkerhetsrapporter i repot (listan returneras tom). Säkerhetsgenomgången från #415 ligger där; användaren klistrar in den vid behov.
- Engångsåtgärder: klara: publicering via `release` (#385), `.claude/settings.json` (lagt in av användaren) och taggar via arbetsflöde (2026-11-18, se Återställningspunkt). Möjlig framtida: databas- och Auth-behörighet för tjänstekontot, för gallring (#332, alternativ A).

### Beslut

- 2026-11-13: ID-formatet `#NNN` behålls (anpassningsplanens punkt 3.1). Det avviker från agentreglernas B-/F-/D-NNN. Regeltexten finns i [AGENTS.md](../AGENTS.md).
- 2026-11-13: anpassningen till agentreglerna v1.5 är genomförd (punkterna 1–4). Ingen anpassning väntar.
- 2026-11-13 (#406, integritetstexten): ansvarig anges som "Buzzy" utan namn, ett kontaktformulär läggs till senare, och texten beskriver läget i dag. Agenten har påpekat att det troligen inte räcker för GDPR:s krav på identitet och kontaktuppgift.
- 2026-11-18 (#408, flytten till network-kit): vid flytten får rummen fler spelarplatser och färre storskärmar än i dag (12 och 4), och rumskoderna blir 6 tecken. Exakta antal bestäms vid flytten.
- 2026-11-21 (#408): fokus på flytten till network-kit; network-kits stöd (F-147–F-151, D-152) byggs först; 30 spelare och 1 storskärm per rum; egen Worker på egen underdomän under provperioden; adminsidan och Playtest används; samma Cloudflare-nyckel som de andra spelen. Detaljer i [NETWORK_KIT_408.md](NETWORK_KIT_408.md).
- 2026-11-21 (#408): network-kit 0.21.0 är publicerad med allt Buzzy bad om, och 0.22.0 strax efter (inspelningsbeskedet i ett hörn). Flytten använder `v0.22.0`. Nästa steg är körning F (Buzzys rum på network-kit bakom en switch), som väntar på körbesked.
- Övriga beslut om arbetssättet finns i [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md), och mål och pausade spår i [PLAN.md](PLAN.md). Kör betyder bygga, prova, pusha och publicera via `release`.

### Dokumentkarta

[PLAN.md](PLAN.md) (mål), [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md) (arbetssätt), [BACKLOG.md](BACKLOG.md) (funktioner och buggar, med Proposed runs och Klart), [PRIVACY_332.md](PRIVACY_332.md) (integritet och gallring), [NETWORK_KIT_408.md](NETWORK_KIT_408.md) (avstämning inför flytten), `reviews/` (genomgången #415), [WEBBSETUP.md](WEBBSETUP.md) (Firebase, domän och regler), ID-underlag: [CONFETTI_283_284.md](CONFETTI_283_284.md), [INVESTIGATION_290.md](INVESTIGATION_290.md), [PAKET_289.md](PAKET_289.md), [PILOT_RUN_289.md](PILOT_RUN_289.md), [PLAYER_EXIT_295_297.md](PLAYER_EXIT_295_297.md), [RECONNECT_293.md](RECONNECT_293.md), [RULES_REVIEW_289.md](RULES_REVIEW_289.md), [UI_BATCH_292_303.md](UI_BATCH_292_303.md), [UI_REFINEMENTS_304_313.md](UI_REFINEMENTS_304_313.md), historik i `docs/archive/`.

## Aktuellt läge

Uppdaterat 2026-11-21. Fullständig status per ID finns i [BACKLOG.md](BACKLOG.md), och förslag på körningar under Proposed runs där.

- Senaste kodpublicering: `c855793`, [run 44919298504](https://github.com/BadBagel47/buzzy/actions/runs/44919298504) (live), status success, startad av agenten via `release`. Regler oförändrade, hash `fa60079f…`. Innehåller körning A och B: #441 (sidorna byggs ur vanliga källfiler i `app/`), #442 (regellista och namngivet klientgränssnitt), #429 (hela provsviten vid publicering och vid push till main) och #444 (frågebank i hostens webbläsare med export/import). Publiceringen kör nu hela sviten; första försöket (3f4703d, run 44918325181) stoppades av ett layoutprov eftersom typsnittet Inter saknades i GitHubs testmiljö, vilket rättades i `c855793`. Föregående: `91a3365` (#411–#413).
- 2026-11-13: #404 (provfelet) är rättat. Provet var inaktuellt sedan #335, eftersom en avstängd spelare lämnar via statusskärmen. Det är bara en provändring, så ingen ny publicering behövs.
- 2026-11-13: underlaget för #332 och #405 (integritet, lagring, gallring) finns i [PRIVACY_332.md](PRIVACY_332.md). Det väntar på användarens beslut.
- 2026-11-12: AI-frågor (#387–#395) och demoläget (#388) är live. Prov mot riktiga Claude väntar på användarens nyckel.
- 2026-11-12: mörkt hosttema (#378, #384, #386, #399, #401) är live. Prov i WebKit (iPad/iPhone) återstår.

## Kända öppna buggar

- #290 (vibration vid buzz): märks inte i Android Brave eller Chrome. Felsökning på enheten återstår.
- #345 (tillfälligt hostfel): presentationen är rättad, men orsaken är okänd. Ett nytt exempel behövs.
- #284 (konfetti efter många tryck): rättningen är publicerad, men stoppet reproducerades inte. Verkligt prov återstår.
- Många publicerade ändringar saknar användarprov på riktig enhet. De står som "användarprov återstår" under Klart i backloggen.

## Nästa steg

1. Användaren beslutar om #332 och #405 enligt avsnitt 5 i [PRIVACY_332.md](PRIVACY_332.md). Därefter registreras genomförandet (sida och gallring).
2. Användarprov: touch-dragning (#400), mörkt tema i WebKit, iPad med Brave (#353), vibration (#290).
3. Prov av #387 (AI-frågor) mot riktiga Claude när nyckeln finns.
4. Parkerat: #331, #348, #349, #350, #351 väg 2, #360, #377 och #380. Se backloggen.

## Kod och kontroller

- App: `buzzy-live-pilot/src/`. `client.js` hanterar Firebase; `bridge.js` kopplar spelgränssnittet till tillståndet; `connection.js` hanterar anslutningsåterhämtning.
- Sidor (#441, 2026-11-21): källan ligger i `buzzy-live-pilot/app/` (`page.js`, `page.css`, `page-network.css`, mallarna `host.template.html` och `player.template.html`, `player-page-patches.mjs` för spelarens buzzerutrymme, `index.html`, `viewer.html`). `scripts/build-pages.mjs` (`npm run pages`) bygger `host.html`, `player.html`, `index.html` och `viewer.html` och stoppar om en include-markering eller spelarersättning inte träffar exakt en gång. Ändra sidorna i `app/`, inte i de byggda filerna. Den gamla generatorn med ersättningskedjan på den frysta prototypen ligger kvar som historik i `buzzy-live-pilot/legacy-generator/` och används inte.
- Spelregler och klientgränssnitt (#442): [GAME_RULES.md](GAME_RULES.md) listar reglerna och var de upprätthålls. `src/room-code.js` har rumskodens format och sessionsnyckeln på ett ställe. `client.room(code)` ger namngivna läsningar (`control`, `meta`, `archive`, `hostState` m.fl.) i stället för Firebase-sökvägar i `bridge.js`. `bridge.js` kontrollerar vid start att `window.BuzzyView` har alla medlemmar den använder.
- Frågebibliotek (#444): `src/question-library.js` sparar hostens frågor i webbläsaren (`localStorage`, nyckeln `buzzy-question-library`), kopierar in dem i varje nytt rum (som ospelade) och har export/import till JSON-fil.
- AI-frågor (#387): `src/ai-questions.js` (flöde, nyckel i webbläsaren, låtsad klient via `window.__buzzyAiMock` bara på 127.0.0.1/localhost), sidkoden ingår i `app/page.js` (tidigare `ai-host-page.js`, nu i `legacy-generator/`). Modell `claude-opus-5-5`, webbsökning `web_search_20260209`, strikta submit-verktyg, `fallbacks: "default"`.
- Hostens tema (#378): `src/host-theme.js` skapar det mörka temat vid körning ur sidans stilar under `:root[data-host-theme=dark]`. Nya ljusa färger i host-CSS får automatiskt en mörk motsvarighet; justeringar för mörkt läge görs i modulens `extras`. Play-radens ikonläge (#379) sköts i `src/host-layout.js`. Viewern är fristående: `src/viewer.js`, `src/viewer.css` och genererad `viewer.html`. Ändra aktiva transformations-/CSS-/JS-filer, inte frysta HTML-referenser i repots `buzzy-output/`.
- Layout/effekter: `src/room-ui.css`, `host-layout.js`, `host-markup.js`, `celebration.js`. Konfetti: 432 bitar, startfördröjning 0–360 ms. Uppflygning och dalning är separata tider.
- Prov (#429): `npm test` bygger sidorna och kör hela integrationssviten mot lokala emulatorer; `npm run test:config` kör snabbproven, bland dem att de genererade reglerna stämmer med `database.rules.json` och att sidbygget fungerar. Publiceringen (`firebase-pilot.yml`) kör hela sviten, och `tests.yml` kör alla prov (även mot det byggda spelet) vid push till main som rör `buzzy-live-pilot/`.
- Lokala kontroller från `buzzy-live-pilot` (layoutproven förutsätter typsnittet Inter, som finns här och installeras i CI): `npm run test:config`, `npm run test:pilot-ui`, `npm run test:viewer`, `npm run build:pilot`, `npm run test:pilot`. Skapa `reports/` om mappen saknas. Webbläsarprov använder `CHROMIUM_PATH`, i molnsessionen `/opt/pw-browsers/chromium`. Enbart återanslutning kan köras med `node scripts/generate-ui.mjs` följt av `node scripts/emulators.mjs reconnect`.
- `test:production` testar vanliga `dist/`; kör `npm run build` först. `build:pilot` skapar `dist-pilot/` och uppdaterar inte `dist/`.
- Emulator-/UI-prov delar lokala portar och genererade filer: kör inte flera sådana sviter eller ett pilotbygge samtidigt med ett pågående emulator-UI-prov.

## Publicering och åtkomst

- Projekt `buzzy-197dc`, RTDB `https://buzzy-197dc-default-rtdb.europe-west1.firebasedatabase.app`, Spark. Preview använder riktig Auth och databas; molnspel använder riktig kvot.
- Hosting-publicering (#385): agenten pushar aktuell `main` till `release` (`git push origin main:release`); [release-publish.yml](https://github.com/BadBagel47/buzzy/actions/workflows/release-publish.yml) kontrollerar `release` = `main` och oförändrade regler (`ops/release-check.mjs`) och startar [firebase-pilot.yml](https://github.com/BadBagel47/buzzy/actions/workflows/firebase-pilot.yml) på `main` med live, `rules_source=console` och den bekräftade hashen. Google-åtkomsten är oförändrad (bara manuellt flöde på main). Om miljön `firebase-pilot` kräver granskare väntar körningen på användarens godkännande. Regeländringar: manuellt i konsolen, se [WEBBSETUP.md](WEBBSETUP.md).
- Granskad kanonisk regelhash, kontrollera mot evidensen före återanvändning:

```text
fa60079ffded9b680cae9e8dec70ef117e6186bdf21bf4c5ef7b3835714b38f2
```

Den här hashen gäller reglerna med Standby (#370), bekräftade 2026-11-11. Därförinnan `3017d3c2…` (#355/#356) och `6fbb6b7f…` (#347/#352), publicerade i konsolen 2026-11-10. De tidigare reglerna hade hashen `148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a` och finns i taggen `fore-viewer`.

- Ingen databasregel-/billing-/domänändring ingår automatiskt i Hosting-publiceringen. Regeln ovan är ingen ny verifiering av aktuellt molntillstånd.
- Verktygsläge 2026-11-10, Claude-molnsession: git-push och `gh` CLI fungerar och kan läsa repot och workflowstatus. Actions-dispatch har tidigare saknat fungerande auth, så användaren gör vid behov Run workflow i webben. Andra agenter och miljöer kan ha andra möjligheter. Kontrollera vid start och uppdatera denna rad.
- Publik status kan läsas från GitHubs workflow-/Actions-sida. Om workflowadressen ger 504 har `/BadBagel47/buzzy/actions` fungerat som reserv. Bekräfta både success och commit i run-sidan innan du rapporterar publicerat.

## Återställningspunkt

- **Nya taggar:** agenten lägger en rad `<namn> <hel commit-sha> [notering]` i `.github/tags.txt` och pushar till `main`. Arbetsflödet [create-tags.yml](https://github.com/BadBagel47/buzzy/actions/workflows/create-tags.yml) skapar taggar som saknas, kontrollerar dem på GitHub och flyttar eller tar aldrig bort en befintlig tagg. Gamla rader ligger kvar.

- **Före flytten till Cloudflare (#408):** grenen `restore/fore-cloudflare` (skapad 2026-11-18) pekar på `ad7932d`. Appkoden där är identisk med den publicerade `05c5b83` ([run 44246876775](https://github.com/BadBagel47/buzzy/actions/runs/44246876775)); efterföljande commits rör bara dokumentation. Databasreglerna är oförändrade (hash `fa60079f…`, kopia i `ops/rules-evidence/`). Grenen är avsiktligt kvar och ändras inte. Taggen `fore-cloudflare` (release "Före flytten till Cloudflare", skapad av användaren 2026-11-18) pekar på samma commit; kontrollerat av agenten.

- **Före viewer (#347):** taggen `fore-viewer` på GitHub (skapad av användaren 2026-11-10) pekar på `9916e8f`. Appkoden där är identisk med den publicerade `c8267afe59a812ffa2ec1c7a08fb054591f92217` ([run42687931351](https://github.com/BadBagel47/buzzy/actions/runs/42687931351)); efterföljande commits fram till taggen rör bara dokumentation. Molnsessionen kan inte pusha taggar, så nya taggar skapas av användaren via Releases.
- **Backa:**
  - kod med `git revert` eller genom att återställa till taggen `fore-viewer`
  - Hosting via Firebase-konsolens rollback eller ny körning från taggen
  - regler genom att klistra in den sparade regeltexten (`ops/rules-evidence/`) i konsolen

## Viktiga gränser

Spelarvy och flera äldre förbättringar har fått positiv mobilåterkoppling, men markera inte varje specifikt prov som utfört utan underlag. Avsiktligt hostavslut stänger spelet för alla; nätavbrott/omladdning ska inte göra det. Nuvarande Firebase-identiteter är anonyma och lokal persistence används. Ingen analytics hittades vid kodgranskningen, men detta är inte en full granskning av faktisk lagring, leverantörsvillkor eller lagkrav. Automatisk gallring av övergivna rum är inte implementerad.
