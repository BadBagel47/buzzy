# Buzzy — framtida ändringar

Nya önskemål får ett eget internt ID och samlas före implementation. Att ett önskemål registreras är inte ett klartecken att implementera det eller ändra det pågående publiceringssteget.

| ID | Önskemål | Status |
|---|---|---|
| #290 | Utred om mobilens vibrator kan användas när spelaren buzzar. Kontrollera stöd och begränsningar, främst Android/Brave samt iOS. | Registrerat 2026-11-06 för framtiden. Ingen utredning eller implementation körd. |
| #291 | Följ upp knapptryck i mobil: förstasidans gröna knapp skiftar blå och hostknappar visar en bakgrund vid tryck. | Publicerad tillsammans med #293 i run42234619437; mobilprov återstår. |
| #292 | Förstora hostvyns minsta text på mobil och gör storleken enhetlig. Använd den lilla texten i första rutan som riktmärke, särskilt för de två nedre rutorna och knapparna i bottenmenyn. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #293 | Återanslutning vid nätbyte och omladdning: host tappar rummet vid wifi → 5G, återansluter inte vid återgång till wifi och fastnar efter omladdning på ”Connecting to your room…”. | Återöppnat: spelarens omladdning upplevs fastna på Connecting to your room. Host i annan flik på samma mobil. Kortare väntan/återförsök behövs; ingen 30s-timeout bekräftad. Se [RECONNECT_293.md](RECONNECT_293.md). |
| #294 | Se över hostens sidhuvud: upprepade uppgifter och onödig vertikal yta jämfört med prototypen. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #295 | Spelarens mörka spelyta ska fylla själva mobilvyn, utan det omgivande prototypskalet. | Publicerat i run42258255116; mobilprov återstår. |
| #296 | Bekräftelsedialog innan host eller spelare lämnar rummet via lämna-knapp. Återanvänd etablerad dialogstil och interaktionsbeteende. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #297 | Spelarna ska märka när hosten lämnar; tydlig gemensam status och korrekt hantering av sessionen. | Implementerat: bekräftat hostlämnande stänger för alla, med spelarbesked. Nätavbrott stänger inte rummet. Publicerat i run42258255116; mobilprov återstår. |
| #298 | Lägg spelarens liveruta längst ner och låt buzzern växa dynamiskt efter ledig bredd och höjd mellan frågerutan och liverutan. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #299 | Rätta spelarens lämna-rum-ikon, vars pil ser ut som ett flygplan. Återanvänd en tydlig standardikon i befintligt linjespråk. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #300 | Gemensam fullskärmsvy för QR-delning från hosthuvudet och Settings: riktig QR, webbadress och rumskod i spelarens formspråk. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #301 | Settings första kortrubrik ska ha samma storlek som övriga motsvarande rubriker, utan kod i rubriken. Föreslaget namn: Room information. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #302 | Settings mörkare inforuta: Room code och Room lifetime-värden får samma textstorlek; prova normal teckenbredd utan spärrning. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #303 | Hostens vybyte via bottenmenyn ska animeras från skärmkanterna, inte från kortens/containerkanterna. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |

För #290 ska utredningen skilja på faktisk funktion på riktiga mobiler och enbart tillgängligt webbläsar-API. Dokumentera eventuella krav på användarinteraktion och hur spelet fungerar när vibration inte stöds. Utformning/inställningsval beslutas när punkten tas upp.

Pågående #289 fortsätter enligt [regelgranskningen](RULES_REVIEW_289.md). Regelpubliceringen har senare godkänts och bekräftats via ny konsolkopia. Första Hosting-piloten har publicerats; #293:s CSP-följdfix är publicerad och rumsskapandet användarbekräftat; framtidspunkten #290 är fortsatt enbart registrerad.

Nästa fria interna ID: **#304**.

## #293 — reproduktion och mål

Användaren var i ett rum, slog av wifi medan 5G var aktivt, tappade anslutningen och slog sedan på wifi igen. Automatisk återanslutning uteblev. Efter omladdning visades endast ”Connecting to your room…” och ”Leave room”, samt initiala ”DESIGN LAB · A v7.52”-märket. Felets orsak är inte fastställd; skärmbilden bevisar inte att rummet har raderats eller identiteten förlorats.

Utred och åtgärda i ett samlat arbetspaket: återanslut till samma befintliga rum och roll när nätet återkommer; återställ sessionen efter omladdning; visa begripligt fel/återförsök om anslutningen inte kan slutföras. Kontrollera även spelarvyn, byte i båda riktningarna och att rum som faktiskt avslutats inte återskapas av återanslutningen. Mobilprov med riktiga nätbyten behövs för att verifiera beteendet.

Förtydligande från användaren för #293: Livepiloten får aldrig visa Design Lab-märkning eller utvecklingsvy, inte heller under start, nätavbrott, återanslutning, omladdning eller fel. Behåll korrekt Host/Player-identitet och visa begriplig anslutningsstatus i livegränssnittet. Skärmbilden visar labmärkningen; det är inte i sig bevis för att hela utvecklingsläget aktiverats. Detta krav är en del av #293, ingen separat implementation eller nytt ID.

