# Buzzy — framtida ändringar

För övergripande mål se [PLAN.md](PLAN.md), för arbetssätt [WORKING_AGREEMENTS.md](WORKING_AGREEMENTS.md) och för återstart [HANDOFF.md](HANDOFF.md). Tabellen nedan visar aktuell status; äldre avsnitt bevarar historiska beslut.

Nya önskemål får ett eget internt ID och samlas före implementation. Att ett önskemål registreras är inte ett klartecken att implementera det eller ändra det pågående publiceringssteget.

| ID | Önskemål | Status |
|---|---|---|
| #283 | Vinstkonfetti ska skjutas upp från nedre vänstra och högra hörnet, in mot mitten. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #284 | Upprepade tryck på konfettiknappen ska lägga till nya konfettiskurar utan att avbryta pågående skurar. | Uppföljningen publicerad i run42529524063; användaren bekräftar live-valet. Högst tre samtidiga skurar per enhet och en samlad väntande skur vid hög belastning. Verkligt prov återstår. |
| #290 | Utred om mobilens vibrator kan användas när spelaren buzzar. Kontrollera stöd och begränsningar, främst Android/Brave samt iOS. | Implementationen publicerad i run42410517841, men användaren rapporterar ingen vibration i Android Brave eller Chrome. Felsökning på faktisk enhet återstår. Se [INVESTIGATION_290.md](INVESTIGATION_290.md). |
| #291 | Följ upp knapptryck i mobil: förstasidans gröna knapp skiftar blå och hostknappar visar en bakgrund vid tryck. | Publicerat i run42421937554: etiketters mobila tryckmarkering avstängd, tangentbordsfokus och switcharnas valda läge bevaras. Mobilprov återstår. |
| #292 | Förstora hostvyns minsta text på mobil och gör storleken enhetlig. Använd den lilla texten i första rutan som riktmärke, särskilt för de två nedre rutorna och knapparna i bottenmenyn. | Genomfört i det samlade UI-paketet. Publicerat i run42295900005 med gröna tester; mobilprov återstår. |
| #293 | Återanslutning vid nätbyte och omladdning: host tappar rummet vid wifi → 5G, återansluter inte vid återgång till wifi och fastnar efter omladdning på ”Connecting to your room…”. | Uppföljningen är publicerad i run42471953022. Användaren bekräftar att #293 nu verkar fungera; mobilprov godkänt enligt senaste återkopplingen. Se [RECONNECT_293.md](RECONNECT_293.md). |
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
| #304 | Balansera bottenmenyn efter ikon/text: tillåt olika knappbredder, centrera innehållet även i Play och låt aktiv markering animera både läge och bredd. | Publicerat i run42520516709 efter godkända verifieringssteg. Mobilprov av centrering återstår. |
| #305 | Samordna sidrubriker och första kortens vertikala placering mellan Players, Questions och Settings med Play. | Publicerat i run42471953022: 14 px både ovanför första kortet och mellan korten, med gemensamt reserverat utrymme för Play-raden. Samma första kortposition verifierad mellan vyerna på 320/390/430/768/1280 px. Mobilprov återstår. |
| #306 | Återställ synlig utfällningsanimation när Quick Play-knappen öppnar panelen med fler inställningar/frågeinnehåll. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #307 | Utred och rätta flimmer vid byte mellan poäng för rätt/fel svar och vid switchen som delar leaderboard till alla. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #308 | Ta bort Show QR-knappen från Room information i Settings; QR-delning finns kvar i sidhuvudet. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #309 | Alla utfällbara sektioner under Room settings ska vara hopfällda som standard. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #310 | Flytta Launch final celebration från Session and history till Visual effects. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #311 | Byt Launch final celebration till Launch celebration for all och använd samma färgstil som övriga vanliga hostknappar. | Publicerat i run42347839035 med gröna verifieringsjobb; mobilprov återstår. |
| #312 | Ge End game och motsvarande röda bekräftelseknappar en konsekvent röd knappkant. | Publicerat i run42433666616: hostens röda knappar använder samma röda färg för text och kant. Mobilprov återstår. |
| #313 | Förhindra att sista kortet döljs av bottenmenyn och ge samma slutmellanrum som mellan korten i alla hostvyer, även när webbläsarens verktygsrad visas/döljs. | Uppföljning publicerad i run42370960695; fysisk Android/Brave-bekräftelse återstår. |
| #314 | Mer konfetti med framför allt större spridning över skärmen; bitarna får bli något större. Behåll snabb uppflygning och något långsammare nedfärd. | Publicerat i run42370960695; fysisk mobilkontroll återstår. |
| #315 | Jämna ut det inre bottenutrymmet i Players-korten, särskilt Disconnected players som upplevs ha för mycket luft jämfört med andra kort/vyer. | Publicerat i run42370960695; Settings-accordioner lämnade orörda. |
| #316 | Visa det kortare Room not found-beskedet: “We couldn’t find a room with that code.” | Publicerat i run42480785493. |
| #317 | Centrera punkterna och/eller insättningsmarkören visuellt i det tomma rumskodsfältet. | Uppföljning publicerad i run42395979402; mobilprov återstår. |
| #318 | Gör Buzzy-logotypens z enfärgat med övriga bokstäver överallt; behåll den färgade punkten. | Publicerat i run42380847677; mobilprov återstår. |
| #319 | Gör spelarens omladdning/återanslutning lugnare och begripligare: centrerad Buzzy-logotyp under väntan och läsbara besked med nästa steg vid misslyckad anslutning. | Presentationsdelen publicerad i run42380847677; mobilprov återstår. Funktionell återanslutning ligger kvar i #293. |
| #320 | Förhindra att hostens rubrik och innehåll flyttar sig efter vybytesanimationen. | Reproducerat 1 px hopp i Question queue: kortgapets regel träffade bara efter animationen. Samma gap gäller nu även inne i animationsbehållaren, publicerat i run42471953022. Prov mäter både första kortet och Question queue före/efter animation; mobilprov återstår. |
| #321 | Förhindra att hostens sidhuvud hoppar/förskjuts under första sidladdning eller omladdning. | Publicerat i run42395979402; mobilprov återstår. |
| #322 | Prova betydligt mer konfetti: öka mängden med 200% jämfört med nuvarande mängd och behåll spridningen över skärmen. | Publicerat i piloten; efterföljande #329 ökade antalet ytterligare. |
| #323 | I frågekön ska texten ha mer avstånd till upp-/nerknapparna; gör riktningspilarna tydliga och centrerade i sina knappar och använd samma tydliga pilar konsekvent där ikoner anger riktning i gränssnittet. | Publicerat i run42425734815: frågekön, buzzordning, spelarens liveflöde och tillbaka-knappen använder samordnade riktningspilar. Mobilprov återstår. |
| #324 | Granska och centrera stängkrysset i alla dialoger och paneler; säkerställ konsekvent placering och att hostdialoger följer ljust tema medan spelarens leaderboard behåller mörkt tema. | Publicerat i run42433666616: hostens tomma Leaderboard använder befintlig sekundärtextfärg och minst 14 px. Spelarens mörka tema är lokalt kontrollerat; mobilprov återstår. |
| #325 | Visa antalet spelare i hostens Play-vy utan att skapa en ny ruta eller ta extra vertikal plats. | Publicerat i run42421937554: kompakt antal aktiva deltagare vid Buzz results, utan nya Firebase-anrop. Faktisk onlinenärvaro garanteras inte. |
| #326 | I Questions-vyn ska knappen för ny fråga ligga ovanför instruktionstexten i introduktionsrutan, använda befintlig fullbreddsmall och eventuellt heta “New question” utan plustecken. | Publicerat i run42421937554: New question ovanför texten som fullbreddsknapp. |
| #327 | Round overview ska skilja en färdigbedömd felaktig runda från en runda där bedömningar fortfarande väntar. | Publicerat i run42421937554: rundstatus skiljer pending-bedömningar från färdigbedömda felaktiga svar. |
| #328 | I QR-delningens helskärmsvy ska endast domänen visas, i större och tydlig typografi och utan länk; knappen Copy room link ska fortsätta kopiera hela rumslänken som idag. | Publicerat i run42421937554: QR-vyn visar domäntext; QR och kopieringsknapp behåller hela rumslänken. Mobilprov återstår. |
| #329 | Dubbla tiden som konfettin skjuts ut och öka antalet konfettibitar med 50 %, med samma uppflygning och dalning. | Publicerat i run42425734815: startfördröjning 0–360 ms och 432 bitar. Mobilprov återstår. |
| #330 | Granska förstasidans textstorlekar så att hjälpinformation, felmeddelanden och andra läsbara texter inte blir för små, även på smala skärmar. | Publicerat i run42433666616: förstasidans hjälp- och feltexter har minst 14 px. Mobilprov återstår. |
| #331 | Utred värdinloggning och skydd mot obehörigt rumsskapande samt onödiga anslutningsförsök, med öppet deltagande och låg kvotförbrukning. | Pausat enligt användaren i väntan på engångslänkslösningen från ett annat projekt. Anpassning och tester mot Firebase och kvot krävs före ett framtida genomförande. |
| #332 | Förbered integritets-/lagringsinformation och beslut om gallring inför publik lansering. | Registrerat från diskussionen om lagkrav: inventera faktisk lagring, rättslig grund, ansvar, leverantörsvillkor, lagringstider och övergivna rum. Samtyckesbehovet är preliminärt bedömt, inte juridiskt slutgranskat. Ingen appändring beställd. |
| #333 | Visa korrekt ikon för bedömt buzzresultat i hostens Buzz results: bock för rätt svar och kryss för fel svar. | Publicerat i run42480785493; mobilprov återstår. |
| #334 | Ta bort `.html` från både hostens och spelarens adress och använd rena URL:er. | Publicerat i run42480785493. Hosting-emulatorn serverar de rena adresserna och omdirigerar gamla adresser med frågeparametrar bevarade; mobilprov återstår. |
| #335 | Se till att en avstängd spelare kan lämna rummet från statusvyn. | Lokalt prov och run42536777864 lyckades. Vald kanal och mobilprov inväntar bekräftelse. |
| #336 | Låt konfettin falla långsammare efter uppskjutningen. | Uppföljningen klarade run42536777864. Vald kanal och visuellt prov inväntar bekräftelse. |
| #337 | Förbered Buzzy på underdomänen `buzzy.trythis.one`, som hanteras hos Cloudflare. | Firebase har verifierat domänen och användaren bekräftar att den nu fungerar. Live-körning 42524163679 lyckades; användaren bekräftar att `live` valdes. Specifika host-/spelarflöden på domänen är inte separat bekräftade. |
| #338 | Justera konfettins vinklar/spridning så att den fyller även nedre mitten utan ett synligt hål. | Publicerat i run42529524063; användaren bekräftar live-valet. Lokalt prov kontrollerar nedre mitten på mobil och bred skärm; visuellt prov återstår. |
| #339 | Anpassa hostens sidhuvuds innehåll till samma maximala bredd och horisontella inpassning som sidans huvudinnehåll. | Uppföljningen klarade run42536777864. Vald kanal och visuellt prov inväntar bekräftelse. |
| #340 | Förhindra att förstasidans innehåll hoppar upp när ett rum skapas. | Uppföljningen klarade run42536777864. Vald kanal och visuellt prov inväntar bekräftelse. |
| #341 | Låt spelarvyns bakgrundstoning fylla hela fönstret även på breda skärmar. | Hosting-körning 42556139061 lyckades; användarprov återstår. Vald kanal är inte direkt avläst. |
| #342 | Centrera och minska den synliga markeringen runt spelarens informationspil så att den inte täcker text. | Hosting-körning 42556139061 lyckades; användarprov återstår. Vald kanal är inte direkt avläst. |
| #343 | Justera Join-knappens optiska textplacering på förstasidan. | Hosting-körning 42556139061 lyckades; användarprov återstår. Vald kanal är inte direkt avläst. |
| #344 | Gör förstasidans logotyp lite större och placera innehållet något högre. | Ändrat i källan efter uttryckligt körbesked; lokalt layoutprov passerade. Publicering och användarprov återstår. |
| #345 | Håll hosthuvudets knappar och övriga objekt stilla när status- eller felmeddelanden visas. | Ändrat och lokalt verifierat; publicering och användarprov återstår. Exakt ursprungligt fel är okänt. |
| #346 | Gör logotypen på förstasidan större. | Ändrat och verifierat; två föråldrade UI-testförväntningar är rättade efter Actions-felen. Ny publiceringskörning behövs. |

