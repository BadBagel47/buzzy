# #295–#297 — spelarvy och lämna-rum-flöde

Användaren godkände paketet med ”Kör dessa”. Användarens efterföljande beslut: om hosten medvetet lämnar ska rummet stängas för alla. Det ska framgå både i hostens bekräftelse och hos spelarna. Den tidigare diskuterade möjligheten att behålla rummet vid bekräftat hostlämnande har ersatts av detta beslut.

## Slutligt beteende

- #295: spelarens mörka yta är själva sidan och fyller webbläsarens tillgängliga höjd. Det ljusa sidhuvudet och telefonramen runt prototypen är borta för player. Spelkontrollerna håller en läsbar maxbredd på dator. Room code/leaderboard behålls i spelarens eget sidhuvud; en lämna-knapp ligger bredvid leaderboard med minst 44 px tryckyta. Den separata statusraden visas endast vid start, anslutningsproblem, nekad åtkomst eller avslutat rum.
- #296: Leave room hos båda roller och hostens separata End game öppnar projektets befintliga studio-modal. Modalens skal, typografi, knappar, fokusfälla, Escape/avbryt, stängningsanimation och återfört fokus återanvänds. Avbryt bevarar rum och session. Spelarens bekräftelse lämnar den egna vyn utan att avsluta spelet för andra; identiteten och poänghistoriken kan återanvändas vid återinträde.
- #297: hostens bekräftelse heter End game and leave? och säger uttryckligen att spelet slutar för alla och att rummet raderas. Ett bekräftat lämnande använder den befintliga ägarstyrda delete-operationen. En spelare i det tidigare fungerande rummet ser Game ended och att hosten har avslutat spelet, får ingen aktiv buzzer och kan välja Back to start. Ingen automatisk radering sker vid nätavbrott, omladdning eller stängd flik; återanslutningen i #293 gäller fortsatt.

Befintliga databasregler räcker. Inga presence-noder, nya datarättigheter eller regelpubliceringar ingår. Hostens allmänna sidhuvudsdesign (#294) och typografi (#292) är fortfarande egna framtidspunkter.

## Avbrott och dubletter

Inget lämna sker före bekräftelse. En host som är offline eller har en pågående spelåtgärd får ett begripligt besked i dialogen och kan avbryta. Efter bekräftad begäran är knapparna spärrade tills svaret kommer; upprepade tryck skickar inte flera delete-operationer. UI-väntetiden har en tidsgräns, men avbryter inte en redan köad SDK-skrivning. Vid ett långvarigt avbrott förklarar dialogen att begäran väntar på anslutningen. Den skickas inte igen genom dubbla bekräftelser.

Room-not-found efter ett tidigare aktivt rum är ett avslutat spel, inte en uppmaning till återanslutning. Start med en redan borttagen kod ger fortsatt ett saknat-rum-fel; inga rum återskapas genom återförsök.

## Verifiering och publicering

Det nya emulatorprovet room-exit.integration.mjs täcker player på 320/390/430/700/1280 px, mörk viewport, avbryt/Escape/fokus/Tab, stabil modal vid rendering, eget lämnande och återinträde, hostens varning, nätavbrott utan avslut, dubbelklick utan dubbla delete, spelarens avslutsbesked och den separata End game-knappen utan browserns native confirm. Skärmbilder sparas i appens lokala reports.

GitHub-pilotens verify-jobb kör nu test:pilot-ui, som inkluderar både det nya provet och den befintliga CSP-reservtransportregressionen före artifact-uppladdning och före Google-publiceringsbehörighet. Proverna använder demo-projekt och lokala emulatorer. Inga riktiga Buzzy-rum behöver skapas för detta.

Konkreta slutresultat och filhashar sparas i reports/player-exit-295-297.json när arbetet är verifierat. Paketet måste publiceras via den manuella pilotkörningen innan den tidigare speladressen visar ändringen. Samma granskade regelhash och console-bekräftelse gäller. Efter grön publicering återstår fysisk Android/Brave-kontroll.

Slutliga lokala resultat: 30 emulatorposter, 1 byggt produktionsspelprov med responsiva fönster, 5 konfigurations-/återanslutningsprov, 1 interceptat byggt HTTPS-prov och 20 operativa prov passerar. Både vanlig build och pilotbuild lyckades. Dialogskärmbilder är visuellt kontrollerade efter avslutad öppningsanimation. Databasreglernas bytes jämförda oförändrade. Paketet är ännu inte publicerat på speladressen.