Ytterligare observation i #293: efter nätavbrottet gick användaren tillbaka till förstasidan och försökte skapa ett nytt rum. Även detta fastnade, med meddelandet ”Creating room” (användarens formulering). Felsökningen måste alltså även omfatta ny rumsskapning efter ett nätbyte, inte bara återanslutning till tidigare rum. Samma bakomliggande orsak är ännu inte fastställd. Vänteläget ska kunna avslutas med tydligt fel/återförsök om operationen inte slutförs, och återförsök får inte skapa oavsiktliga dubbla rum. Observationen registrerades före implementationen; aktuell status står i tabellen.

## #294 — sidhuvud i host

Jämförelse med frysta v7.51 visar att pilotgeneratorn lägger en separat anslutningsrad under befintligt sidhuvud, med rums-/roll-/anslutningsstatus och Leave room. Prototypens Design Lab-badge ersätts efter anslutning med HOST/PLAYER. Rollen upprepas därmed i badge och statusrad. Användaren upplever upprepningar och slöseri med höjd på mobil. De tidigare efterfrågade användarförslagen har nu kommit. Följ specifikationen nedan när det gemensamma UI-paketet får körbeslut; utforma inte en annan header på eget initiativ.

## #295–#297 — nya mobilfynd

#295: Den mörka spelarytan var avsedd som själva mobilvyn. Den nuvarande nätgeneratorn behåller prototypens omgivande skal, sidhuvud, anslutningsrad och begränsad sidokolumn runt spelarytan. Registrera att det yttre tillägget ska bort när detta paket tas upp; utformning av kvarvarande kontroller beslutas då. Koppla till #296 så att det finns en tydlig väg att lämna även med mörk spelarsida.

#296: Alla uttryckliga lämna-rum-knappar ska kräva bekräftelse både för host och deltagare. Dialogen ska återanvända projektets befintliga modaldesign, typografi, knappar, fokus-/stängningsbeteende. Avbryt behåller pågående rum och vy; själva lämnandet sker först efter bekräftelse. Den nuvarande Leave room-länken lämnar direkt, medan End game använder webbläsarens native confirm. Det här är registrering, ingen implementation eller beslutad ny layout.

#297: Läsande kontroll visar att leave() bara stoppar lokala prenumerationer, kopplar ned den egna klienten, rensar lokal rumsreferens och går till förstasidan. Flödet meddelar inte övriga spelare att hosten lämnat. Registrera synlig hoststatus för deltagarna och ett gemensamt sessionsförlopp. Skilj ett bekräftat avsiktligt lämnande från kort nätförlust och återanslutning enligt #293. Senare uttryckligt användarbeslut: när hosten medvetet lämnar ska rummet stängas för alla; det ska framgå i dialogen och för spelarna. Detta ersätter det preliminära alternativet att behålla rummet.

Paketet #295–#297 är nu genomfört i källan, lokalt verifierat och publicerat i run42258255116; mobilprov återstår. Se [PLAYER_EXIT_295_297.md](PLAYER_EXIT_295_297.md) och [rapporten](../reports/player-exit-295-297.json). Ingen regeländring behövs. #292 och #294 är inte genomförda i detta paket.

## #298 — liveruta i botten och dynamisk buzzer

Användarens mobilbild visar outnyttjad mörk yta under liverutan. Önskat: liverutan placeras längst ner i den tillgängliga spelarytan, och buzzerns storlek anpassas dynamiskt till utrymmet mellan frågerutan och liverutan. Begränsa storleken efter både tillgänglig bredd och höjd och behåll den cirkulära formen. Ta hänsyn till mobilens safe area, webbläsarens varierande höjd, korta skärmar och liggande läge så att frågetext, kontroller och liveruta inte täcks. Återanvänd befintlig buzzerdesign, typografi och animationer. Registrering enligt överenskommelsen om ID och samlade paket; inte ett genomfört ingrepp i spelarvyn.

## #299 — lämna-ikonens pil

Källkontroll av SVG:n bekräftar felet: M13 8l4 4-4 4 placerar pilspetsen vid (17,12), medan M9 12h12 fortsätter skaftet till (21,12). Överskjutningen ger en flygplansliknande form. Ta med en korrekt, etablerad lämna-/log-out-symbol i nästa paket tillsammans med övriga spelarjusteringar, med samma färg och linjestil som projektets övriga ikoner. Ingen implementation nu.

Nytt återfall i #293 efter #295–#297-publiceringen: användaren laddade om spelarvyn på Android/Brave och fastnade på en tom mörk sida med ”Connecting to your room…” och ”Leave room”. Ingen Design Lab-märkning syns. Bilden visar startläget men bevisar inte var i laddningen det stannar, hur länge väntan pågått eller om rummet fortfarande finns. Frågat om hosten var kvar och om felmeddelande/Try again visas efter cirka30sekunder. Behåll samma ID; ingen ny implementation eller publicering gjord för denna observation.

