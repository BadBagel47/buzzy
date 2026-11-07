# UI- och effektpaket #304–313 samt #283–284

Användaren godkände samtliga tolv punkter med ”Kör de i listan”. #293 (återanslutningsupplevelse) och #290 (vibration) ligger kvar separat.

## Resultat

- #304: bottenknapparnas bredder följer innehållet med gemensam luft och centrerad ikon/text. Den aktiva markeringen mäts mot den verkliga knappen och animerar både position och bredd. Avbruten/snabb navigation börjar från markeringens aktuella läge. Vid små bredder ligger ikon/text ovanpå varandra med fortsatt olika knappbredder.
- #305: Play, Players, Questions och Settings använder samma vertikala rubrikinpassning, även när Play har knappar till höger.
- #306: Quick Play-utfällning hanteras lokalt och har en faktisk höjdanimation. Panelen och dess innehåll behålls vid nätuppdateringar; stängande innehåll finns kvar tills kollapsen är klar. Snabba upprepade öppningar/stängningar lämnar inga överblivna paneler.
- #307: hostinnehållet uppdateras i befintliga DOM-noder inom samma vy. Poängeditorns bakgrund och leaderboardens hostpanel behålls vid uppdateringar; den avsiktliga opacity-sänkningen vid byte av poängflik är borttagen. Fokus och textutkast bevaras. Byte till en annan huvudvy har kvar den befintliga vyanimeringen.
- #308: Settings har inte längre någon Show QR-knapp. Sidhuvudets QR-knapp och dess fullskärmsvy finns kvar; det tidigare QR-provet fortsätter avkoda den riktiga bilden oberoende.
- #309: Game and room, Display och Sounds and effects börjar hopfällda. Användarens valda öppningsläge behålls under fortsatt användning.
- #310–311: en enda knapp med texten Launch celebration for all finns under Visual effects. Den använder vanliga hostknappsfärger. Session and history har historikfunktionen kvar.
- #312: End game har en röd normal kant och röd text med bibehållen fokusmarkering och bekräftelse.
- #313: alla fyra hostvyer reserverar den uppmätta bottenmenyhöjden samt samma slutmellanrum som kortmellanrummet. Den gamla separata slutspacern är borttagen. Utrymmet följer ändrad skärmhöjd, menyhöjd och tillgänglig visual viewport; safe-area-padding ingår i uppmätt menyhöjd.
- #283: två konfettiutkast stiger från de nedre hörnen in mot mitten, med befintlig färgpalett och begränsad partikelmängd.
- #284: en ny utlösning avbryter föregående omgång och dess städtimer. En äldre timer kan inte kapa en ny omgång; sista omgången städas. Reducerad rörelse och avstängt firande respekteras.

Källor: scripts/ui-batch-304-313.mjs kompletterar nätgeneratorn utan att ändra den frysta prototypen. src/host-layout.js hanterar menyns mått, src/host-markup.js behåller värdpaneler vid uppdatering och src/celebration.js hanterar konfetti. Den befintliga nätbryggan kopplar visuella händelser till samma auktoritativa spelkommandon som tidigare. Inga databasregler, behörigheter, rumskoder, poängregler eller nätåteranslutningsregler ändras.

## Verifiering

Riktade browserprov har passerat för 320×640, 390×600, 390×844, 430×932, 768×1024 och 844×390: olika knappbredder, markeringens verkliga geometri och interpolation, rubrikernas höjd samt fri slutmarginal. Proven behåller också panelnoder/fokus/utkast genom renderingar, växlar poäng och delning upprepat, samplar konfettins faktiska animationsbanor och testar upprepade utlösningar över den gamla städtidpunkten. Testfallen finns i tests/ui-refinements.integration.mjs och körs även i pilotens verifieringsjobb.