För #290-utredningen och implementerad feedback, se [INVESTIGATION_290.md](INVESTIGATION_290.md). Ingen märkbar vibration fungerade i vare sig Brave eller Chrome på Android; felsökning avvaktar. #331 avvaktar engångslänkslösningen från det andra projektet.

Regelpubliceringen i #289 är genomförd och bekräftad via konsolkopia. Hosting-piloten har därefter publicerats i flera omgångar; aktuell publicering finns i [HANDOFF.md](HANDOFF.md). Riktig mobilverifiering redovisas separat från lokala tester och lyckad publicering.

Nästa fria interna ID: **#347**.

#345: hosthuvudet visar en kort status medan längre status- och felmeddelanden och eventuell återförsöksknapp visas i en separat stängbar ruta. Statusknappen öppnar rutan igen. Lokala geometriprov på 320, 390, 768 och 1280 px kontrollerar att huvud, knappar och innehåll inte flyttas vid långa fel, återförsök och frånkoppling; lång text, scrollning, stängning och återöppning kontrollerades. GitHub-provet fann att statusknappen klipptes på 320 px; rumsbeteckningen visar nu bara koden visuellt på de minsta skärmarna, med fullständig tillgänglig etikett. Riktat room-UI, pilotbygge och HTTPS-test passerar. Ursprungligt tillfälligt fel och dess orsak är fortfarande okända. Publicering och verkligt användarprov återstår.

#346: logotypen på förstasidan ökades från 41 till 46 px, och från 37 till 42 px på skärmar upp till 350 px. Två Actions-fel visade föråldrade UI-testförväntningar: fontstorleken (37→42 px) och logotypens uppåtförflyttning (minst 6→3 px, eftersom större logga ändrar gruppens höjd). Båda är uppdaterade. Pilot-UI 5/5, konfiguration 5/5, pilotbygget och HTTPS-provet passerade; riktat room-UI-prov passerade efter sista rättningen. Starta om Actions.

#344: användaren önskar en något större logotyp och en diskret höjning av förstasidans innehåll. I källan är logotypen 41 px i stället för 38 px, och 37 px i stället för 34 px på de smalaste skärmarna. Mer nedre sidpadding flyttar den centrerade gruppen cirka 8 px uppåt när plats finns, utan att klippa toppen på låga skärmar. Lokalt layoutprov jämför tidigare och nya positioner på 320×640, 390×844, 1440×900 och 390×550 och kontrollerar tillgängligt innehåll och frånvaro av sidledes overflow. Pilot-UI-proven passerade 5/5, konfiguration 5/5, pilotbygget och interceptat HTTPS-prov passerade. Ursprungliga referensfilen är orörd. Publicering och faktisk visuell kontroll återstår.

#341: på breda fönster ser spelarens bakgrundstoning ut att sluta vid den begränsade spelytans kanter. Låt toningen täcka hela tillgängliga fönstret och behåll dess nuvarande utseende på mobil och smala fönster. Spelinnehållets bredd och funktioner ska fortsatt vara anpassade för spelaren. Källan visar att gradienten ligger på `.phone` medan den omgivande sidan har en enfärgad bakgrund; verifiera visuell övergång och dimensionering vid implementation. Ingen appändring gjord.

#342: markeringen runt pilen för spelarens frågeinformation upplevs för stor och felcentrerad, och täcker närliggande text. Centrera den synliga markeringen över pilen och gör den mindre, samtidigt som träffytan förblir användbar och tangentbordsfokus tydligt synligt. Kontrollera både öppet och stängt läge och tangentbord/mus/touch. Källan har en fokusmarkering på knappen och en separat horisontell förskjutning på pilens SVG; den exakta orsaken är ännu inte uppmätt. Ingen appändring gjord.

#343: texten på förstasidans Join-knapp upplevs optiskt för långt åt vänster och något för långt ned. Jämför i första hand textens visuella placering i själva knappen, även med pilen närvarande, och justera försiktigt åt höger och uppåt efter visuell mätning. Behåll knappens storlek, funktion, fokus och responsiva beteende. Ingen appändring gjord. Rekommenderad modell för #341–343: GPT-6.1 Terra high.

