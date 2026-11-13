# Buzzy — läs först vid fortsatt arbete

Uppdaterad 2026-11-13. Läs därefter [arbetssättet](WORKING_AGREEMENTS.md), [planen](PLAN.md) och relevanta ID:n i [backloggen](BACKLOG.md). Senare användarinstruktioner har företräde. Äldre dokument som säger “senaste” kan beskriva tidigare faser.

## Agentregler och inventering

- Agentregler: v1.5 (2026-11-13), https://raw.githubusercontent.com/BadBagel47/agent-rules/main/AGENTS.md . Repot följde inte agentreglerna före 2026-11-13.
- Inventory: 2026-11-13
- Projektspråk: engelska i produkttexten (host, spelare, viewer). Dokument på svenska, kod och commits på engelska.
- Publiceringsmetod: Firebase Hosting via push till `release` (se Publicering och åtkomst). Push till `main` publicerar inte.
- Grenar: `main` och `release` (spegel av `main` för publicering, avsiktligt kvar). Tagg `fore-viewer` är återställningspunkt. Inga öppna PR:er eller Issues.
- Känslig information (kontrollerat 2026-11-13, alla grenar och hela historiken): Firebase-webbnyckeln finns i koden och historiken och är offentlig av design; databasreglerna skyddar datan. `sk-ant-api03-localtestkey…` i proven är en påhittad testnyckel. Frågor och svar lagras bara hos hosten, inte i databasen. Demofrågornas svar (#388) finns i källkoden, men de är bara exempel. `.gitignore` täcker `.env`.
- Verktygsläge 2026-11-13, Claude-molnsession: push till `main` och `release` fungerar, `gh` fungerar via REST (GraphQL är spärrat), taggar kan inte pushas.
- Engångsåtgärder: klara: publicering via `release` (#385) och `.claude/settings.json` (lagt in av användaren). Inga väntande.

### Beslut

Beslut som gäller arbetssättet finns i [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md), och mål och pausade spår finns i [PLAN.md](PLAN.md). Projektets ID-system (`#NNN`) och dokumentstruktur behålls tills anpassningsplanen nedan är avgjord.

### Pending adaptation

Anpassningsplan till agentreglerna v1.5 (2026-11-13), väntar på användarens beslut:

- **1 – Regelfiler**
  - 1.1 ⚠️ AGENTS.md: ta bort regler som dubblerar agentreglerna (läsa vid start, synka `main`, inga nycklar, agentneutral text). Projektreglerna behålls: läsordningen, tabellen för dokumentuppdatering och frysta prototypfiler.
  - 1.2 ⚠️ WORKING_AGREEMENTS.md: ta bort punkter som nu finns i agentreglerna (förklara ID, ingen löpande kommentar, korta svar, länkar för manuella steg). Projektspecifika punkter behålls (design, publicering, regelhash).
- **2 – Backlogg**
  - 2.1 Lägg till kolumnen Prioritet (Hög, Medel, Låg) och föreslå värden för öppna punkter.
  - 2.2 ⚠️ Flytta publicerade punkter utan kända fel till en klar-sektion. Raderna behålls oförändrade, inklusive "användarprov återstår". Öppna buggar som #290, #284 och #345 ligger kvar.
  - 2.3 Ge pausade punkter statusen Parkerad: #331, #348, #349, #350, #351 väg 2, #360, #377 och #380.
- **3 – Projektregler som krockar med agentreglerna**
  - 3.1 ID-format. Projektregel: `#NNN`. Agentregel: B-/F-/D-NNN, eftersom GitHub länkar `#123` till issues. Rekommendation: behåll `#NNN`. Det gäller över 120 punkter som används i commits och dokument, och repot har inga PR:er eller Issues som kan krocka.
- **4 – Handoff**
  - 4.1 ⚠️ Korta "Nästa steg" i HANDOFF.md, som har vuxit till en logg, till de cirka fem senaste posterna. Flytta detaljer till backloggens ID-avsnitt och uppdatera den inaktuella fasen i PLAN.md.

⚠️ = punkten tar bort eller skriver över text. Allt finns kvar i git-historiken.

### Dokumentkarta

[PLAN.md](PLAN.md) (mål), [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md) (arbetssätt), [BACKLOG.md](BACKLOG.md) (funktioner och buggar, med Proposed runs), [WEBBSETUP.md](WEBBSETUP.md) (Firebase, domän och regler), ID-underlag: [CONFETTI_283_284.md](CONFETTI_283_284.md), [INVESTIGATION_290.md](INVESTIGATION_290.md), [PAKET_289.md](PAKET_289.md), [PILOT_RUN_289.md](PILOT_RUN_289.md), [PLAYER_EXIT_295_297.md](PLAYER_EXIT_295_297.md), [RECONNECT_293.md](RECONNECT_293.md), [RULES_REVIEW_289.md](RULES_REVIEW_289.md), [UI_BATCH_292_303.md](UI_BATCH_292_303.md), [UI_REFINEMENTS_304_313.md](UI_REFINEMENTS_304_313.md), historik i `docs/archive/`.

## Aktuellt läge

- Arbetet kan utföras av olika AI-agenter. Alla följer [AGENTS.md](../AGENTS.md). Arbeta i en klon av `BadBagel47/buzzy`, gren `main`. Hämta senaste `main` och kontrollera `git status` före ändringar. Pusha för att något ska finnas kvar till nästa session.
- Senaste kodpublicering: `decc6e9`, [run 43324396558](https://github.com/BadBagel47/buzzy/actions/runs/43324396558) (live), status success, startad av agenten via `release` (#385). Regler oförändrade, hash `fa60079f…`. Innehåller #399–#403 (läsbara mörka fält, dra-och-släpp, switchar, sekundära knappar, inaktivt läge) och tidigare #351, #361–#398. Användarprov på riktiga enheter (särskilt touch-dragning) och prov mot riktiga Claude återstår.
- Spellänk: https://buzzy-197dc--pilot-mrst5vi1.web.app . Kanalen har en dags giltighet per publicering; kontrollera status före påstående om tillgänglighet.
- Senaste kodpaket: #293 tidig återkoppling/återförsök efter cirka 4 s och automatisk återhämtning efter nät-timeout; #305 gemensamt 14 px kortavstånd och reserverad Play-radhöjd; #320 samma kortgap under/efter vyanimation.
- Questions-hoppet reproducerades som 1 px skillnad för andra kortet. Det gamla provet mätte endast första kortet; nytt prov mäter även Question queue. Gemensam kortplacering verifierades på 320/390/430/768/1280 px.
- Användaren bekräftar nu att återanslutningen i #293 verkar fungera. Den ursprungliga rotorsaken på Android/Brave fastställdes inte separat.
- Senaste verifiering: konfiguration 5/5, pilot-UI 5/5 (inklusive återanslutning), pilotbygge och interceptat HTTPS-prov. Aktuell fysisk wifi/5G- och layoutkontroll återstår.
- #316, #333 och #334 är publicerade. Rena `/host` och `/player` samt vidarebefordring av gamla `.html`-adresser är kontrollerade i Hosting-emulatorn; mobilprov återstår. Se aktuell teststatus i backloggen.

## Kända öppna buggar

Fullständig lista med typ och status finns i [BACKLOG.md](BACKLOG.md). Lista här bara buggar som inte är lösta eller som väntar på bekräftelse.

- #290 vibration vid buzz märks inte i Android Brave/Chrome. Felsökning på faktisk enhet återstår.
- #284 konfetti slutade fungera efter många tryck. Rättning publicerad, men det ursprungliga stoppet reproducerades inte. Verkligt prov återstår.
- #345 tillfälligt hostfel: presentationen är rättad, men felets innehåll och orsak är okända.
- Buggrättningar som är publicerade men saknar mobilprov: #291, #313, #320, #321, #324, #333, #335, #340 och #342. Se backloggen.

## Nästa steg och pausade spår

1. Invänta mobilåterkoppling på #305/#320 och övriga nyligen publicerade UI-ändringar. #293 är godkänd enligt senaste användaråterkoppling.
   #304 är publicerad i run42520516709: ikon/text flyttas 1,5 CSS-px åt vänster i horisontell layout. Tidigare run42508028844 misslyckades i återanslutningstestet; timeoutens rotorsak är okänd. Hostfliken sätts nu i förgrunden inför testinteraktionen och testet loggar diagnostik vid timeout. Mobilprov återstår.
2. #290 vibration: 40 ms begärs vid spelarens aktiva buzztryck, men användaren får ingen vibration i Android Brave eller Chrome. Fortsatt felsökning på den verkliga enheten återstår.
   #284/#338: publicerat till live i run42529524063; högst tre samtidigt aktiva skurar med en samlad väntande skur samt ändrade banor för nedre mitten. Lokalt prov med 12 snabba tryck passerade; ursprungligt stopp reproducerades inte och faktisk mobil-/desktopprestanda återstår.
   #335/#336/#339/#340: källändringar och lokala pilotprov är klara; run42550140217 från commit `2eb7a9996f11f0bea42c6a7a13316b45ec5c3e35` lyckades och innehåller ändringarna. Vald Hosting-kanal kan inte avläsas på den offentliga sidan; invänta användarens bekräftelse samt verkliga visuella prov.
   #341–343: ändrade och lokalt verifierade — spelarvyns bakgrundstoning över hela fönstret, mindre och centrerad fokusring med bevarad träffyta/fokus, samt optisk centrering av Join-texten. Run42556139061 från `0856d150320ee9d2a8a0faf8764ef544370a4ed9` lyckades; användaren ombads välja live och meddelade klar, men målkanalen är inte direkt avläst. Användarprov återstår.
   #344–346 och #345: publicerade i run42687931351 till live. Förstasidans logotyp är 46 px (42 px vid högst 350 px). Hostens längre status/fel visas i en stängbar ruta; kort statusen visar bara rumskoden på 320 px, och feltexten/återförsöket öppnas från den. UI-, konfigurations-, riktade room-UI-, pilotbygge- och HTTPS-kontroller passerade. Verkligt visuellt användarprov återstår. Det ursprungliga tillfälliga felets innehåll och orsak är okända.

   #337: `buzzy.trythis.one` är tillåten och publicerad till live enligt användarens bekräftelse. Cloudflare CNAME `buzzy` → `buzzy-197dc.web.app` är DNS only; Firebase verifierade domänen och användaren bekräftar nu att den fungerar. Specifika host-/spelarflöden på domänen är inte separat bekräftade.
3. #331 host-/admininloggning: pausad i väntan på användarens engångslänkslösning från ett annat projekt. Ingen Cloudflare Access/Firebase-inloggningsvariant är vald för implementation.
4. #332 integritetsinformation och gallringsplan: registrerad inför publik lansering, ingen implementation eller full juridisk bedömning gjord.
5. #347 viewer och #352 join-skärm är publicerade till live i [run42865760330](https://github.com/BadBagel47/buzzy/actions/runs/42865760330). Reglerna (hash `6fbb6b7fe7d13d93ce0393cb9cc16bb0ffa4fcdede0a1550cd34349cebfea5f9`) är publicerade i Firebase-konsolen. De tidigare reglerna finns i taggen `fore-viewer`.
6. #354 (ny viewerlayout och rörelse), #356 (viewerknapp i huvudet, förenklad), #357 (renare QR-dialog), #358 (ny Settings-ikon) och #359 (bredare Settings-text) är publicerade i [run42918125973](https://github.com/BadBagel47/buzzy/actions/runs/42918125973) från `568b55a`. Användarprov på riktig TV, dator och mobil återstår.
7. #353 (buzzern på iPad), #355 (viewerläge), #356 (Viewer on/off) och knappen för Question N är publicerade i [run42923620535](https://github.com/BadBagel47/buzzy/actions/runs/42923620535). Prov på iPad med Brave (#353) återstår; TV-provet räknas som gjort via datorprov. #348–#351 och #360 är framtida steg.
8. #370 (Standby) och #356 (viewerpanel ovanpå vyn) är publicerade i [run43018116951](https://github.com/BadBagel47/buzzy/actions/runs/43018116951). Prov återstår.
9. #373, #375, #376, #367, #351 och #361–#376 (utom #360) är publicerade 2026-11-11 i [run43112384657](https://github.com/BadBagel47/buzzy/actions/runs/43112384657) (se Senaste publicering). Prov återstår på iPad med Brave (#353) och mobil. Provet på TV/projektor räknas som gjort: användaren provar viewern löpande på dator, som ger samma resultat (2026-11-11).
10. **Publicerat 2026-11-12 i run43134743234:** #378 (mörkt hosttema, Auto/Light/Dark i Settings → Appearance, starkare konturer), #379 (Play-knapparna på rubrikraden, ikonläge på små skärmar), #381 (tom frågekö), #382/#383 (viewerpanelen). Prov återstår, särskilt mörkt tema på iPad/iPhone (WebKit). #384 (fyllda knappar) och #386 (mörkare sida och kort, nivå A) har tillkommit. #380 lämnas tills vidare.
11. Framtida, utan körordning: #348, #349, #350, #360 och #351 väg 2 ("bara viewern", kräver ny regelpublicering). Nya önskemål registreras med ID före implementation.

## Kod och kontroller

- App: `buzzy-live-pilot/src/`. `client.js` hanterar Firebase; `bridge.js` kopplar spelgränssnittet till tillståndet; `connection.js` hanterar anslutningsåterhämtning.
- UI-generering: `buzzy-live-pilot/scripts/generate-ui.mjs`, `ui-batch-304-313.mjs`, `viewer-host.mjs` (hostens viewerpanel) och `host-fixes.mjs` (bl.a. Appearance-kortet och tom frågekö).
- AI-frågor (#387): `src/ai-questions.js` (flöde, nyckel i webbläsaren, låtsad klient via `window.__buzzyAiMock` bara på 127.0.0.1/localhost), sidkod i `scripts/ai-host-page.js` som `scripts/ai-host.mjs` infogar. Modell `claude-opus-5-5`, webbsökning `web_search_20260209`, strikta submit-verktyg, `fallbacks: "default"`.
- Hostens tema (#378): `src/host-theme.js` skapar det mörka temat vid körning ur sidans stilar under `:root[data-host-theme=dark]`. Nya ljusa färger i host-CSS får automatiskt en mörk motsvarighet; justeringar för mörkt läge görs i modulens `extras`. Play-radens ikonläge (#379) sköts i `src/host-layout.js`. Viewern är fristående: `src/viewer.js`, `src/viewer.css` och genererad `viewer.html`. Ändra aktiva transformations-/CSS-/JS-filer, inte frysta HTML-referenser i repots `buzzy-output/`.
- Layout/effekter: `src/room-ui.css`, `host-layout.js`, `host-markup.js`, `celebration.js`. Konfetti: 432 bitar, startfördröjning 0–360 ms. Uppflygning och dalning är separata tider.
- Lokala kontroller från `buzzy-live-pilot`: `npm run test:config`, `npm run test:pilot-ui`, `npm run test:viewer`, `npm run build:pilot`, `npm run test:pilot`. Skapa `reports/` om mappen saknas. Webbläsarprov använder `CHROMIUM_PATH`, i molnsessionen `/opt/pw-browsers/chromium`. Enbart återanslutning kan köras med `node scripts/generate-ui.mjs` följt av `node scripts/emulators.mjs reconnect`.
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

- **Före viewer (#347):** taggen `fore-viewer` på GitHub (skapad av användaren 2026-11-10) pekar på `9916e8f`. Appkoden där är identisk med den publicerade `c8267afe59a812ffa2ec1c7a08fb054591f92217` ([run42687931351](https://github.com/BadBagel47/buzzy/actions/runs/42687931351)); efterföljande commits fram till taggen rör bara dokumentation. Molnsessionen kan inte pusha taggar, så nya taggar skapas av användaren via Releases.
- **Backa:**
  - kod med `git revert` eller genom att återställa till taggen `fore-viewer`
  - Hosting via Firebase-konsolens rollback eller ny körning från taggen
  - regler genom att klistra in den sparade regeltexten (`ops/rules-evidence/`) i konsolen

## Viktiga gränser

Spelarvy och flera äldre förbättringar har fått positiv mobilåterkoppling, men markera inte varje specifikt prov som utfört utan underlag. Avsiktligt hostavslut stänger spelet för alla; nätavbrott/omladdning ska inte göra det. Nuvarande Firebase-identiteter är anonyma och lokal persistence används. Ingen analytics hittades vid kodgranskningen, men detta är inte en full granskning av faktisk lagring, leverantörsvillkor eller lagkrav. Automatisk gallring av övergivna rum är inte implementerad.
