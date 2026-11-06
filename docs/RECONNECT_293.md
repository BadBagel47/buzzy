# #293 — återanslutning och väntelägen

**Aktuellt: återöppnat efter misslyckat mobilprov.** Användaren stängde den gamla fliken men en ny fastnade redan vid första rumsskapningen efter run42234619437. CSP-korrigeringen nedan är nu publicerad i run42248198398; reservtransportprovet passerade även i CI. Nytt mobilprov återstår.

Användaren godkände implementation med ”Vi fortsätter med att lösa 293 först. Kör”. Felet rapporterades från Android/Brave vid wifi → 5G: återanslutning uteblev även efter återgång till wifi. Reload fastnade i ”Connecting to your room…”, visade Design Lab-märkning och ett nytt rum fastnade i ”Creating room”. Exakt orsak till det enskilda mobilavbrottet är inte oberoende fastställd.

## Ändringen

- Anslutningen lyssnar på online/offline, nätbyteshändelser där Network Information API finns, återkomst från bakgrunden och återställning från browserns sidcache. Vid utebliven databasanslutning startas ett nytt anslutningsförsök med ökande intervall 8–30 sekunder. En frisk anslutning gör inga sådana periodiska återanslutningar. Inga extra databasläsningar eller skrivningar används för hälsokontrollen.
- Auth/start och läsningar får en tidsgräns på 15 sekunder per väntesteg, och förstasidans samlade väntetid är 20 sekunder. Därefter går det att försöka igen. På rumsvyn finns Try again vid anslutningsproblem. Existerande rum och anonym identitet återanvänds.
- Misslyckad klientinitiering fastnar inte som en permanent avvisad, cachad Promise. Ett ännu pågående autentiseringsförsök delas även när UI:s väntetid passerat.
- En timeout i UI avbryter inte SDK:s eventuellt köade skrivning. Förstasidan återanvänder samma pågående operation och ett sessionssparat skapande-ID. Vid återförsök eller reload ger samma ID samma kod och kvitto. Transportfel byter inte rumskandidat; en bekräftad kodkollision kan fortfarande välja nästa kod.
- Host/Player-titel och märkning finns i HTML redan före anslutning. Utvecklingsläge är inte en reservväg vid anslutningsfel. Äldre uppdateringar får inte åter visa Connected efter ett definitivt prenumerationsfel; återförsök kontrollerar rummet på nytt. Ett avslutat rum skapas inte av återanslutningen.

#292:s typografiarbete och #294:s omformning av sidhuvudet ingår inte. Den tidigare #291-knappfixen är kvar. Try again använder befintlig knappstil och visas i anslutningsraden vid behov.

## Verifiering och publicering

Regressionerna ligger i `buzzy-live-pilot/tests/reconnect.integration.mjs` och `tests/connection.test.mjs`. Emulatorproven använder demo-projekt på loopback, inte Buzzy-projektets gratiskvot. De ingår i appens `npm test` respektive `npm run test:config`. Konkreta slutresultat sparas i `reports/reconnect-293.json` i reporoten när körningen är klar.

Implementation och lokala prov ersätter inte Android/Brave-prov med verkliga wifi/5G-byten. Fixen har nu publicerats genom det manuella pilotflödet på revision853a95c. Inga nya regeländringar behövdes för denna fix.

Slutresultat: 28 emulatorprov, 5 konfigurations-/återanslutningsprov, 1 interceptat HTTPS-prov mot den byggda piloten och 20 operativa prov passerar. Pilotbygget lyckades. Rapporten i reporoten bevarar käll- och byggfilshashar samt skillnaden mellan lokala prov och ännu ej gjort mobilprov. Tidigare misslyckade utvecklingskörningar ledde till korrigerad testtransport, korrekt round/attempt i testets rumsstädning och bibehållen hantering av utfasade attempt-prenumerationer; ovanstående resultat är från slutkörningarna.

## Publicerat resultat