Efter körbesked: #341 flyttar spelarens gradient till hela sidans bakgrund och gör den centrerade spelytan genomskinlig; ett skärmbildsprov kontrollerar övergången vid kolumnkanten. #342 ritar en mindre fokusring kring den visuellt förskjutna pilen men behåller knappens 44×44 px träffyta; prov kontrollerar tangentbordsfokus, öppet/stängt och att ringen inte täcker närliggande text. #343 centrerar texten i själva Join-knappen och justerar den 1 px åt höger och uppåt. Lokala pilot-UI-proven passerade 5/5, konfiguration 5/5, pilotbygget och interceptat HTTPS-prov passerade; separat UI-prov efter utökad överlappskontroll passerade. Visuell användarkontroll och publicering återstår.

Uppdatering: [run42556139061](https://github.com/BadBagel47/buzzy/actions/runs/42556139061) lyckades med commit `0856d150320ee9d2a8a0faf8764ef544370a4ed9`. Användaren ombads välja live och meddelade att körningen var klar; den offentliga runsidan visar inte valt mål. Riktigt visuellt prov återstår.

Efter körbesked #335/#336/#339/#340: statusvyn visar lämna-länken även när en spelare är avstängd; ett emulatorprov bekräftar lämna-dialog, återgång och återanslutning efter hävd avstängning. Konfettins uppfärd har mindre tidig inbromsning och nedfärden behåller sin längre tid. Hosthuvudets innehåll linjerar med huvudkolumnen på breda skärmar, och förstasidans status visas utan att flytta den centrerade huvuddelen. Pilot-UI-kontroll 5/5, konfigurationsprov 5/5, pilotbygge och interceptat HTTPS-prov passerade. Riktig visuell kontroll och publicering återstår. #290 och #331 avvaktas fortsatt.

Uppdatering: run42550140217 för commit `2eb7a9996f11f0bea42c6a7a13316b45ec5c3e35` lyckades och innehåller källändringarna från `07cfa644ec1bc945ff846be526cf948bfca59662`. Den offentliga körningssidan visar inte vald Hosting-kanal; live-valet inväntar användarens bekräftelse och faktiskt visuellt prov återstår.

#340: när användaren skapar ett rum upplevs förstasidans innehåll hoppa upp ett steg. Undersök och stabilisera placeringen under väntan, utan att dölja viktig status eller försämra felmeddelanden och tillgänglighet. Kontrollera även anslutning till rum, smala och korta skärmar samt normala och långsamma anslutningar. Källan visar att statusmeddelandet blir synligt i den vertikalt centrerade `.landing`-behållaren vid skapande; ändrad innehållshöjd är ett möjligt spår men hoppets exakta orsak är inte uppmätt. Ingen appändring gjord; inväntar körbesked. Rekommenderad modell: GPT-6.1 Terra.

#336 återöppnad efter användarens prov: konfettin verkar sakta in redan före nedfärden och känslan blir att den stannar upp. Justera tidskurvan så att uppskjutningen känns snabb längre och övergången till den långsammare nedfärden ser naturlig ut utan en synlig paus. Bevara tidigare överenskommen långsammare nedfärd, spridning, flera skurar och reduced motion. Koden använder i dag en parabel där vertikalhastigheten närmar sig noll vid toppen och tidsätter upp- och nedfärd olika; detta är en möjlig förklaring som behöver jämföras visuellt, inte en fastställd rotorsak. Ingen appändring gjord. Rekommenderad modell: GPT-6.1 Terra high.

#339: användaren ser på desktop att hosthuvudets logotyp och knappar ligger bredare än navigeringen och innehållskorten. Begränsa och centrera sidhuvudets innehåll så att det följer huvudinnehållets verkliga bredd och kanter även vid olika fönsterbredder; bevara responsiv mobilplacering och sidhuvudets befintliga funktioner. Läskontroll visar en separat `max-width:1130px` för hosthuvudets `.headinner` medan hostens `.maincol` har en snävare maxbredd, men exakt inpassning behöver mätas inklusive padding. Ingen appändring gjord; inväntar körbesked. Rekommenderad modell: GPT-6.1 Terra.

#338: användaren upplever att konfettin skjuts för långt över mitten, vilket lämnar ett hål nedtill i mitten. Prova en måttlig förändring av banorna/spridningen från båda hörnen, med täckning även i nedre mitten och bibehållen effekt över hela skärmen. Jämför mobil och bred skärm och bevara upp- och nedfärdens tidigare överenskomna tempo. Ingen appändring gjord.

#284 återöppnad: användaren uppger att konfettin till sist slutar fungera efter många knapptryck. Undersök och reproducera faktiskt förlopp på host och spelare, även när tidigare skurar fortfarande pågår och efter att de städats bort. Nuvarande effekt skapar 432 animerade partiklar per tryck och hostens nätverkskommandon köas; belastning, städning och händelseleverans är relevanta granskningsspår, men orsaken är inte fastställd. Behåll möjligheten att skjuta flera skurar och testa rimlig resursanvändning, återhämtning samt reduced motion. Ingen appändring gjord. Rekommenderad modell för #284 och #338: GPT-6.1 Terra high.

Efter körbesked: 12 snabba hosttryck gav lokalt 5 184 partiklar per enhet och alla 12 kommandon nådde fram; det rapporterade stoppet reproducerades inte. Effekten begränsar nu antalet aktiva skurar till tre (1 296 partiklar) per enhet; utlösningar när alla platser är upptagna samlas till en väntande skur, medan pågående skurar slutförs. Därefter kan nya tryck utlösa konfetti igen. #338 minskar den horisontella överflygningen och ger båda hörnens banor täckning i nedre mitten. Lokala pilot-UI-proven passerade 5/5, inklusive 12 snabba tryck, levererade kommandon, partikelgräns, fortsatt funktion efter städning och båda skärmstorlekarna. Separat upprepat UI-prov bekräftade också att minskad rörelse rensar väntande skurar. Konfigurationsproven 5/5, pilotbygget och interceptat HTTPS-prov passerade. Verklig prestanda och det ursprungliga felets orsak återstår att verifiera.

Publicerad i [run42529524063](https://github.com/BadBagel47/buzzy/actions/runs/42529524063) från commit `5cadbca20e5ea3b91d660309c00f1c9bc92ac634`. Offentlig körningsstatus är success; användaren bekräftar att live valdes. Riktigt visuellt prov och belastningsprov återstår.

#337: spelet ska ligga på `buzzy.trythis.one`. HTTPS-värden är tillåten i källan och testas med avlyssnade anrop. Hosting-workflowet har ett uttryckligt val för `pilot` eller `live`; båda använder samma säkerhetskontroll och testade Hosting-bygge, och live-kommandot väljer endast Hosting. Användaren har konfigurerat Firebase och CNAME-posten i Cloudflare som DNS only. Live är publicerat, men Firebase utfärdar ännu certifikatet. Se [WEBBSETUP.md](WEBBSETUP.md).

Uppföljning #284 och ny #336: varje tryck ska kunna ge en ny skur samtidigt som tidigare konfetti fullföljer sin animation. `createCelebration().launch()` anropar idag `clear()` först, vilket avbryter alla pågående animationer. Separera skurarnas livstid och städning, behåll reduced motion och inställningen för effekter, och undersök även att snabba tryck och vidareförmedling till spelarna inte tappas: hostens gemensamma `operation` ignorerar anrop medan den är upptagen och databasen lagrar senaste firandehändelsen. För #336 ska nedfärden göras långsammare utan att sakta ned uppskjutningen. Undersök resursanvändning vid flera samtidiga skurar. Ingen appändring gjord; inväntar körbesked. Rekommenderad modell för detta paket: GPT-6.1 Terra high.

Efter körbesked: varje konfettiskur äger sina egna 432 partiklar och städas separat; hostens upprepade tryck köas under pågående kommando. Minskad rörelse och avstängda effekter rensar skurarna. Varje tryck skickar en händelse via befintlig Firebase-väg. Pilot-UI-proven passerade 5/5 och omfattar överlappning hos spelare, snabba hosttryck, separat städning och tidsfördelning; kontroll på verkliga mobiler och belastning vid många skurar återstår. Konfigurationsproven passerade 5/5, Hosting-säkerhetsproven 20/20 och HTTPS-provet för bland annat den nya domänen passerade med avlyssnade anrop.

Run42524163679 lyckades med källcommit `53f7d688f05ad9590d8e3ede497f7f47308b7aa0`; användaren bekräftar att Hosting-målet `live` valdes. Firebase har verifierat domänen men visar Minting certificate, vilket enligt konsolen kan ta upp till 24 timmar. Användaren fick certifikat-/anslutningsfel vid första försöket; faktiskt domänprov återstår när certifikatet är klart. Offentlig körningssida verifierar success och commit, inte valt mål; destinationsuppgiften kommer från användaren.

Källändringarna #316/#333/#334 är publicerade i [run42480785493](https://github.com/BadBagel47/buzzy/actions/runs/42480785493), från commit `61997189e512da16d327b1c93c934a38a676c26a`. Körningen lyckades. Hosting-emulatorn svarade på `/host` och `/player`, omdirigerade de äldre `.html`-adresserna och behöll frågeparametrar samt `no-store` för `/host`. Mobilprov återstår.

Det extra `test:ui`-provet bekräftade korrekt och felaktig resultatikon, men hela provet misslyckades vid separat scenario med avstängd spelare: statusytan fångar trycket och dess egen lämna-länk syns inte. Detta följs upp i #335.

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

Användaren godkände paketet med ”Kör dem”. #292, #294, #296:s spelarstil och #298–303 är nu genomförda. Se [UI_BATCH_292_303.md](UI_BATCH_292_303.md). Äldre noteringar om ”ingen implementation” ovan beskriver registreringssteget före detta körbeslut. #293:s upplevda spelaråteranslutning är fortfarande öppen; inga nya regler eller ändrad avslut-semantik ingår. Nästa fria ID är #314.

## #304 — bottenmenyns visuella balans och rörliga markering

Användaren rapporterar efter senaste UI-publiceringen att lika breda knappar känns ojämnt balanserade när ikon/text tar olika mycket plats. Tillåt innehållsanpassade bredder, med enhetlig luft runt innehållet och en centrerad ikon/textgrupp i varje knapp. Kontrollera särskilt Play, som upplevs ocentrerad. Den aktiva bakgrundsmarkeringen ska följa den faktiska knappens läge OCH bredd och animera båda vid byte, även mellan korta och långa etiketter. Behåll textens nya miniminivå, läsbara etiketter, tryckytor, safe area, reduced motion och stabilitet vid snabba upprepade tryck/rotation. Prova främst Android/Brave och smala mobilbredder.

Läskontroll: den frysta generatorbasen har grid-template-columns:repeat(4,minmax(0,1fr)). Markeringen använder en fast fjärdedelsbredd och --nav-index för förflyttningen; transition omfattar endast transform. Ikon/text centreras med flex, men markeringens verkliga geometri och Play-symbolens optiska centrering behöver mätas vid implementation. Bilden ensam bevisar inte vilken av dessa som orsakar centreringsintrycket. Ingen ändring gjord i generator, CSS eller app.

## #305 — sidrubrikernas höjd

Användaren vill använda Play-rubrikens vertikala placering som referens för motsvarande översta rubrik i övriga hostvyer. Play har knappar till höger; deras närvaro ska inte göra att rubrikens höjd skiljer sig från Players, Questions och Settings. Använd en gemensam rubrikrad/vertikal inpassning och konsekventa marginaler utan att lägga till onödigt utrymme. Behåll stillastående kort inom vyanimeringen och samma slutliga avstånd till innehållet.

Läskontroll: vyerna delar .appbar, men Play får .appbar-play med egna layoutregler och explicit margin:0 på h1. Knapparnas höjd påverkar dessutom den radens höjd. Den exakta skillnaden i mobilens rendering ska verifieras i nästa körning. Ingen UI-ändring eller ny publicering gjord.

#304–305 samlas enligt användarens etablerade arbetssätt; rapporten är inget nytt körbeslut. Rekommenderad modell för gemensam implementation: GPT-6.1 Sol med högt resonemang. #293 kvarstår separat. Nästa fria ID är #314.

## #306 — Quick Play-panelen saknar utfällningsanimation

Användaren rapporterar att ett tryck på Quick Play för att fälla ut fler inställningar visar panelen utan synlig utfällningsanimation. Nästa körning ska verifiera och rätta panelens befintliga öppnings-/stängningsförlopp, även vid upprepade tryck och nätuppdateringar. Bevara inmatat innehåll, fokus och reduced-motion-beteende.

Läskontroll: den befintliga renderaren har redan quickContentTransition och höjdanimation på .play-mode-content, samt en inträdesanimation på .quick-content-panel. Animationen är bland annat villkorad av att föregående panelhöjd är större än noll. Förekomsten av animationskod bevisar inte att den syns i livevyn; exakt orsak är ännu inte fastställd. Ingen appändring eller nytt test kört i registreringssteget.

## #307 — flimmer vid inställningsbyte och leaderboard-delning

Reproduktion A: öppna poängalternativet för rätt svar i Play; växla upprepade gånger mellan det och alternativet för minuspoäng/fel svar. Den utfällda rutan flimrar. Reproduktion B: tryck på switchen som visar leaderboard för alla; användaren har sett flimmer även där. Exakt vilken yta som blinkar i B är ännu inte avgränsat. Kontrollera vid implementation båda tillstånden och om snabba växlingar/nätåterkoppling förstärker problemet.

Läskontroll: patchHostQuickControls kan ersätta editorns innerHTML vid panelbyte och animerar höjd tillsammans med opacity från .7 till 1. setLeaderboardShare renderar vid ändring, och vid avstängning finns dessutom en render efter stängningstiden. Nätbryggans operation/project kan ge ytterligare renderingar efter publicering av ändrade inställningar. Detta är granskningsspår, inte verifierade rotorsaker till mobilflimret.

Målet är stabil, sammanhängande målning med bibehållna panelnoder där det behövs, utan synliga återstarter eller korta blinkningar när inställningen ändras. Behåll önskade befintliga övergångar, korrekt delning till deltagarna och deras egna öppnings-/stängningsförlopp. Samma krav som tidigare gäller: kort och listposter ska ligga still inom en vyanimation; lägg inte till egna kortanimationer.

#304–307 är nu samlade inför nästa gemensamma körbeslut. Rekommenderad modell: GPT-6.1 Sol med högt resonemang. Inga UI-ändringar eller publiceringar gjorda för dessa fyra punkter. #293 är fortsatt separat. Nästa fria ID är #314.

## #308 — ta bort dubblerad QR-ingång i Settings

Användaren vill ta bort QR under Room information eftersom funktionen nu finns i sidhuvudet. Detta avser Show QR-knappen i Settings-kortet. Behåll QR-knappen i sidhuvudet och dess befintliga fullskärmsvy med QR/webbadress/rumskod. Övrig rumsinformation och länkkopiering omfattas inte av borttagningen. Samlas med #304–307 enligt det etablerade arbetssättet; ingen UI-ändring gjord nu. Vid implementation ska motsvarande test som väntar på Settings QR-ingång uppdateras, medan headerns QR-funktion och fullskärmsprov bevaras.

Nu samlade punkter: #304–308. Modell för nästa gemensamma körning: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #314.

## #309 — Room settings hopfällt från start

Alla utfällbara sektioner under Room settings ska börja hopfällda: Game and room, Display samt Sounds and effects. Källan initialiserar nu settingsOpen till game:true, display:true, effects:false. Ändringen gäller standardläget; användarens öppning/stängning ska sedan behållas under den aktuella vyn/sessionen och inte återställas av nätuppdateringar eller renderingar. Behåll befintliga tillgänglighetsattribut och jämna utfällningsanimationer. Ingen implementation gjord nu.

## #310 — placera firandeknappen vid Visual effects

Flytta den befintliga Launch final celebration-knappen från Session and history till Visual effects under Sounds and effects, tillsammans med inställningarna för firandet. Behåll en enda knapp och befintligt utlösnings-, av/på- och reduced-motion-beteende. Historikdelen ska fortsatt ha historikfunktionen. Ingen UI-ändring gjord nu.

## #283–284 — konfettistatus förtydligad 2026-11-07

På frågan om hörnutkastet redan är fixat: nej. Det tidigare underlaget i buzzy-output/BUZZY_CONFETTI_283_284.md säger uttryckligen att ingen produktändring körts. Underlaget har nu kopierats till [CONFETTI_283_284.md](CONFETTI_283_284.md) så att punkterna finns i den gemensamma repolistan. Kontroll av generatorbas, generator och genererad app bekräftar att confetti() fortfarande skapar partiklar över hela bredden som faller uppifrån, och att städtimern inte avbryter/ogiltigförklarar tidigare anrop. Detta är alltså väntande arbete, inte ett verifierat återfall efter en tidigare rättning. Det gamla diagnosprovet för #284 är historisk evidens; inga nya tester eller appändringar kördes nu. Behåll de ursprungliga ID-numren.

Samlat väntande UI/effektarbete är nu #304–310 samt de tidigare ogjorda #283–284. #293 kvarstår som separat funktionsärende. Modell för nästa samlade körning: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #314.

## #311 — firandeknappens text och färg

Den befintliga Launch final celebration-knappen ska heta exakt Launch celebration for all. Använd samma etablerade normala hostknappsfärger som övriga vanliga knappar, i stället för en egen accentfärg. Behåll konsekvent typografi, form, tryck-/fokusbeteende och befintlig utlösning till alla. Kombinera med #310:s flytt till Visual effects så att bara en knapp finns. Ingen UI-ändring gjord nu.

## #312 — röd kant på End game

Användaren upplever nuvarande färg som gulorange och önskar en röd outline. Utforma End game som en knapp med tydligt röd normal kant enligt hostens befintliga farofärg, med läsbar matchande text. Detta avser knappens synliga kant; tangentbordets fokusmarkering ska fortfarande fungera. Befintlig bekräftelsedialog och avslut-för-alla-semantik bevaras. Ingen färg-/CSS-ändring eller ny publicering gjord i registreringssteget.

Nu samlade UI-punkter #304–312 samt de tidigare ogjorda konfettipunkterna #283–284; #293 separat. Modell för nästa gemensamma implementation: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #314.

## #313 — enhetlig fri yta ovanför bottenmenyn

Användaren visar två mobilbilder av Settings med webbläsarens verktygsrad i olika lägen. Sista kortets nederkant/innehåll är delvis täckt i det ena läget; i det andra syns kortet men slutmellanrummet är mindre än avståndet mellan korten. Det önskade måttet är avståndet från sista kortets nederkant till appens bottenmenys överkant, och detta ska motsvara det etablerade mellanrummet mellan korten. Använd samma mått/princip i Play, Players, Questions och Settings, där nuvarande slutavstånd upplevs olika.

Vid full nedskrollning av längre innehåll ska hela sista kortet och dess nedre kant kunna nås ovanför appens meny, med det angivna fria mellanrummet. Prova både visad och dold webbläsarverktygsrad, ändrad tillgänglig höjd, stående/liggande mobil samt relevanta safe-area-insets. Beakta #304:s kommande menybredder/höjder och textens miniminivå; håll reserverat utrymme samordnat med menyns faktiska storlek. Kortmellanrum och slutmarginal ska använda ett gemensamt mått över vyerna.

Läskontroll: nuvarande källa kombinerar en position:fixed-bottenmeny med safe-area-padding, flera responsiva shell-paddingregler och en separat 30px-slutspacer från renderaren. Registrera dessa som granskningsspår; exakt samspel med Android/Braves dynamiska webbläsarverktygsrad är inte verifierat i detta steg. Ingen app/CSS-ändring, testkörning eller ny publicering gjord.

Nu samlat UI-arbete #304–313 plus de tidigare ogjorda #283–284; #293 separat. Rekommenderad modell vid nästa gemensamma körning: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #314.

## Genomfört paket efter ”Kör de i listan”

Användaren godkände de tolv sammanställda punkterna #304–313 och #283–284. De är nu genomförda i källan och både den riktade UI-/effektregressionen och slutproven är gröna. Se [UI_REFINEMENTS_304_313.md](UI_REFINEMENTS_304_313.md). Äldre avsnitt ovan beskriver registreringarna före detta körbeslut. #293 och #290 ingår inte i paketet. Nästa fria ID är #315.

Publicering av paketet #304–313/#283–284 är verifierad i [run42347839035](https://github.com/BadBagel47/buzzy/actions/runs/42347839035), källa 97d0b4aed18229b17b786a58a9580ac1d792df76. Samtliga steg i verify/pilot är gröna; Hosting-steget klart 2026-11-07T06:40:16Z. Fysiskt mobilprov återstår.

## #313 — återöppnat efter riktiga mobilbilder

Två nya bilder från Android/Brave efter publiceringen av källa 97d0b4aed18229b17b786a58a9580ac1d792df76:

1. Settings: när användaren skrollar upp lyfts appens bottenmeny ibland från nederkanten. Sidinnehåll syns under menyn ovanför webbläsarens nedre verktygsrad. Menyn ska vara förankrad vid den tillgängliga spelytans nederkant även när webbläsarens rader ändrar läge.
2. Questions med tom kö: sidan går att skrolla trots att innehållet borde få plats. Det finns ett stort tomt område under kökortet, och sidhuvud/rubrik har kunnat skrollas bort. Undvik extra skrollhöjd från layoutens minhöjd, slutreserv eller dubbel kompensation. Långa vyer ska fortsatt kunna skrollas till allt innehåll med det avtalade slutmellanrummet.

Behåll ID #313 för båda närliggande layoutfelen; skapa inte en ny dubblett. Läskontroll av aktuell implementation visar att skillnaden innerHeight−visualViewport.height−offsetTop används både som bottom på den redan fixerade menyn och som extra padding under innehållet. Den frysta basstilen har dessutom min-height:100vh på body. Dubbel kompensation respektive skillnaden mellan största och aktuella viewporthöjd är konkreta granskningsspår, inte fastställda rotorsaker: inga dynamiska mått från användarens telefon finns ännu.

Tidigare automatiska viewportprov passerade men verifierade inte det verkliga skrollförloppet med Braves verktygsrader. Kommande rättning behöver prova det förloppet, samt att korta vyer saknar onödig overflow och att långa vyer fortfarande har rätt slutmarginal. Ingen app/CSS-ändring, ny testkörning eller publicering gjord vid denna registrering. Rekommenderad modell vid nästa körning: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #315.

## #314 — fylligare konfetti och långsammare nedfärd

Användaren vill ha mer och större konfetti som sprids över hela skärmen. Utkasten från de nedre hörnen ska fortfarande gå upp lika snabbt, men partiklarna ska dala något långsammare efter toppen. Användaren vill avstå om detta kräver ett stort ingrepp.

Läskontroll: src/celebration.js styr redan hela effekten lokalt med 64 partiklar, separata banors höjd/sidled samt WAAPI-nyckelrutor. Storleken ligger i src/room-ui.css (nu 8×14px). Upp-/nedfärd kan få olika tidsfördelning genom nyckelrutornas offsets och total varaktighet, så uppflygningens faktiska tid hålls kvar medan nedfärden förlängs. Det räcker alltså med en begränsad ändring i den befintliga effekten; någon ny server-/spelfunktion behövs inte. Ingen fix genomförd eller ny effekt provad vid denna bedömning.

Vid genomförandet: öka mängd/storlek och spridning med en rimlig partikelbudget för mobil. Behåll de två nedre ursprungen, färgpaletten, reducerad rörelse/avstängning och skyddet för upprepade utlösningar. Städning ska följa den nya faktiska sluttiden. Öka inte bara total varaktighet för hela banan, eftersom det även skulle sakta ner uppflygningen. Verifiera banornas täckning, oförändrad uppflygningstid och längre nedfärd samt att den större effekten känns jämn på mobil.

#314 samlas med den återöppnade #313 inför nästa körbeslut. Rekommenderad modell: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #315.

### Förtydligande till #314

Med ”större” avsåg användaren främst spridningen över skärmen. Prioritera bredare/högre täckning framför större enskilda bitar. En måttlig ökning av bitarnas storlek är också välkommen, men är sekundär och behöver inte bli dramatisk. Önskemålen om mer konfetti, snabb uppflygning och något långsammare dalning kvarstår. Detta är ett förtydligande av samma #314, ingen ny punkt eller nytt körbeslut.

## #304–305 — återöppnat efter jämförande mobilbilder

#304: användaren upplever att TEXTEN i bottenmenyns Play-knapp fortfarande inte är centrerad. Kontrollera faktisk optisk textcentrering med ikonens plats och den aktiva markeringen, både vald och ovald. Att hela ikon/textgruppen eller markeringens rektangel är matematiskt centrerad räcker inte som enda godkännandemått. Behåll innehållsanpassade olika knappbredder och fungerande animering av markeringens position/bredd. Ingen ny ID behövs.

#305: jämför både sidrubrikernas placering och första kortets övre kant mellan Play, Players, Questions och Settings. Användaren förklarar att rubrikerna upplevs ligga olika eftersom korten börjar på olika ställen. Play är fortfarande bästa referensen, men ligger själv något för högt: justera den gemensamma inledande placeringen något nedåt och samordna samtliga vyer. Behåll konsekvent marginal mellan sidhuvud, rubrikrad och första innehållsruta, med snygg inpassning även när Play har knappar till höger. Ingen ny ID behövs.

Läskontroll: den frysta basen har margin-bottom:19px på .appbar men 12px på .appbar.appbar-play. Det senaste paketet enhetliggjorde rubrikens minhöjd men ersatte inte dessa olika underkanter. Den tidigare geometrikontrollen jämförde rubrikboxarnas centerhöjd och slutmarginalen, inte första kortets startkoordinat. Utöka nästa prov med rubrik och första innehållsruta relativt samma sidhuvud, samt visuell kontroll av Play-texten. Dessa kodfynd är verifierade; någon ny browserreproduktion eller UI-rättning har inte körts i registreringssteget.

Återöppnade #304–305 samlas med #313 och den nya konfettiförfiningen #314 inför nästa körbeslut. Modellrekommendation GPT-6.1 Sol med högt resonemang. Nästa fria ID är fortsatt #315.

## #315 — enhetligt inre bottenutrymme i Players-korten

Användaren upplever olika mycket utrymme i botten INUTI korten i Players. Disconnected players verkar ha för mycket luft jämfört med andra kort både i Players och övriga vyer. Samordna avståndet från sista synliga innehållet till kortets nederkant enligt det etablerade kortmåttet, med hänsyn till olika innehåll. Detta gäller kortens inre luft; #313 avser i stället mellanrummet utanför sista kortet mot bottenmenyn och #305 de översta positionerna.

Läskontroll: Disconnected och Banned använder en direkt p.muted i tomt läge. CSS .theme-a .card.dynamic-player-card>.muted lägger 12px vertikal padding på den texten utöver kortets egen padding. Connected har tomtexten inuti .connected-player-list och träffas inte av samma direktbarnsregel. Detta är en konkret skillnad att kontrollera vid nästa körning; exakt visuellt bidrag har inte mätts i ett nytt browserprov nu.

Prova tomma och fyllda listor, jämför kortens faktiska innehålls-/bottenmått och övriga hostvyer, och behåll spelarhantering, informationsrutor och responsivt beteende. Ingen app/CSS-ändring, testkörning eller ny publicering gjord vid registreringen. Samlas med #304, #305, #313 och #314. Modellrekommendation GPT-6.1 Sol med högt resonemang. Nästa fria ID är #316.

### Uttryckligt undantag till #315

Användaren förtydligar att de utfällbara sektionerna under Settings har andra avstånd, men att dessa är korrekta och INTE ska ändras. Undanta deras befintliga padding, mellanrum och öppna/hopfällda layout från normaliseringen i #315. Använd inte en generell kortregel som även träffar Settings-accordionernas interna avstånd. #315 gäller den rapporterade obalansen i Players-korten, med övriga vanliga kort som jämförelse. Undantaget ändrar inte de separat rapporterade problemen med vyernas inledande placering (#305) eller den yttre slutmarginalen mot bottenmenyn (#313). Detta är ett förtydligande av samma punkt, inte ett nytt ID eller körbeslut.


## Uppföljningsbatch #304, #305, #313, #314 och #315 efter ”Kör”

Källändringarna är genomförda. #304: Play-etiketten centreras optiskt genom att justera dess ikon/textplacering; knappbredderna fortsätter följa innehållet och markeringen använder knapparnas faktiska geometri. #305: Play-radens bottenmarginal matchar övriga vyer och alla rubriker/första kort flyttas gemensamt 3px ned. #313: bottenmenyn har fast `bottom:0`, scrollberoende visualViewport-offset borttagen och hostens ärvda `min-height:100vh` upphävd; slutreserven baseras fortsatt på uppmätt menyhöjd plus samma kortmellanrum. #314: konfettin ökas från 64 till 96 bitar, får bredare/högre banor och måttligt större bitar; uppflygningen behåller 800–1000ms medan nedfärden blir 1100–1350ms. #315: extra 12px vertikal padding tas bort endast från tomma direkta muted-paragrafer i Players-kort. Settings-accordionernas befintliga avstånd/layout lämnas helt orörda.

Vid källändringen var dessa ändringar ännu inte testade eller publicerade. De befintliga partikelantalspåståendena i integrationerna uppdaterades till 96 för att motsvara det nya beteendet. Nästa fria ID är fortsatt #316; #293 och #290 ligger separat.


### Publiceringsstatus för uppföljningsbatchen

Publicerad efter körbeslut i [run42370960695](https://github.com/BadBagel47/buzzy/actions/runs/42370960695) från källa `975b94b0b8f28a75ac0043037b0d58fc174793c0`. Verify-jobbet (14 steg) och pilotjobbet (15 steg) passerade; Hosting-steget slutfördes 2026-11-07T12:08:37Z. Publiceringens kanal är https://buzzy-197dc--pilot-mrst5vi1.web.app. Ingen Firebase-regeländring ingick. Fysisk Android/Brave-kontroll återstår.


## #316 — Room not found är otydligt

Användaren upplever att ”Room not found” inte tydligt förklarar vad som hänt eller vad deltagaren ska göra. Läsgranskning visar att klienten returnerar råtexten `Room not found.` från room lookup och `entry.js` visar fångat fel i en generell sidstatus efter host-alternativet. Det är inte kopplat visuellt till rumskodsfältet.

Den publicerade implementationen visar ett felbesked direkt under rumskoden, markerar fältet ogiltigt och behåller den inmatade koden. Användaren vill nu korta själva texten till endast: “We couldn’t find a room with that code.” Ta bort den efterföljande meningen. Behåll fältkopplingen och övrigt felbeteende. Detta är en återöppning av #316, inte ett nytt ID. Ingen appändring eller test gjord för copyjusteringen; inväntar körbeslut enligt arbetssättet.

## #317 — visuell centrering i rumskodsfältet

När tomrummets punkter/markörer visas upplevs insättningsmarkören eller själva punktgruppen inte ligga i centrum. Användaren vet inte vilken av dem som ger intrycket. Källgranskning hittar i frysta landing-stilarna centrerad text plus `text-indent` och separata `letter-spacing`-värden för riktig kod (`.22em`) respektive placeholder (`.3em`). Generatorn för livevyn kortar placeholdern till fyra punkter. Detta gör de olika måtten till ett konkret spår, men orsaken är inte fastställd utan visuell jämförelse.

Vid implementation: jämför det tomma, fokuserade fältet (markör och punkter), tomt ofokuserat fält och delvis/fullt ifylld kod på mobil. Samordna centreringen så placeholder och faktisk kod delar samma visuella mitt; undvik att dekorativa tecken flyttar insättningsmarkören. Ingen CSS-, generator- eller teständring gjord.

### #317 återöppnad efter publicering

Efter publicering i run42380847677 upplever användaren fortfarande att insättningsmarkören på förstasidan inte hamnar i mitten, alternativt att punktgruppen i fältet är förskjuten. Den tidigare ändringen tog bort extra `text-indent` och matchade teckenavståndet mellan placeholder och riktig kod. Det tillhörande testet verifierar CSS-värdena, men inte den faktiskt renderade positionen för markör/glyfer. Rotorsaken är därför fortfarande okänd. Bevara den frysta v1-referensen; granska den aktiva genererade sidan och jämför tomt ofokuserat, tomt fokuserat och ifyllt fält i riktig mobilvy innan en riktad rättning. Ingen kodändring eller ny publicering gjord i denna uppföljning. Rekommenderad modell för den avgränsade visuella korrigeringen: GPT-6.1 Luna Max.

#316–319 registrerade efter publiceringen av uppföljningsbatchen; de ingår inte i den. Rekommenderad modell för senare samlad UI-implementation: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #320.

## #318 — enhetlig färg på Buzzy-logotypen

Ta bort den separata accentfärgen från z:et i alla aktiva Buzzy-logotyper. Z:et ska ärva ordets vanliga textfärg i respektive vy, så logotypen behåller läsbar kontrast på både ljus och mörk bakgrund; använd alltså inte en enda textfärg överallt. Behåll däremot förstasidans accentfärg på punkten och använd just den färgen på punkten vid alla andra aktiva logotypställen. Ändra inte logotypens text, storlek, avstånd eller övriga form.

Källkontroll hittade olika varianter i de aktiva vyerna: landningssidans generator bygger från `buzzy-output/buzzy_landing_v1.html`, där `.brand span` färgar både z och punkt med `--accent: #80a8ff`; bas-headern för spelare och host färgar z med `.brand b` (`--blue: #315de8`) och punkten separat (`#315de8`); QR-delningen färgar bara punkten (`#67a5ff`). Användaren har bekräftat att landningssidan ska rättas och förtydligat att z:ets vanliga textfärg ska fortsätta följa kontrasten i respektive vy, medan själva punkten ska använda landningssidans accent (`#80a8ff`) överallt. Justera därför aktiva generator-/renderingsvägar, men bevara den frysta v1-referensfilen. Kontrollera samtliga aktiva logotypställen: landningssida, host, spelare och QR-delning. Ingen app-, CSS- eller generatorändring, test eller publicering gjord.

Samlas enligt arbetssättet före implementation. Rekommenderad modell: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #320.

## #319 — tydligare vänteläge vid omladdning av spelarvyn

Vid omladdning av en spelarvy som tidigare var ansluten blinkar en tom mörk sida till med statusen ”Connecting to your room…” och en Leave room-länk. Statusen hinner inte läsas innan sidan byter läge. Användaren önskar ett avsiktligt, lugnt vänteläge med Buzzy-logotypen centrerad. Om återinloggning/återanslutning inte lyckas ska det relevanta beskedet ligga kvar tillräckligt länge och förklara nästa steg, till exempel återförsök eller att kontrollera om rummet fortfarande är öppet.

Det visuella vänteläget ska samordnas med #293:s funktionella återställning av spelarens befintliga rumssession efter omladdning/nätbyte. Det här ID:t gäller läsbar status och presentationen under övergången; #293 fortsätter att gälla lyckad återanslutning och korrekt felhantering. Ta inte bort eller maskera ett slutligt fel med en evigt laddande logotyp. Ingen app/CSS-ändring, test eller publicering gjord vid registreringen.

Samlas enligt arbetssättet före implementation. Rekommenderad modell: GPT-6.1 Sol med högt resonemang. Nästa fria ID är #320.

## Genomförande #316–319

Efter användarens ”Kör” är #316–319 implementerade i källan. #316 visar Room not found direkt under rumskoden, behåller den inmatade koden och ger ett tydligt nästa steg. #317 tar bort den extra textindragningen och ger platshållaren samma teckenavstånd som den riktiga koden. #318 låter z:et ärva logotypens lokala textfärg och använder landningssidans accentfärg `#80a8ff` på punkten vid landning, host, spelare och QR-delning; den frysta v1-referensen är orörd. #319 visar under omladdning en centrerad logotyp och beständig status, med återförsök och lämna-länk när anslutningen misslyckas. Detta är endast återkoppling och presentation; funktionell återanslutning i #293 är inte ändrad.

Verifiering: `npm run build` passerade; `npm run test:room-ui` passerade med felkod, centrering, logotyp, omladdningsläge och anslutningsfel; `npm run test:pilot-ui` passerade 4/4 prov. Emulatorerna använde lokalt demo-projekt, inte Buzzy-projektets Firebase-kvot. Publicerad som pilot i [run42380847677](https://github.com/BadBagel47/buzzy/actions/runs/42380847677), från källcommit `1d2d4102147ee937e2ebe8cf51484e048cbe21f3`; workflowet slutfördes framgångsrikt. Endast pilotkanalen publicerades, med ett dygns giltighet; inga databasregler ändrades. Android/Brave-mobilprov återstår. Rekommenderad modell för denna avgränsade UI-batch var GPT-6.1 Luna Max; #293:s nätverks- och sessionsarbete bör fortsatt använda GPT-6.1 Sol med högt resonemang. Nästa fria ID är #320.

## #320 — Hostvyn flyttar sig efter vybytesanimation

Användaren ser att rubriken och innehållskorten hamnar en bit längre ned först när animationen mellan hostvyerna har avslutats. Ny observation: vid byte till Questions rör sig Question queue-kortet uppåt efter animationen. Jämför rubrikens och första kortets slutgeometri före och efter Play, Players, Questions och Settings-vybyten, inklusive upprepade/snabba byten och både visad och dold mobil-webbläsarrad. Ingen CSS- eller animationsändring gjord. Rekommenderad modell för felsökning/rättning: GPT-6.1 Sol med högt resonemang, eftersom förskjutningen uppträder i övergångens slutskede.

## #321 — Hostens sidhuvud förskjuts vid inladdning

Vid första inladdning eller omladdning visas hostens sidhuvud först på en position och rör sig sedan när sidan laddas färdigt. Önskat beteende är att huvudet ligger stilla från första renderingen; kontrollera om tillgänglig viewport, sena typsnitt/stilar eller innehållsmått orsakar omflödet, utan att anta rotorsaken. Verifiera kall laddning och omladdning på mobil samt att rumsstatus och headerknappar inte ändrar storlek/placering när anslutningen blir klar. Ingen appändring eller ny publicering gjord. Samlas med #320; rekommenderad modell GPT-6.1 Sol med högt resonemang. Nästa fria ID är #322.

## #304 — återöppnad efter nytt mobilprov

Användarens nya mobilbild visar att Play-knappens ikon och text fortfarande upplevs förskjutna åt vänster inom den markerade knappen. Senaste observationen preciserar ett synligt fel: det saknas mellanrum mellan blixtsymbolen och Play-texten, fastän övriga bottenknappar har mellanrum. Jämför ikon/textplacering med markeringens kanter i valt och ovalt läge och återställ ett enhetligt mellanrum på relevanta mobilbredder. Den aktiva CSS-koden har särskilda horisontella förskjutningar på ikonen och texten; de är ett granskningsspår, inte en fastställd orsak. Registrerat utan appändring eller publicering. Rekommenderad modell för rättningen: GPT-6.1 Terra; Luna kan användas för mindre avgränsade ändringar och registreringar.

Ny återkoppling efter publiceringen av #316/#333/#334: användaren upplever fortfarande att Play-knappens ikon och text tillsammans inte ligger i mitten av den blå markeringen. Mät både knappens och markeringens verkliga geometri samt den synliga ikon-/textgruppens optiska balans i valt och ovalt läge på mobil. Jämför med de andra knapparna och behåll mellanrummet och markeringens animation. Bilden fastställer inte ensam orsaken eller åt vilket håll en justering behövs. Ingen ny appändring gjord; inväntar körbesked. Rekommenderad modell: GPT-6.1 Terra high.

Efter körbesked: lokal mätning vid 390 CSS-px visar att ikonens synliga kontur och texten tillsammans låg cirka 1,5 px till höger om knappens mitt, trots att knapp och markering sammanföll. Hela ikon-/textgruppen flyttas därför 1,5 px åt vänster vid horisontell layout; staplad layout vid högst 360 px behålls. `test:refinements` kontrollerar synligt gruppcentrum på flera bredder samt markeringens geometri och passerade; pilotbygge och `test:pilot` passerade också. Inte publicerat eller bekräftat på fysisk mobil ännu.

Run42508028844 misslyckades i `reconnect.integration.mjs` när ett nytt rum skulle skapas efter simulerat nätavbrott; `ready` nåddes inte inom 30 sekunder. Testet passerade lokalt både före och efter att hostfliken uttryckligen satts i förgrunden innan klicket; hela `test:pilot-ui` passerade därefter 5/5. Timeoutens orsak på GitHub är inte fastställd; testet skriver nu mer diagnostik vid nästa timeout. Ingen ändring i spelets återanslutningslogik.

## #324 — centrerade stängkryss

Mobilbilden på ”Move to the next question?” visar ett kryss vars placering upplevs felcentrerad. Round overview-bilden visar dessutom att close-knappen har en ljus yta och blått kryss mot mörkt modaltema. Användaren överväger nu ett ljust tema för hela hostens Round overview och host-Leaderboard; spelarens Leaderboard ska fortsätta vara mörk. Källan har delvis gemensamma regler för host- och spelarleaderboard, vilket behöver delas efter kontext. Gör en full inventering av alla aktiva stängknappar innan rättning: `.studio-close` i vanliga dialoger, `.lb-close` i leaderboard/round overview/buzz order, `.mini-close` i snabbinställningspaneler och `.room-share-close` i QR-delningens helskärmsvy. Kontrollera alternativa roll-/temastilar, responsiva storlekar, glyphens visuella centrum i tryckytan samt tryckytans storlek och placering i rubraden. Samordna färger med dialogens rolltema utan att missa tillgänglighetsnamn eller stängbeteende. Läskontrollen hittade att `.mini-close` saknar uttrycklig grid/centrering och att `.lb-close` har flera temavarianter; detta är granskningsspår, inte fastställd rotorsak för alla kryss. Ingen UI-ändring eller visuell körning gjord. Rekommenderad modell för audit och rättning: GPT-6.1 Terra.

## #325 — antal spelare i Play

Visa en kompakt spelarräkning kvar på hostens Play-vy. Förslag: lägg en liten etikett på befintlig Buzz results-rubrikrad, bredvid resultat-/buzzräkningen, så ingen ny kortyta eller vertikal höjd tillkommer. Källan har redan `activePlayers()` och visar samma tal som nämnaren i `x/y buzzes`; detta avser aktiva rumsdeltagare. Den läser inte tillförlitlig närvaro för varje enhet just nu, så märk inte talet som telefoner som bevisligen är online. Lösningen bör inte lägga till nya Firebase-lyssnare eller trafik. Ingen UI-ändring gjord. Rekommenderad modell för denna avgränsade UI-ändring: GPT-6.1 Terra.

## #326 — fullbreddsknapp för ny fråga

I Questions-vyn ligger “+ New question” nu bredvid introduktionstexten. Flytta knappen till en egen rad ovanför texten i samma ruta och använd den befintliga fullbreddsmallen för åtgärdsknappar. Ta bort plustecknet om det behövs för att följa samma knappstil och etiketter som övriga vyer. Behåll befintlig åtgärd och formulär. Ingen kodändring gjord. Rekommenderad modell för denna avgränsade UI-ändring: GPT-6.1 Terra.

## #327 — Round overview bedömningsstatus

I mobilbilden av Round overview visas `No points awarded` och rundstatusen `Buzzers stopped · Awaiting scoring`, medan samma försök redan visar spelaren som `Incorrect (0 pts)`. Spelarvyn visar också `answered incorrectly`, och hostens Buzz results visar `1/1 buzzes` samt inga berättigade retry-spelare. Dessa flödesdelar är förenliga med ett felaktigt svar utan poäng; statusetiketten “Awaiting scoring” är det som inte stämmer. I `buzzy-live-pilot/src/bridge.js` sätts stängd rond till Awaiting scoring när `winner` saknas, utan att först kontrollera om det finns obesvarade/pending bedömningar. Ändra status så att den bara säger Awaiting scoring vid faktiska obesvarade bedömningar; färdigbedömda felaktiga svar ska få korrekt färdigstatus. `No points awarded` och 0 poäng behålls om inget poängbelopp delats ut. Ingen appändring gjord. Rekommenderad modell: GPT-6.1 Terra.

## #328 — tydligare domän i QR-delningen

I QR-delningens helskärmsvy ska adressraden visa endast aktuell domän/host, utan `http://`/`https://`, path eller `?room=...`. Visa domänen som tydlig, större och typografiskt välformad text, inte som en länk. QR-koden fortsätter bära hela rumslänken. Behåll Copy room link-knappen, som fortsatt kopierar den fullständiga adressen med rumskoden och beter sig som idag. Ingen ändring gjord. Rekommenderad modell: GPT-6.1 Terra.

## #333 — korrekt markering av buzzresultat

Användaren rapporterar att hostens Buzz results alltid visar en bock även när spelaren svarat fel. Det är rätt att visa bock för `correct` och kryss för `incorrect`; en bock för varje bedömt svar blir missvisande. Källspåret i den genererade hostvyn lägger till `✓` när buzzet är bedömt (`done`), utan att kontrollera om resultatet var rätt eller fel. Uppdatera den aktiva generator-/renderingsvägen så ikonen följer bedömningen; obedömda buzz ska inte få en korrekthetsikon. Ingen appändring eller test gjord. Väntar på körbeslut.

## #334 — rena adresser för host och spelare

Användaren vill att varken hostens eller spelarens URL ska sluta på `.html`. Båda rollerna navigerar idag till `/${role}.html` från `src/entry.js`; Hosting innehåller separata `host.html` och `player.html`. Firebase Hosting har `cleanUrls` för att publicera HTML-dokument med rena adresser. Vid implementation aktivera funktionen i pilotkonfigurationen, ändra navigeringen till `/host` och `/player`, och verifiera både nya adresser och befintliga `.html`-adresser i Hosting Emulator/pilot. Bekräfta att rumsparametrar och direktlänkar fortfarande fungerar. Ingen konfigurations- eller appändring gjord; väntar på körbeslut.


## Samlad rättning #317, #320 och #321

Genomförd efter användarens ”Kör den samlade rättningen”. #317: mätning av den renderade bilden visade att markören låg i mitten men att prickarnas grupp låg 3–4px till vänster. Endast placeholderns textindrag kompenserar nu för teckenavståndets avslutande bredd; insättningsmarkören behåller sitt ursprungliga centrum. Faktiska bildpunkter verifieras i tomt fokuserat/ofokuserat fält vid 320, 390 och 430px. Prickarnas centrumavvikelse är högst 0,5px, liksom markörens.

#320: de tillfälliga absolutpositionerade animationsbehållarna startade före rotens 3px-padding och den direkta appbar-selektorn träffade inte rubrikraden under animationen. Behållarna får samma toppinpassning och appbar-regeln gäller även under övergången. Prov pausar den verkliga inkommande animationen strax före slutet och jämför rubrik och första kort före/efter upprensning för samtliga fyra hostvyer. Ingen mätbar vertikal förflyttning kvarstår i provet.

#321: anslutningslyssnaren visade kort Try again redan under normal första anslutning, vilket ändrade huvudet från 65px till cirka 79,5px och tillbaka. Knappen förblir dold under den första väntan och visas fortfarande vid fel eller avbrott i en etablerad session. Hostens roll-/produktionsklasser finns också i den genererade HTML-koden före första rendering. Bildruteprov under första laddning och omladdning visar oförändrad huvudhöjd och logotypposition.

Verifiering: config 5/5, pilotbygge, interceptat HTTPS-prov 1/1 och pilot-UI-gate 4/4 passerar. Se reports/layout-stability-317-320-321.json. Samtliga prov använde lokal emulator eller avlyssnade anrop. Ingen Firebase-regeländring ingår. Faktiskt Android/Brave-prov kvarstår efter publicering; de automatiska proven bevisar inte resultat på användarens enhet. Rättningen publicerades i pilotkanalen i [run42395979402](https://github.com/BadBagel47/buzzy/actions/runs/42395979402), från källa `31aaf0c9301afe3c175a247075d1663fbab81cd3`. Workflowets offentliga status är success. Pilotlänken är https://buzzy-197dc--pilot-mrst5vi1.web.app; giltighet ett dygn enligt publiceringsflödet. Rekommenderad modell för detta samlade paket var GPT-6.1 Sol med högt resonemang. Nästa fria ID är #322.

## Terra-paketet — genomfört i källan

Efter användarens körbesked är #291, #304 och #324–328 ändrade i källan. #323 och #329 genomfördes därefter: riktningspilarna samordnades och konfettin ökades till 432 bitar med dubbel utskjutningstid. Pilotbygget och lokala pilot-UI-proven passerade 4/4; produktionsprovet verifierar pilarna i frågeköns knappar och avståndet till texten. QR-testet verifierar domäntexten samt att kopierad länk innehåller rumskod. Riktigt mobilprov återstår; #290 avvaktar Chrome-prov och #293/#320 ingår inte.
