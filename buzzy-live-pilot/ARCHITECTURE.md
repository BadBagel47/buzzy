# #287 — gränssnitt, transport och auktoritet

V7.52 behåller prototypens befintliga komponenter och rörelser. Den fristående filen har explicit `codeSource:demo`; de genererade nätverkssidorna nollställer demoidentiteter/frågor före rendering och väntar på verifierad Auth/rumstillhörighet. Bara servergodkänt skapande/anslutning ger ett rum. Rollen i fliklagringen väljer sida, inte behörighet; värdroller verifieras med ägarskap och spelare med UID-medlemskap. Ingen B7K4-fallback.

Bron fångar spelkommandon före lokal simulering. Under en pågående skrivning hålls egen optimistisk SDK-visning tillbaka tills svaret kommit; andra klienter får bara servergodkända ändringar. Klick/tangentbord blockeras under nätverkslås med separata attribut så att återanvända knappar/modaler behåller sin egen disabled-status och kan låsas upp igen. Lokal navigation och spelarens egna panelval behöver inga serverkommandon.

## Datamodell

Grundmodellen meta/control/seats/members/scores/attempts/excluded är separat vidareutvecklad från #286. Samma oföränderliga UID-buzz och atomiska Timed-räknare ger permanent serveraccepterad ordning. First har ett vinnarfält. Medlemsplatserna är fortfarande 12 i detta prov. Spelaren kan inte skriva annans buzz, poäng, värdstatus eller privata data.

`control` bär serverstart, eventuell stängningstid, mode/timer/duration, omgång/försök, poängvillkor och version. Stängningstiden fryser timerns återstående värde även vid senare metadataändringar/reload. Faser och versionsvillkor hindrar tyst överskrivning av konkurrerande värdändringar. Poäng-/repeat-inställningar kan justeras av quizmastern enligt UI:t; tid/läge ändras före start. Timer av eller 1–600 s.

`judgments/UID` är en ny oföränderlig dom med faktisk delta, före/efter och serverns tid. Poäng/domen/exkludering/fas skrivs atomiskt. Timed låter värden välja och bedöma flera obesvarade köposter även efter ett korrekt svar, som i prototypen. First har bara en buzz per försök. Värden är betrodd poängadministratör; dessa flöden ska inte beskrivas som ett skydd mot en avsiktligt manipulerande quizmaster.

`private/ui` innehåller hostens bibliotek, interna titlar, full frågetext och beständiga UI-inställningar. `presentation` innehåller endast aktuellt tillåtet spelartext-/bildinnehåll, omgång/försök, visad-flagga och ett innehållshash för preload. Host-only-text är tom i den publika projektionen, och interna titlar skickas aldrig dit. Bild är synlig enligt befintlig produktregel. Inloggade före join får bara den lilla control-/seats-metadata som behövs för anslutning, samt presentation/shown (bool); hela presentationen kräver medlemskap.

`loads/HASH/UID` skrivs endast av den egna identiteten. Bilden laddas/dekodas i den verkliga spelarwebbläsaren före ready/failed, inte genom en värdsimulerad timeout. Värden får en sammanställning; endast aktuellt hash lyssnas på. Tidigare bildlöften kan inte kvittera nästa fråga.

`selection` förmedlar aktivt värdval i kön. `settings` bär gemensamma visnings-/ljudval; spelarens egna paneler och avvisad leaderboard är lokala. En ny delning öppnar igen utan att gamla avvisanden ligger kvar.

`moderation/UID` bär kick/ban/active. Kicked kan återansluta med samma identitet, banned måste avbannas av värden. Ny gäst under pågående/visad fråga får nästa omgång som start. Detta är en identitets-/rumsregel, inte en kontoregistrering.

`adjustments/UID` är senaste manuella poänghändelsen. Den länkas till korrekt före/efter-poäng, får ID/server-tid och ger en effekt på rätt enhet en gång. Ny dom och justering identifieras med egna händelser i stället för att gissa från varje score-snapshot. `celebration` är senaste värdstartade firandet; en ny klient/reload återspelar inte gammalt firande. Den gamla konfettiimplementationens riktning/återtrycksfel väntar under #283/#284.

`archive` är endast för värden. Snapshot sparas vid avancering/Retry; aktuellt serverförsök förblir beständigt i attempts. Historik läser arkiv på begäran och sammanfogar tidigare försök med det aktuella, även efter reload. End game raderar uttryckligen hela rummet. Ingen automatisk TTL/städningsfunktion eller 14-dagarsgaranti finns i Spark-provet.

## Tid, livscykel och kvot

Klockan använder serverstart och `.info/serverTimeOffset`. Visningen uppdateras lokalt. Aktiv värd skickar en enda Expire; serverreglerna nekar alltid sena buzzar. En spelare som når den redan serverbestämda deadlinen låser sin visning lokalt även om värdens sida är fryst, utan en egen timerskrivning. Detta ändrar inte serverkontrollfältet; värden kan föra fasen vidare när den återupptas. First-vinnare före deadline behåller sitt låsta svarstillstånd.

