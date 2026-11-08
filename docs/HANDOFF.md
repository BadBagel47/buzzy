# Buzzy — läs först vid fortsatt arbete

Uppdaterad 2026-11-08. Läs därefter [arbetssättet](WORKING_AGREEMENTS.md), [planen](PLAN.md) och relevanta ID:n i [backloggen](BACKLOG.md). Senare användarinstruktioner har företräde. Äldre dokument som säger “senaste” kan beskriva tidigare faser.

## Aktuellt läge

- Aktiv arbetskopia: `/workspace/buzzy`, gren `main`, repo `BadBagel47/buzzy` på GitHub. Kontrollera `git status` före ändringar.
- Senaste verifierade kodpublicering: `168ca076d473eab8ebcad3b7f5f6833a88d26a78`, [run42471953022](https://github.com/BadBagel47/buzzy/actions/runs/42471953022), status success. Senare dokumentationscommits kan finnas på main utan att kräva ny pilot.
- Spellänk: https://buzzy-197dc--pilot-mrst5vi1.web.app . Kanalen har en dags giltighet per publicering; kontrollera status före påstående om tillgänglighet.
- Senaste kodpaket: #293 tidig återkoppling/återförsök efter cirka 4 s och automatisk återhämtning efter nät-timeout; #305 gemensamt 14 px kortavstånd och reserverad Play-radhöjd; #320 samma kortgap under/efter vyanimation.
- Questions-hoppet reproducerades som 1 px skillnad för andra kortet. Det gamla provet mätte endast första kortet; nytt prov mäter även Question queue. Gemensam kortplacering verifierades på 320/390/430/768/1280 px.
- Återanslutning verifierades lokalt med pausad hostflik och fördröjd/blockerad spelartransport, samma identitet/rum och automatiskt återförsök efter timeout. Verklig rotorsak till det ursprungliga Android/Brave-utfallet är inte säkert fastställd.
- Senaste verifiering: konfiguration 5/5, pilot-UI 5/5 (inklusive återanslutning), pilotbygge och interceptat HTTPS-prov. Aktuell fysisk wifi/5G- och layoutkontroll återstår.
- Ingen pågående appändring är beställd i den senaste dokumentationsuppgiften. Nya önskemål samlas före körbesked.

## Nästa steg och pausade spår

1. Invänta mobilåterkoppling på #293/#305/#320 och övriga nyligen publicerade UI-ändringar. Bevara nya besked med berört ID.
2. #290 vibration: 40 ms begärs vid spelarens aktiva buzztryck. Brave gav ingen märkbar vibration; användaren vill först prova Chrome. Pausat, ändra inte nu.
3. #331 host-/admininloggning: pausad i väntan på användarens engångslänkslösning från ett annat projekt. Ingen Cloudflare Access/Firebase-inloggningsvariant är vald för implementation.
4. #332 integritetsinformation och gallringsplan: registrerad inför publik lansering, ingen implementation eller full juridisk bedömning gjord.
5. Nästa lediga ID hämtas alltid från backloggen.

## Kod och kontroller

- App: `buzzy-live-pilot/src/`. `client.js` hanterar Firebase; `bridge.js` kopplar spelgränssnittet till tillståndet; `connection.js` hanterar anslutningsåterhämtning.
- UI-generering: `buzzy-live-pilot/scripts/generate-ui.mjs` och `ui-batch-304-313.mjs`. Ändra aktiva transformations-/CSS-/JS-filer, inte frysta HTML-referenser i repots `buzzy-output/`.
- Layout/effekter: `src/room-ui.css`, `host-layout.js`, `host-markup.js`, `celebration.js`. Konfetti: 432 bitar, startfördröjning 0–360 ms. Uppflygning och dalning är separata tider.
- Lokala kontroller från `buzzy-live-pilot`: `npm run test:config`, `npm run test:pilot-ui`, `npm run build:pilot`, `npm run test:pilot`. Enbart återanslutning kan köras med `node scripts/generate-ui.mjs` följt av `node scripts/emulators.mjs reconnect`.
- `test:production` testar vanliga `dist/`; kör `npm run build` först. `build:pilot` skapar `dist-pilot/` och uppdaterar inte `dist/`.
- Emulator-/UI-prov delar lokala portar och genererade filer: kör inte flera sådana sviter eller ett pilotbygge samtidigt med ett pågående emulator-UI-prov.

## Publicering och åtkomst

- Projekt `buzzy-197dc`, RTDB `https://buzzy-197dc-default-rtdb.europe-west1.firebasedatabase.app`, Spark. Preview använder riktig Auth och databas; molnspel använder riktig kvot.
- Workflow: https://github.com/BadBagel47/buzzy/actions/workflows/firebase-pilot.yml . Nuvarande manuella steg: main, rules_source=console och aktuell konsolkontroll innan console_rules_confirmed. Se [WEBBSETUP.md](WEBBSETUP.md).
- Granskad kanonisk regelhash, kontrollera mot evidensen före återanvändning:

```text
148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a
```

- Ingen databasregel-/billing-/domänändring ingår automatiskt i Hosting-publiceringen. Regeln ovan är ingen ny verifiering av aktuellt molntillstånd.
- Git-push fungerar i senaste sessionen; Actions-dispatch saknade tillgängligt verktyg/fungerande auth. Användaren gör vid behov Run workflow i webben. Kontrollera möjligheterna på nytt vid ändrad miljö.
- Publik status kan läsas från GitHubs workflow-/Actions-sida. Om workflowadressen ger 504 har `/BadBagel47/buzzy/actions` fungerat som reserv. Bekräfta både success och commit i run-sidan innan du rapporterar publicerat.

## Viktiga gränser

Spelarvy och flera äldre förbättringar har fått positiv mobilåterkoppling, men markera inte varje specifikt prov som utfört utan underlag. Avsiktligt hostavslut stänger spelet för alla; nätavbrott/omladdning ska inte göra det. Nuvarande Firebase-identiteter är anonyma och lokal persistence används. Ingen analytics hittades vid kodgranskningen, men detta är inte en full granskning av faktisk lagring, leverantörsvillkor eller lagkrav. Automatisk gallring av övergivna rum är inte implementerad.
