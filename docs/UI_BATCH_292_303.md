# Samlat UI-paket #292–303

Användaren godkände körningen med ”Kör dem”. Paketet omfattar #292, #294, spelarstil i #296 samt #298–303. #293:s upplevda spelaråteranslutning är fortfarande ett separat öppet funktionsärende.

## Ändringar

- #292: hostens sekundära text får en gemensam miniminivå på 14 px, även i bottenmenyn, Players, frågealternativ och Settings. Samma CSS-variabel används över vyerna. Rubrikhierarkin behålls.
- #294: HOST-märkning och separat normal statusrad ersätts av ett samlat sidhuvud med logotyp, högerställd Room/Connected och tre 44-pixelsknappar för QR, kopiering av länk och lämna. Fel och återförsök finns kvar i statusytan.
- #296: spelarens gemensamma bekräftelsedialog använder nu den mörka spelarpaletten. Fokusfälla, Escape, avbryt, stängningsanimation och bekräftelsebeteende återanvänds.
- #298: liverutan ligger längst ner i tillgänglig spelaryta. En ResizeObserver anpassar den cirkulära buzzern och dess befintliga inre innehåll efter både bredd och höjd. Kort liggande skärm kan skrolla utan överlapp. Samma buzzerknapp och fokus bevaras vid renderingar.
- #299: en korrekt log-out-SVG används för både host och spelare, i respektive färgpalett.
- #300: hosthuvudet och Settings öppnar samma heltäckande mörka delningsskärm, med riktig QR, aktuell webbadress och fyrteckenskod. QR skapas lokalt med en låst version av qrcode-generator, som laddas först när skärmen öppnas. Ingen extern QR-tjänst eller Firebase-skrivning behövs. Inbyggd dialog ger topplager/isolering, kompletterat med Tab-fälla, Escape och fokusåtergång även efter uppdaterat hostinnehåll. Länkkopiering använder samma URL från alla ingångar; själva adressen kan också markeras eller öppnas i en ny flik.
- #301: Settings första kortrubrik heter Room information och använder samma rubrikstorlek som Room settings.
- #302: rumskod och rumslivstid i informationsrutan har samma värdestorlek och normal teckenbredd.
- #303: hela inkommande/utgående hostvyn förflyttas med viewportens bredd och klipps vid skärmkanterna. Korten får inga egna inträdesanimationer. Slutliga marginaler, maxbredd, riktning och reduced motion behålls.

Källan ligger i generatorn, src/bridge.js och nya src/room-ui.js / src/room-ui.css. Den frysta fristående prototypen är orörd. Nya regressioner finns i tests/room-ui.integration.mjs och ingår även i pilotens befintliga verifieringsjobb. jsQR används bara vid test för att oberoende avkoda den faktiskt renderade QR-bilden.

## Verifiering och publicering

Slutkontrollerna är gröna: 31 poster i emulatorregressionen, 5 config/recovery, 20 operationsskydd, ett byggt produktionsspel-/layoutprov och ett avlyssnat HTTPS-pilotprov. Det slutliga pilot-UI-jobbet har 3 gröna prov (lämna-rum, UI-paketet och CSP-fallback), även efter de sista typografi- och laddningskontrolljusteringarna. Se reports/ui-batch-292-303.json och reports/ui-batch-validation.log. Tester använder lokala Firebase-emulatorer och avlyssnade HTTPS-fixturer; de skapar inga riktiga Buzzy-rum. Fysiskt mobilprov återstår efter publicering.

Publicera därefter den testade källan via befintliga Firebase-pilotworkflow på main. Regler, autentisering, dataformat, Firebase-projekt och befintlig host-avslut-för-alla-semantik ändras inte i detta paket. Den befintliga pilotadressen används normalt även vid uppdateringen.