Slutkontrollerna är gröna: 32 poster i full emulatorregression, 5 config/recovery, 20 operationsskydd, ett byggt produktionsspel-/layoutprov, ett avlyssnat HTTPS-pilotprov samt slutlig pilot-UI-gate med 4 prov. Efter de sista skydden för stängningskloner och övergångssnapshots kördes hela native UI-spelregressionen (15 poster), riktat UI-prov, produktionsbygge/-spel, HTTPS-provet och pilot-UI-gaten grönt igen. Se reports/ui-refinements-304-313.json och reports/ui-refinements-validation.log. Publicerat i [run42347839035](https://github.com/BadBagel47/buzzy/actions/runs/42347839035), källa 97d0b4aed18229b17b786a58a9580ac1d792df76. Samtliga steg i båda jobben är gröna, inklusive förkontroll, UI-regression och Hosting-publicering (klar 2026-11-07T06:40:16Z). Se reports/ui-refinements-publication.json. Ingen ny regelpublicering behövdes. Alla körda browser-/spelprov använder lokala emulatorer eller avlyssnade HTTPS-fixturer, inte riktiga Buzzy-rum. Verkligt Android/Brave-prov med webbläsarens verktygsrad och riktiga safe-area-insets behöver göras efter publicering; viewportproven ersätter inte det.

## Mobilåterkoppling efter publicering

#313 är återöppnat: användarens Android/Brave-bilder visar att bottenmenyn ibland lyfts från nederkanten när man skrollar upp, och att en kort Questions-vy med tom kö får onödig skrollning. Tidigare automatiska prov är fortfarande giltig historisk evidens för de körda viewportfallen, men täckte inte detta verkliga browserförlopp. Se BACKLOG.md. Ingen ny appändring genomförd för återkopplingen ännu.

Även #304 och #305 är återöppnade från fortsatta mobilbilder: Play-knappens text upplevs ocentrerad; rubrik och första kortets start behöver samordnas över alla vyer och placeras något lägre även i Play. Basens olika .appbar-marginaler (19px generellt, 12px i Play) kvarstod efter ändrad minhöjd. Tidigare prov mätte rubrikboxens center men inte första kortets start. Se BACKLOG.md; ingen ny UI-rättning genomförd ännu.


## Uppföljning efter Android/Brave-bilderna — #304, #305 och #313

Efter det senare ”Kör” är källan justerad: Play-etiketten flyttas till optiskt centrum i knappens visuella grupp utan att ändra innehållsanpassade knappbredder eller den uppmätta markeringen. Alla hostvyer får samma appbar-undermarginal; Play hade tidigare 12px mot 19px i övriga vyer. Hela rubrik-/kortinnehållet sänks gemensamt 3px. Bottenmenyn ligger vid `bottom:0`; JavaScript flyttar den inte längre när `visualViewport` scrollar. Den extra 100vh-minhöjden tas bort för hostläget, och innehållets slutreserv består av den uppmätta menyhöjden plus 14px.

## #314 — bredare konfetti

Partikelmängden ökas från 64 till 96. Startpunkterna är fortsatt de nedre hörnen; banorna sprids bredare över X-led och högre över skärmen, och bitarna ändras måttligt från 8×14 till 9×16px. Tiden till banans topp behåller 800–1000ms. Nedfärden får 1100–1350ms genom WAAPI-offsets och städtimern följer den nya sluttiden. Av/på, reduced-motion och skydd mot äldre timers som rensar en ny effekt behålls.

## #315 — avstånd i Players-kort

Tilläggspaddingen för tomma direkta `.muted`-texter i Players-kort tas bort. Regeln är avgränsad till `.dynamic-player-card` och träffar inte Settings-accordionernas inre avstånd eller öppna/hopfällda layout, som användaren uttryckligen vill behålla.

Vid registreringen av uppföljningsändringarna hade de ännu inte verifierats eller publicerats; statusen uppdateras i avsnittet nedan. Den tidigare gröna verifieringshistoriken gäller källan `97d0b4a` och ersätter inte kontroll av uppföljningen. Verklig Android/Brave-kontroll av verktygsrad och safe-area återstår.


## Uppföljningsbatchen publicerad

GitHub Actions [run42370960695](https://github.com/BadBagel47/buzzy/actions/runs/42370960695) byggde och verifierade källan `975b94b0b8f28a75ac0043037b0d58fc174793c0`. Verify-jobbets 14 steg och pilotjobbets 15 steg passerade. Hosting-publiceringen slutfördes 2026-11-07T12:08:37Z till den befintliga pilotkanalen: https://buzzy-197dc--pilot-mrst5vi1.web.app. Den här körningen publicerade Hosting; inga databasregler ändrades. Automatiska CI-kontroller passerade, men verkligt Android/Brave-prov av bottenmenyn, scrollning och spacing återstår.
