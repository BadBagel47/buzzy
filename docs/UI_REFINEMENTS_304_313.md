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
