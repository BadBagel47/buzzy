# Buzzy — framtida ändringar

Nya önskemål får ett eget internt ID och samlas före implementation. Att ett önskemål registreras är inte ett klartecken att implementera det eller ändra det pågående publiceringssteget.

| ID | Önskemål | Status |
|---|---|---|
| #290 | Utred om mobilens vibrator kan användas när spelaren buzzar. Kontrollera stöd och begränsningar, främst Android/Brave samt iOS. | Registrerat 2026-11-06 för framtiden. Ingen utredning eller implementation körd. |
| #291 | Följ upp knapptryck i mobil: förstasidans gröna knapp skiftar blå och hostknappar visar en bakgrund vid tryck. | Fix förberedd i pilotkällan; behöver publiceras och provas på mobil. |
| #292 | Förstora hostvyns minsta text på mobil och gör storleken enhetlig. Använd den lilla texten i första rutan som riktmärke, särskilt för de två nedre rutorna och knapparna i bottenmenyn. | Registrerat för ett kommande samlat arbetspaket. Ingen implementation gjord. |
| #293 | Återanslutning vid nätbyte och omladdning: host tappar rummet vid wifi → 5G, återansluter inte vid återgång till wifi och fastnar efter omladdning på ”Connecting to your room…”. | Rapporterat från Android/Brave i den publicerade piloten. Hög prioritet före lansering; ingen implementation gjord. |
| #294 | Se över hostens sidhuvud: upprepade uppgifter och onödig vertikal yta jämfört med prototypen. | Endast registrerat. Invänta användarens egna förändringsförslag innan utformning eller implementation. |

För #290 ska utredningen skilja på faktisk funktion på riktiga mobiler och enbart tillgängligt webbläsar-API. Dokumentera eventuella krav på användarinteraktion och hur spelet fungerar när vibration inte stöds. Utformning/inställningsval beslutas när punkten tas upp.

Pågående #289 fortsätter enligt [regelgranskningen](RULES_REVIEW_289.md). Regelpubliceringen har senare godkänts och bekräftats via ny konsolkopia. Hosting-piloten återstår och har separat publiceringsbeslut; framtidspunkten #290 är fortsatt enbart registrerad.

Nästa fria interna ID: **#295**.

## #293 — reproduktion och mål

Användaren var i ett rum, slog av wifi medan 5G var aktivt, tappade anslutningen och slog sedan på wifi igen. Automatisk återanslutning uteblev. Efter omladdning visades endast ”Connecting to your room…” och ”Leave room”, samt initiala ”DESIGN LAB · A v7.52”-märket. Felets orsak är inte fastställd; skärmbilden bevisar inte att rummet har raderats eller identiteten förlorats.

Utred och åtgärda i ett samlat arbetspaket: återanslut till samma befintliga rum och roll när nätet återkommer; återställ sessionen efter omladdning; visa begripligt fel/återförsök om anslutningen inte kan slutföras. Kontrollera även spelarvyn, byte i båda riktningarna och att rum som faktiskt avslutats inte återskapas av återanslutningen. Mobilprov med riktiga nätbyten behövs för att verifiera beteendet.

Förtydligande från användaren för #293: Livepiloten får aldrig visa Design Lab-märkning eller utvecklingsvy, inte heller under start, nätavbrott, återanslutning, omladdning eller fel. Behåll korrekt Host/Player-identitet och visa begriplig anslutningsstatus i livegränssnittet. Skärmbilden visar labmärkningen; det är inte i sig bevis för att hela utvecklingsläget aktiverats. Detta krav är en del av #293, ingen separat implementation eller nytt ID.

Ytterligare observation i #293: efter nätavbrottet gick användaren tillbaka till förstasidan och försökte skapa ett nytt rum. Även detta fastnade, med meddelandet ”Creating room” (användarens formulering). Felsökningen måste alltså även omfatta ny rumsskapning efter ett nätbyte, inte bara återanslutning till tidigare rum. Samma bakomliggande orsak är ännu inte fastställd. Vänteläget ska kunna avslutas med tydligt fel/återförsök om operationen inte slutförs, och återförsök får inte skapa oavsiktliga dubbla rum. Endast registrering inför kommande arbetspaket.

## #294 — sidhuvud i host

Jämförelse med frysta v7.51 visar att pilotgeneratorn lägger en separat anslutningsrad under befintligt sidhuvud, med rums-/roll-/anslutningsstatus och Leave room. Prototypens Design Lab-badge ersätts efter anslutning med HOST/PLAYER. Rollen upprepas därmed i badge och statusrad. Användaren upplever upprepningar och slöseri med höjd på mobil. Registrera observationen; invänta användarens egna förslag på förändringar och gör inga egna layout-, innehålls- eller stiljusteringar för #294 innan dess.