Statiska rumsvärden och aktuellt försök/preload lyssnas på via en delad anslutning per vy. Initiering väntar på första kompletta snapshoten. Gamla försökslyssnare kopplas bort; ett rättighetsfel för föregående försök får inte felaktigt koppla ned den nya vyn. Auth UID bevaras i webbläsaren över reload. Leave kopplar bort och rensar flikens rumsval.

Inga tickskrivningar, inget periodiskt databas-pollande och inget bibliotek-/historik-broadcast till spelarna. Förändrade frågor/inställningar sparas först när de ändrats. Riktiga laddningskvittenser och effekter är små, enstaka händelser. Alla payloadmätningar är separata från faktisk fakturering, HTTPS/Auth/Hosting/TLS och verklig nätlatens. #286:s 39-procentsjämförelse är kvar som historiskt prov av det mindre spåret, inte ett nytt löfte för denna större integration.

## Återgång och kvarvarande livearbete

Koden och reglerna är strikt bundna till demo-buzzy-ui på loopback. Varken användarens offentliga config eller .firebaserc aktiverar live. Ingen Cloud Function, Admin-SDK, hemlig owner-token eller billing behövs här. Verklig molnregelgranskning/driftsättning, nåbar HTTPS/QR och faktisk mobilprovning är nästa separata paket. Aktuella testutfall finns i reports/status.json och relaterade rapporter.

Bevarade syskon: buzzy-network-lab (#277), buzzy-spark-lab (#286), v7.51/startsida v1 i buzzy-output. Den fristående v7.52-filen kan fortsatt användas för Design Lab och testknappar, medan nätverksvägen alltid använder verkliga lokala klienter. Historiska färdiga designreglage är inte återinförda.

## #288 — miljöadapter och pilot

Spelmodell, databasregler och visningsbro är oförändrade från #287. Ny src/runtime-config.js väljer ett fast byggmål före SDK-initiering. Pilot bygger med det verkliga projektets config och ingen emulatoranslutning. Standardmålet för lokal utveckling är uttryckligen emulator, inte en fallback vid livefel. Flytt från livscykelfrysning till Debugger.pause i testet gör att värdens JavaScript faktiskt pausas; alla ursprungliga assertions om serverfas/deadline/0 skrivningar är kvar.

HTTPS-fixtureprovet fångar alla externa HTTP/WebSocket-anrop och nekar Auth. Det bevisar rätt API-key/routing och att nätverksfel aldrig ger ett demorum. Molnets Auth, faktisk DNS/Hosting-site och RTDB-regler är inte lästa eller ändrade. Inloggning/nätåtkomst och en läsande inventering återstår innan publicering. Hosting-preview är inte en isolerad databas. Se README för konkreta gränser.

## #347/#352 — viewer-skärm

`/viewer?room=KOD` är en fristående, skrivskyddad sida för TV eller projektor (`src/viewer.js`, `src/viewer.css`, genererad `viewer.html`). Den bygger inte på den frysta spelarsidan, men använder spelarvyns mörka färger. Rumskoden räcker för att öppna den, alltså samma nivå som för spelare. En hemlig länk är framtida #348.

- **Registrering:** viewern tar en av fyra platser i `viewerSeats/0..3` och skriver `viewers/UID = {at, slot}`. Den skriver inget i `members`, `scores` eller `seats` och syns därför aldrig som spelare, i leaderboard, autostopp eller förladdning. `onDisconnect` frigör platsen. Efter återanslutning registrerar viewern sig igen och startar om sina lyssnare.
- **Läsrätt:** läsvillkoret för spelare utökas med registrerade viewers för `members`, `scores`, `attempts` (aktuellt försök), `excluded`, `presentation`, `settings`, `selection`, `moderation`, `celebration` och `adjustments`. `meta`, `private`, `archive`, `loads` och listan `viewers` (endast värden) är oförändrat stängda. En viewer får inga skrivrättigheter till spelets tillstånd, bara till sin egen registrering.
- **Innehåll:** värden väljer innehållet i Settings → Viewer screen med `settings.viewerQuestion`, `viewerTimer`, `viewerBuzzOrder`, `viewerLeaderboard` och `viewerCelebration`. Saknade värden räknas som på. Frågetext visas bara när den är synlig för spelarna, och namn i buzzordningen följer `buzzOrderNames`.
- **Join-skärm (#352):** `settings.viewerJoinScreen` visar QR-kod till `/?room=KOD`, domänen och rumskoden. Den slås på och av i Settings eller med knappen i delningsvyn.
- **Värden:** ser endast antalet viewers, via en lyssnare på `viewers` som bara ägaren får läsa.