Förtydligande i #293: hosten var i en annan flik på samma mobil och visade Connected när användaren återvände till hostfliken. Det bevisar inte oavbruten nätanslutning under tiden i bakgrunden, men spelarens återställning av befintligt rum ska inte kräva att hostfliken hålls aktiv. Användaren väntade inte30sekunder och anser att sådan väntetid vore för lång. Ingen faktisk 30s-hängning eller utebliven timeout har alltså verifierats. Prioritera snabb återställning, undvik tom skärm under laddning och ge begriplig återkoppling/återförsök betydligt tidigare. Normal respons och eventuella tidsgränser behöver mätas i nästa felsökning.

Återfall i #296: användaren upplever att spelarens lämna-dialog inte följer projektets grafiska stil. Nuvarande implementation använder den gemensamma ljusa studio-/hostmodalen även på mörk spelarsida. Rättningen ska återanvända spelargränssnittets etablerade dialog-/panelformspråk och typografi, med bevarad bekräftelse, avbryt, fokusfälla och hostens avslut-för-alla-semantik. Ingen ny dialogdesign eller kodändring genomförd för denna rapport.

## #294 — användarens konkreta headerförslag

Ta bort HOST-märkningen. Flytta Room/Connected upp till samma sidhuvud som logotypen, högerställt i höjd med den. Ersätt Leave room-texten med spelarens lämna-knapp i hostens färger längst till höger. Lägg QR- och länkknappar i samma huvud. Kompakt layout ska behålla läsbarhet/tryckytor på mobil utan att öka onödig höjd eller ändra appens maxbredd. #299 rättar själva lämna-symbolen och ska användas även här. Invänta inte samma användarförslag igen; kravet på sådana är uppfyllt.

## #300 — delningsskärm

Headerns och Settings QR-ingång öppnar samma helskärmsvy. Ingen del av hostgränssnittet får synas bakom när den är aktiv. Visa scanningsbar QR, den riktiga webbadressen och aktuell rumskod i spelarens mörka formspråk, läsbart när host håller upp mobil/surfplatta. Återgång ska behålla hostvyn och återföra fokus. QR-koden ska motsvara den aktuella join-länken/rumskoden, inga demosymboler. Källkontroll: nuvarande Settings-ingång har en QR-unavailable/prototypgren i liveversionen; en riktig QR måste alltså implementeras. Koden bör genereras lokalt utan extern QR-bildtjänst.

Tolkning för paketet: länkknapparna i header/Settings kopierar samma riktiga rumslänk som i dag, och QR-knapparna visar samma helskärm med QR/webbadress/kod. Användaren har inte beskrivit ett eget operativsystems share-sheet eller beslutat om en sådan.

## #301–#302 — Settings rumskort

#301: översta kortets Room BLL5-rubrik upplevs mindre än övriga kortrubriker. Återanvänd samma rubrikstil som motsvarande övriga kort, ta bort själva rumskoden ur rubriken. Room information är föreslaget lämpligt engelskt namn; koden finns kvar i informationsfältet.

#302: Room code-värdet har spärrning medan Room lifetime-värdet är större och ospärrat. Ge båda värdena en gemensam återanvänd textstil/storlek och prova normal letter-spacing. Behåll skillnaden mellan etiketter och värden enligt befintlig hierarki. Detta gäller inforutans värden, inte ett generellt beslut att avskaffa alla andra etablerade kodstilar.

## #303 — vyövergång

Hela vyn ska börja/avsluta förflyttningen vid skärmens kanter vid byte med bottenknapparna, i stället för vid kort-/innehållsbehållarens kanter. Bevara riktningslogik, slutliga innehållsmarginaler, maxbredd, reduced-motion och snabba upprepade vybyten. Kort och listposter ska fortsatt ligga still inuti den inkommande vyn; återinför inte separata kortanimationer eller ändrade listgap.

## Samlat UI-paket

Användaren frågar om alla UI-ändringar kan göras i ett svep och vilken modell som passar. Planerat paket: #292, #294, #296:s spelarstil, #298, #299, #300, #301, #302 och #303. Rekommendation GPT-6.1 Sol med högt resonemang. Gemensam responsiv verifiering och en pilotpublicering. #293:s upplevda player-reload/laddning är fortfarande ett öppet funktions-/återkopplingsproblem som behöver följas upp så att paketet kan provas på riktiga enheter. Frågan om paket/modell är inte i sig ett nytt genomfört implementationstillfälle; inga UI-ändringar gjorda i registreringssteget.

## UI-paketet genomfört efter körbeslut

Användaren godkände paketet med ”Kör dem”. #292, #294, #296:s spelarstil och #298–303 är nu genomförda. Se [UI_BATCH_292_303.md](UI_BATCH_292_303.md). Äldre noteringar om ”ingen implementation” ovan beskriver registreringssteget före detta körbeslut. #293:s upplevda spelaråteranslutning är fortfarande öppen; inga nya regler eller ändrad avslut-semantik ingår. Nästa fria ID är #304.
