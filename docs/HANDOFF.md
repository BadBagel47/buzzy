# Buzzy — läs först vid fortsatt arbete

Uppdaterad 2026-11-10. Läs därefter [arbetssättet](WORKING_AGREEMENTS.md), [planen](PLAN.md) och relevanta ID:n i [backloggen](BACKLOG.md). Senare användarinstruktioner har företräde. Äldre dokument som säger “senaste” kan beskriva tidigare faser.

## Aktuellt läge

- Arbetet kan utföras av olika AI-agenter. Alla följer [AGENTS.md](../AGENTS.md). Arbeta i en klon av `BadBagel47/buzzy`, gren `main`. Hämta senaste `main` och kontrollera `git status` före ändringar. Pusha för att något ska finnas kvar till nästa session.
- Senaste kodpublicering: `bdcc9b727a9ff547d6144b774e856885d23715bd`, [run42865760330](https://github.com/BadBagel47/buzzy/actions/runs/42865760330), status success, målet `live`. Att `buzzy.trythis.one/viewer` svarar med viewersidan verifierades 2026-11-10; det är en kontroll av vilken kanal som uppdaterades, inte ett funktionsprov. Innehåller #347 och #352 samt tidigare paket (#344–346 i run42687931351). Senare dokumentationscommits kan finnas på main utan ny publicering.
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
5. #347 viewer och #352 join-skärm är publicerade till live i [run42865760330](https://github.com/BadBagel47/buzzy/actions/runs/42865760330). Reglerna (hash `6fbb6b7fe7d13d93ce0393cb9cc16bb0ffa4fcdede0a1550cd34349cebfea5f9`) är publicerade i Firebase-konsolen och konsolkopian är uppdaterad; de tidigare reglerna finns i taggen `fore-viewer`. Användaren uppger att allt verkade fungera vid ett första prov. Ett uttryckligt prov på riktig TV eller projektor, med fråga, buzz, leaderboard, konfetti och join-skärm, är inte bekräftat. #348–#351 är framtida steg.

## Kod och kontroller

- App: `buzzy-live-pilot/src/`. `client.js` hanterar Firebase; `bridge.js` kopplar spelgränssnittet till tillståndet; `connection.js` hanterar anslutningsåterhämtning.
- UI-generering: `buzzy-live-pilot/scripts/generate-ui.mjs`, `ui-batch-304-313.mjs` och `viewer-host.mjs` (hostens Viewer screen-sektion). Viewern är fristående: `src/viewer.js`, `src/viewer.css` och genererad `viewer.html`. Ändra aktiva transformations-/CSS-/JS-filer, inte frysta HTML-referenser i repots `buzzy-output/`.
- Layout/effekter: `src/room-ui.css`, `host-layout.js`, `host-markup.js`, `celebration.js`. Konfetti: 432 bitar, startfördröjning 0–360 ms. Uppflygning och dalning är separata tider.
- Lokala kontroller från `buzzy-live-pilot`: `npm run test:config`, `npm run test:pilot-ui`, `npm run test:viewer`, `npm run build:pilot`, `npm run test:pilot`. Skapa `reports/` om mappen saknas. Webbläsarprov använder `CHROMIUM_PATH`, i molnsessionen `/opt/pw-browsers/chromium`. Enbart återanslutning kan köras med `node scripts/generate-ui.mjs` följt av `node scripts/emulators.mjs reconnect`.
- `test:production` testar vanliga `dist/`; kör `npm run build` först. `build:pilot` skapar `dist-pilot/` och uppdaterar inte `dist/`.
- Emulator-/UI-prov delar lokala portar och genererade filer: kör inte flera sådana sviter eller ett pilotbygge samtidigt med ett pågående emulator-UI-prov.

## Publicering och åtkomst

- Projekt `buzzy-197dc`, RTDB `https://buzzy-197dc-default-rtdb.europe-west1.firebasedatabase.app`, Spark. Preview använder riktig Auth och databas; molnspel använder riktig kvot.
- Workflow: https://github.com/BadBagel47/buzzy/actions/workflows/firebase-pilot.yml . Nuvarande manuella steg: main, rules_source=console och aktuell konsolkontroll innan console_rules_confirmed. Se [WEBBSETUP.md](WEBBSETUP.md).
- Granskad kanonisk regelhash, kontrollera mot evidensen före återanvändning:

```text
6fbb6b7fe7d13d93ce0393cb9cc16bb0ffa4fcdede0a1550cd34349cebfea5f9
```

Den här hashen gäller reglerna med viewer-stöd (#347/#352), publicerade i konsolen 2026-11-10. De tidigare reglerna hade hashen `148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a` och finns i taggen `fore-viewer`.

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
