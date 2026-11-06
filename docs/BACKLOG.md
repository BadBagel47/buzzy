# Buzzy — framtida ändringar

Nya önskemål får ett eget internt ID och samlas före implementation. Att ett önskemål registreras är inte ett klartecken att implementera det eller ändra det pågående publiceringssteget.

| ID | Önskemål | Status |
|---|---|---|
| #290 | Utred om mobilens vibrator kan användas när spelaren buzzar. Kontrollera stöd och begränsningar, främst Android/Brave samt iOS. | Registrerat 2026-11-06 för framtiden. Ingen utredning eller implementation körd. |
| #291 | Följ upp knapptryck i mobil: förstasidans gröna knapp skiftar blå och hostknappar visar en bakgrund vid tryck. | Publicerad tillsammans med #293 i run42234619437; mobilprov återstår. |
| #292 | Förstora hostvyns minsta text på mobil och gör storleken enhetlig. Använd den lilla texten i första rutan som riktmärke, särskilt för de två nedre rutorna och knapparna i bottenmenyn. | Registrerat för ett kommande samlat arbetspaket. Ingen implementation gjord. |
| #293 | Återanslutning vid nätbyte och omladdning: host tappar rummet vid wifi → 5G, återansluter inte vid återgång till wifi och fastnar efter omladdning på ”Connecting to your room…”. | CSP-följdfixen är publicerad i run42248198398. Användaren bekräftar nu att rummet fungerar och har nått spelarvyn. Wifi/5G-provet är ännu inte bekräftat. Se [RECONNECT_293.md](RECONNECT_293.md). |
| #294 | Se över hostens sidhuvud: upprepade uppgifter och onödig vertikal yta jämfört med prototypen. | Endast registrerat. Invänta användarens egna förändringsförslag innan utformning eller implementation. |
| #295 | Spelarens mörka spelyta ska fylla själva mobilvyn, utan det omgivande prototypskalet. | Implementerat och lokalt verifierat; inväntar pilotpublicering och mobilprov. |
| #296 | Bekräftelsedialog innan host eller spelare lämnar rummet via lämna-knapp. Återanvänd etablerad dialogstil och interaktionsbeteende. | Implementerat och lokalt verifierat; inväntar pilotpublicering och mobilprov. |
| #297 | Spelarna ska märka när hosten lämnar; tydlig gemensam status och korrekt hantering av sessionen. | Implementerat: bekräftat hostlämnande stänger för alla, med spelarbesked. Nätavbrott stänger inte rummet. Inväntar pilotpublicering och mobilprov. |

För #290 ska utredningen skilja på faktisk funktion på riktiga mobiler och enbart tillgängligt webbläsar-API. Dokumentera eventuella krav på användarinteraktion och hur spelet fungerar när vibration inte stöds. Utformning/inställningsval beslutas när punkten tas upp.

Pågående #289 fortsätter enligt [regelgranskningen](RULES_REVIEW_289.md). Regelpubliceringen har senare godkänts och bekräftats via ny konsolkopia. Första Hosting-piloten har publicerats; #293:s CSP-följdfix är publicerad och rumsskapandet användarbekräftat; framtidspunkten #290 är fortsatt enbart registrerad.

Nästa fria interna ID: **#298**.

## #293 — reproduktion och mål

Användaren var i ett rum, slog av wifi medan 5G var aktivt, tappade anslutningen och slog sedan på wifi igen. Automatisk återanslutning uteblev. Efter omladdning visades endast ”Connecting to your room…” och ”Leave room”, samt initiala ”DESIGN LAB · A v7.52”-märket. Felets orsak är inte fastställd; skärmbilden bevisar inte att rummet har raderats eller identiteten förlorats.

Utred och åtgärda i ett samlat arbetspaket: återanslut till samma befintliga rum och roll när nätet återkommer; återställ sessionen efter omladdning; visa begripligt fel/återförsök om anslutningen inte kan slutföras. Kontrollera även spelarvyn, byte i båda riktningarna och att rum som faktiskt avslutats inte återskapas av återanslutningen. Mobilprov med riktiga nätbyten behövs för att verifiera beteendet.

Förtydligande från användaren för #293: Livepiloten får aldrig visa Design Lab-märkning eller utvecklingsvy, inte heller under start, nätavbrott, återanslutning, omladdning eller fel. Behåll korrekt Host/Player-identitet och visa begriplig anslutningsstatus i livegränssnittet. Skärmbilden visar labmärkningen; det är inte i sig bevis för att hela utvecklingsläget aktiverats. Detta krav är en del av #293, ingen separat implementation eller nytt ID.

Ytterligare observation i #293: efter nätavbrottet gick användaren tillbaka till förstasidan och försökte skapa ett nytt rum. Även detta fastnade, med meddelandet ”Creating room” (användarens formulering). Felsökningen måste alltså även omfatta ny rumsskapning efter ett nätbyte, inte bara återanslutning till tidigare rum. Samma bakomliggande orsak är ännu inte fastställd. Vänteläget ska kunna avslutas med tydligt fel/återförsök om operationen inte slutförs, och återförsök får inte skapa oavsiktliga dubbla rum. Observationen registrerades före implementationen; aktuell status står i tabellen.

## #294 — sidhuvud i host

Jämförelse med frysta v7.51 visar att pilotgeneratorn lägger en separat anslutningsrad under befintligt sidhuvud, med rums-/roll-/anslutningsstatus och Leave room. Prototypens Design Lab-badge ersätts efter anslutning med HOST/PLAYER. Rollen upprepas därmed i badge och statusrad. Användaren upplever upprepningar och slöseri med höjd på mobil. Registrera observationen; invänta användarens egna förslag på förändringar och gör inga egna layout-, innehålls- eller stiljusteringar för #294 innan dess.

## #295–#297 — nya mobilfynd

#295: Den mörka spelarytan var avsedd som själva mobilvyn. Den nuvarande nätgeneratorn behåller prototypens omgivande skal, sidhuvud, anslutningsrad och begränsad sidokolumn runt spelarytan. Registrera att det yttre tillägget ska bort när detta paket tas upp; utformning av kvarvarande kontroller beslutas då. Koppla till #296 så att det finns en tydlig väg att lämna även med mörk spelarsida.

#296: Alla uttryckliga lämna-rum-knappar ska kräva bekräftelse både för host och deltagare. Dialogen ska återanvända projektets befintliga modaldesign, typografi, knappar, fokus-/stängningsbeteende. Avbryt behåller pågående rum och vy; själva lämnandet sker först efter bekräftelse. Den nuvarande Leave room-länken lämnar direkt, medan End game använder webbläsarens native confirm. Det här är registrering, ingen implementation eller beslutad ny layout.

#297: Läsande kontroll visar att leave() bara stoppar lokala prenumerationer, kopplar ned den egna klienten, rensar lokal rumsreferens och går till förstasidan. Flödet meddelar inte övriga spelare att hosten lämnat. Registrera synlig hoststatus för deltagarna och ett gemensamt sessionsförlopp. Skilj ett bekräftat avsiktligt lämnande från kort nätförlust och återanslutning enligt #293. Senare uttryckligt användarbeslut: när hosten medvetet lämnar ska rummet stängas för alla; det ska framgå i dialogen och för spelarna. Detta ersätter det preliminära alternativet att behålla rummet.

Paketet #295–#297 är nu genomfört i källan, lokalt verifierat och väntar på manuell pilotpublicering. Se [PLAYER_EXIT_295_297.md](PLAYER_EXIT_295_297.md) och [rapporten](../reports/player-exit-295-297.json). Ingen regeländring behövs. #292 och #294 är inte genomförda i detta paket.
