# Buzzy: spelregler som specifikation

Skriven 2026-11-21 (#442) som underlag för flytten till network-kit (#408), där reglerna ska ligga i rummet (`rules` i ett server-run-rum). Listan beskriver hur Buzzy fungerar i dag och var varje regel upprätthålls. Kolumnen *I dag* använder:

- **K**: `buzzy-live-pilot/src/client.js` (kommandon som körs i webbläsaren)
- **R**: `buzzy-live-pilot/database.rules.json` (Firebase-reglerna, genererade av `scripts/generate-ui-rules.mjs`)
- **B**: `buzzy-live-pilot/src/bridge.js` (kopplingen mellan sidan och nätverket, körs hos hosten)
- **S**: `buzzy-live-pilot/app/page.js` (sidans eget skript)

Med network-kit flyttar allt som är märkt K, R eller B (utom ren visning) till rummets regler. Kända fel från genomgången #415 står i sista kolumnen och ska inte följa med.

## Roller och rum

| Regel | I dag | Kommentar inför flytten |
| --- | --- | --- |
| Den som skapar rummet är host och leder utan att spela; hosten kan aldrig bli spelare och ingen spelare kan bli host. | K, R | `ownerRole: 'host'` med `plays:false`, `sends:true`. |
| Rumskoden är 4 tecken ur `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (Firebase) | K, R, `src/room-code.js` | network-kit: 6 tecken. |
| Högst 12 spelare (platser 0–11) och 4 viewers (platser 0–3). | K, R | Beslut 2026-11-18/21: 30 spelare, 1 viewer. Platser frigörs aldrig i dag (#424). |
| En spelare går med med namn (1–24 tecken). Samma identitet kommer tillbaka med samma poäng. | K, R | network-kit: `nameMaxLength`, identitet per flik. |
| Sen anslutning: den som går med medan en fråga visas eller är öppen spelar från nästa fråga (`fromRound`). Inställningen *Allow joining during an active question* släpper in direkt. | K, R, S | `lateJoin: 'next'` och `room.admit()` vid nästa fråga; `lateJoin: 'now'` när inställningen är på. |
| Viewern läser bara; den skriver aldrig spelläge. | K, R | Roll `viewer` med `needsKey`, egen länk. Kan i dag registrera sig utan hostens tillstånd (#426). |
| Hosten kan ta bort (spelaren kan gå med igen med koden) och stänga av (kan inte gå med igen förrän avstängningen hävs). | K, R | `kick`, `kick({ban})`, `unban`, `banMakesPrivate: false`. Avstängda kan i dag läsa vidare (#428). |
| Hosten avslutar spelet: rummet raderas och alla får beskedet att spelet är slut. | K, R, B | `close()`. |
| Ett nätavbrott eller en omladdning avslutar inte rummet. | B | network-kit: `graceMs`, ägarnyckel; `closeAfterOwnerAwayMs`, `idleCloseMs` 3 h (beslut 2026-11-21). |

## Fråga, runda och försök

| Regel | I dag | Kommentar inför flytten |
| --- | --- | --- |
| Spelet är en följd av rundor (`r`, en per fråga) med försök (`a`, Retry ger ett nytt försök på samma fråga). | K, R | `room.game.r`, `room.game.a`. |
| Faser: `ready` → `open` (buzzern öppen) → `closed` (stoppad) eller `finished` (rätt svar) → `ready` för nästa runda eller försök. | K, R | Samma faser i reglerna. |
| Hosten väljer fråga: snabbfråga (Quick Play) eller förberedd fråga (Prepared). Frågans text och bild skickas till spelare och viewer först när hosten visar den. | B, S | I dag publiceras texten innan den visas (#427). Frågebanken ligger utanför rummet (#444). |
| Förhandsladdning: spelarna laddar frågans bild och kvitterar; hosten väntar tills alla aktiva har laddat eller trycker *Continue anyway*. | B, S | Meddelanden från spelarna till reglerna; *Continue anyway* nollställs per fråga (#430). |
| Läge och timer kan bara ändras innan rundan startar. | K, R | |
| Buzzläge *First buzz*: bara den första som buzzar räknas. | K, R | |
| Buzzläge *Timed buzz*: alla som buzzar inom tiden får en plats i ordningen 1, 2, 3 … efter serverns tid. | K, R | network-kit: ordning efter `at − min(rttMs/2, 100 ms)`. I dag kan buzzar försvinna vid trängsel (#420). |
| Timer: buzzern stängs när tiden (`ms` från `startedAt`) har gått, om timern är på. | K, R, B | `room.setTimer`. I dag stängs den bara om hostens flik är vaken. |
| Buzzern stängs automatiskt när alla som får buzza har buzzat. | B | Regel i rummet. |
| En spelare som är utesluten för rundan (fel svar utan *Allow repeat attempts*) eller inte aktiv får inte buzza. | K, R | |
| En buzz räknas en gång per spelare och försök; en buzz som skickas om efter ett nätavbrott räknas inte två gånger. | K, R | network-kit räknar varje meddelande en gång. |

## Bedömning och poäng

| Regel | I dag | Kommentar inför flytten |
| --- | --- | --- |
| Hosten bedömer en buzz i taget i ordning: rätt eller fel. | K, R | |
| Rätt: spelaren får frågans poäng (rummets *Correct points*, standard 1), rundan blir `finished`. | K, R | |
| Fel: spelaren får frågans avdrag (*Incorrect points*, standard 0), utesluts från rundan om upprepning inte är tillåten, och rundan blir `closed`. | K, R | |
| Negativa totalpoäng bara om *Allow negative total scores* är på; annars stannar summan på 0 (eller där den redan var under 0). | K, R | Formeln finns i dag på tre ställen; en gång i reglerna. |
| En buzz kan bara bedömas en gång. | K, R | |
| Retry och Next kräver att alla buzzar i försöket är bedömda. | K | Spelare som tagits bort räknas inte (#423). |
| Rundan är avgjord när någon svarat rätt eller ingen kan svara längre; då behövs ingen bekräftelse för nästa fråga (#391). | B, S | Regel i rummet. |
| Hosten kan justera en spelares poäng manuellt (högst ±10 000); justeringen sparas i historiken. | K, R | |
| Poäng ändras bara av hosten (bedömning eller justering). | R | network-kit: bara hostrollen kan skicka kommandon. |

## Historik, visning och inställningar

| Regel | I dag | Kommentar inför flytten |
| --- | --- | --- |
| Varje avslutad runda sparas i rundhistoriken (Round overview), som bara hosten kan läsa. | B, R | I dag bara om hostens flik är vaken; i rummet med `room.store`. |
| Rättsvaret och frågebanken syns bara för hosten. | R, S | Skickas aldrig till spelare eller viewer. |
| Delade inställningar (leaderboard, buzzordning för spelarna, namn, egna poäng, ljud, animationer, firande, viewerns val) gäller alla i rummet. | B, R | Värden som hosten ändrar och rummet skickar; per roll med `setWelcomeState`. Hostens egen inställning får inte skrivas över av det härledda värdet (#418). |
| Leaderboarden visas för spelarna bara när hosten delar den. | B, R | |
| Viewern visar läget som hosten valt: standby, join-skärm, spel eller leaderboard. | B, R | |
| Firande (konfetti) startas av hosten och visas hos spelare och viewer. | K, R | Meddelande från rummet. |

## Tid

| Regel | I dag | Kommentar inför flytten |
| --- | --- | --- |
| All tid som avgör ordning eller timer är serverns tid, aldrig spelarens klocka. | K, R | `at` och `room.now()`. |
| Nedräkningen som visas räknas från serverns starttid och serverns klocka (`serverNow`). | K, B | `serverNow()` i network-kits klient. |