[Run42234619437](https://github.com/BadBagel47/buzzy/actions/runs/42234619437) är success. Verify-jobb127948919611 och pilot-jobb127949244717 har enbart success-steg. Källa 853a95c95dd0e15ed92c238d2471add21cb1c7e5. Hosting-publiceringssteget avslutades2026-11-06T14:32:15Z. Detta verifierar publiceringen, inte faktiska wifi/5G-byten. Den tidigare användarlämnade länken till samma kanal är https://buzzy-197dc--pilot-mrst5vi1.web.app. Exakt ny expireTime och sidan via HTTP är inte kontrollerade från Codex. Stäng den gamla fliken och öppna länken på nytt inför mobilprovet.

## Följdfix: sidans CSP blockerade reservtransporten

Firebase SDK sparar previous_websocket_failure i browserns lokala lagring. Ett nytt fönster kan därför börja med long polling. Den vägen lägger till script-taggar och en dold iframe för RTDB:s /.lp-protokoll. Den gamla Hosting-policyn tillät databasens connect-src men inte dess script-src/frame-src. De första emulatorproven saknade Hosting-CSP och det första byggda HTTPS-provet avbröt vid Auth-felet innan databasen initierades. De kunde därför inte fånga kombinationen.

Nya transport-csp.integration.mjs kör verkliga SDK:t mot lokala emulatorer med översatt Hosting-CSP. Samma test reproducerar gamla policyns scriptblockering och timeout, och verifierar att nya policyn skapar rum, återansluter och laddar om samma rum/identitet utan CSP-fel när WebSocket är otillgängligt. Chromium behöver i just denna syntetiska loopback-fixtur local-network-access-testbehörighet; ingen sådan inställning görs i appen eller produktionswebbläsaren.

Korrigeringen tillåter enbart HTTPS-skript och iframes på /.lp under *.europe-west1.firebasedatabase.app, samt same-origin-iframe. Regionalt servervärdnamn kan växla, så endast ursprungligt databasnamn skulle inte räcka. Ett läsande start-handslag mot den redan tillåtna databasen gav HTTP200 och regional shardhost; inga autentiseringar eller rumsoperationer gjordes mot riktiga projektet. Session-ID:n/exporterade nycklar ingår inte i rapporten.

Det nya provet ingår både i npm test och det separata npm run test:transport, som GitHub-pilotens verify-jobb nu måste köra före artifact-uppladdning och före Google-publiceringsbehörighet. Den separata lokala körningen passerade, liksom config5, byggt interceptat HTTPS1, operations20 och pilotbuild. De tidigare 28 emulatorposterna gäller oförändrad app-JS; de kördes inte om enbart för headerändringen. Se reports/transport-csp-293.json. Ingen ny regelpublicering eller miljöändring krävs. Fysisk Android/Brave-verifiering återstår efter nästa deploy.

Senaste publicering: https://github.com/BadBagel47/buzzy/actions/runs/42248198398, källa5550bcd771e759c791c3ebeb497119d8bbf8bf47. Verify och pilot har enbart success-steg inklusive nya CSP-reservtransportprovet. Publiceringssteget avslutades2026-11-06T16:01:28Z. Ingen fysisk Android/Brave-verifiering påstås.

## Senaste återfall: spelarens reload

Efter publicering av #295–#297 rapporterar användaren att en omladdning av spelarvyn fastnar på Connecting to your room… med enbart Leave room på den mörka sidan. Rollen är player enligt aktuell layout, ingen labmärkning visas. #293 är återöppnat; orsak, hostens fortsatta närvaro och väntetid är ännu okända. Frågat om hosten är kvar och om något ändras efter30sekunder. Tidigare gröna emulatorprov ersätter inte detta verkliga mobilutfall. Endast dokumentation av återfallet nu.

Användarens svar: hosten låg i en annan flik på samma mobil och visade Connected när den fliken öppnades igen. Väntade inte30sekunder. Det är en upplevd för lång/tom laddning, inte bevisad 30sekunders hängning. Spelaren ska återställas snabbt och erbjudas återkoppling/återförsök tidigare. En vilande hostflik ska inte behöva vara aktiv för att läsa tillbaka ett befintligt spelarrum.
