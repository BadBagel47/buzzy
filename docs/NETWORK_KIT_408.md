# #408: avstämning mot network-kit

Gjord 2026-11-21 mot network-kit 0.19.0 (`docs/INTEGRATION.md`, `CHANGELOG.md`, koden i `src/server/room-core.js`). Syftet är att inget ska saknas eller ställa till det när Buzzy flyttar. Beslut som behövs från användaren står i avsnitt 4.

## 1. Upplägg

- **Rum som körs på servern** (`mode: 'server'`): Buzzys regler i rummet (`rules`), inte i hostens webbläsare. Rummet avgör buzzordning, poäng, status, timer och vad varje roll får se.
- **Roller:** `host` (`plays: false`, `sends: true`, `ownerRole`), `player` (antal enligt beslut 2026-11-18: fler än 12), `viewer` (färre än 4, `needsKey: true`, egen länk, #348).
- **Rumskod:** `codeLength: 6` (standard från 0.8). Firebase-rummen har 4 tecken, så längden visar vilket system ett rum ligger i under provperioden.
- **Under provperioden:** Firebase kvar som förval, network-kit bakom en switch hos hosten (#408 steg 2). Nätverksdelen görs utbytbar först (#442).

## 2. Buzzys funktioner mot network-kit

| Buzzy behöver | network-kit 0.19 | Kommentar |
| --- | --- | --- |
| Host leder utan att spela; ingen spelare kan bli host | `ownerRole` med `plays:false`, server-run (ingen takeover) | Finns. |
| Hosten laddar om eller byter enhet | Ägarnyckel i webbläsaren | Finns. Se risk 3.3 (andra fliken). |
| Gå med med kod och namn, QR, länk | `join`, `shareLink`, `qrSvg` | Finns. |
| Viewer med egen länk (#348), antal viewers, ta bort en viewer (#349) | Roll med `needsKey`, `seats`, `kick`, `renewKey` | Finns. |
| Spelare som kommer under en fråga släpps in till nästa | `lateJoin: 'next'` + `room.admit()` i reglerna; hosten kan ändra med `setSettings` | Finns. |
| Ta bort (kan komma tillbaka) och stänga av / häva | `kick`, `kick({ban})`, `unban` | Finns, men se risk 3.1. |
| Återanslutning, nätbyte, telefon i bakgrunden | Klientens återanslutning, `graceMs`, `heartbeatMs` | Finns (bygger på Buzzys egen lösning). |
| Rättvis buzzordning | `at` på meddelanden, `participant.rttMs` med `rttProbeMs` | Finns (0.13). Beslut: tid = at − min(rttMs/2, 100 ms). |
| Timer per fråga, tiden ute, förhandsladdning | `room.setTimer`, `onTimer`, `serverNow()` | Finns. |
| Bara hosten ser svar, frågebank och rundhistorik | `room.game` skickas bara det reglerna skickar | Finns. Se risk 3.2 (storlek). |
| Spelare och viewer får rätt vy vid anslutning | `room.setWelcomeState(data, role)`, `onJoin`/`onBack` | Finns (märkt "on trial"). |
| Delade inställningar | `room.data` (högst 4 kB) eller meddelanden | Frågetext (upp till 10 000 tecken) får inte ligga i `room.data`; skicka som meddelande/välkomststate. |
| Hosten avslutar spelet → rummet stängs för alla | `close()`, `ownerLeave: 'close'` | Finns. |
| Rensning av gamla rum (#332) | `cleanupMs` 24 h, `closedKeepMs` 1 h, `idleCloseMs` | Finns. Löser gallringen. |
| Skydd mot missbruk (#425) | 6 tecken, `limits` per besökare, dagliga tak per rum, adminsidans tak per spel | Finns. |
| Rum i EU | `jurisdiction: 'eu'` | Finns. |
| På/av, budget, besked till spelarna | `admin`-bindning, `watchNotices` | Finns (märkt "on trial"). |
| Egna prov utan andra spelare | Playtest och Playtest Recorder | Finns (experimentellt). Passar användarens arbetssätt. |

## 3. Risker och sådant som kan ställa till det

1. **Avstängning gör rummet privat.** En ban förnyar alla inbjudningsnycklar och gör rummet privat. Efter en avstängning kan nya spelare inte längre gå med med bara koden, och QR-koden på viewern och i delningsdialogen måste uppdateras med den nya länken. Ett häv (`unban`) kräver också en ny länk. Beslut behövs (fråga 5).
2. **Stor spelstate skrivs om vid varje ändring.** I server-run lagras `room.game` som en del av rummets state (`storage.put('room', state)`), till skillnad från snapshot och välkomststate som delas i delar. Frågebanken (cirka 1 kB per fråga, 60 frågor ≈ 60 kB) plus rundhistorik skulle skrivas om vid varje buzz. Förslag: håll banken utanför den state som ändras ofta (t.ex. bara aktuell fråga i `room.game`, banken hos hosten och i ett separat lagrat värde), och be network-kit om lagring i delar eller separata nycklar för `room.game` (tips 6.1).
3. **Hostens andra flik blir spelare.** En andra flik i hostens webbläsare går med som vanlig deltagare, alltså i första spelande roll. Buzzy måste känna igen det och visa "Du är redan host i en annan flik" i stället för att bli spelare (tips 6.2).
4. **`idleCloseMs` 60 min.** Om alla skärmar ligger i bakgrunden en timme (t.ex. lång paus) stängs rummet. Bör vara längre för ett quiz, eller av (fråga 7).
5. **Snabba versioner.** network-kit har släppt 17 mindre versioner på sex dagar och flera delar Buzzy behöver är märkta "on trial" (välkomststate, `at`, `rttMs`, `admin`). Buzzy låser en version och tar uppdateringar med provsviten (`templates/update-network-kit.yml`).
6. **Firebase och network-kit samtidigt.** Under provperioden måste spelreglerna finnas på två ställen; nya funktioner (#410) byggs bara på network-kit. Sidornas innehållspolicy (CSP) måste tillåta både Firebase och rumsservern.
7. **Enhet och flik.** Klientens standard är `identity: 'tab'` (två flikar = två spelare). Det motsvarar Buzzy i dag. Viewern på hostens dator bör använda `slot: 'screen'` så att den inte blandas med hosten.
8. **Gratisplanen delas mellan alla spel.** Buzzy delar Cloudflares dagliga gräns med Bricks, Critical och Vättigt; adminsidan ger varje spel en andel. Ett quiz skickar få meddelanden, så risken är liten.
9. **Integritetstexten (#406) ska ändras**: Cloudflare i stället för Google, IP-adresser, radering 24 timmar efter att sista deltagaren lämnat.
10. **Engångsåtgärder:** en Cloudflare-token som GitHub-hemlighet i Buzzy (för att publicera rumsservern), och vid behov ett eget domännamn för rumsservern.

## 4. Beslut som behövs (frågor till användaren)

1. **Var rumsservern ska ligga.** Förslag: en egen Worker (t.ex. `buzzy-rooms`) på en egen underdomän under provperioden; sidorna ligger kvar på Firebase Hosting. Efter provperioden flyttas sidorna till samma Worker på `buzzy.trythis.one` (rekommenderas av network-kit: samma version, ingen CORS).
2. **Ansluta Buzzy till adminsidan** (på/av, budget, besked till spelarna, användning). Förslag: ja.
3. **Antal platser:** hur många spelare och viewers (beslut 2026-11-18: fler spelare, färre viewers). Förslag: 20 spelare, 2 viewers.
4. **Åtkomst:** öppna rum där spelare går med med kod och QR (som i dag), och viewern bara med sin länk. Förslag: ja.
5. **Avstängning:** godta att en ban gör rummet privat (nya spelare behöver då QR/länk, som Buzzy uppdaterar automatiskt), eller be network-kit om ett val som behåller rummet öppet. Förslag: be network-kit om valet (tips 6.3) och under tiden godta beteendet.
6. **Förval under provperioden:** Firebase eller network-kit. Eftersom Buzzy saknar spelare: network-kit som förval så snart steg 2 fungerar.
7. **Rummets livslängd:** stäng ett rum efter 3 timmar när alla skärmar ligger i bakgrunden (i stället för 1 timme), och radera 24 timmar efter att sista deltagaren lämnat. Förslag: ja.
8. **Playtest:** använda network-kits Playtest och inspelning för dina egna prov. Förslag: ja, med en kort lista över prov för Buzzy.
9. **Cloudflare-token:** samma token som de andra spelen använder, eller en ny med behörighet bara för Buzzys Worker. Förslag: ny token begränsad till Workers på kontot.

## 5. Ordning

1. #441 och #442 (prototypen till källfiler, regellista och gränssnitt), #429 (prov vid publicering).
2. Worker med network-kit-kopia, regler och Node-prov för reglerna; publicering via GitHub Actions.
3. Klienten för network-kit bakom switchen; prov i båda lägena.
4. Användarprov (Playtest), sedan network-kit som förval, sedan #410 på network-kit.
5. När allt fungerar: sidorna till Workern, Firebase tas bort, integritetstexten ändras.

## 6. Tips till network-kit

Registrerade i network-kits backlogg 2026-11-21: F-147 (punkt 1), F-148 (2), F-149 (3), F-150 (4), F-151 (5), D-152 (6), D-153 (7–9). Ingen påbörjad; ägaren väljer ordningen.

Nu:

1. **Lagra server-run-spelets state i delar eller nycklar**, som snapshot och välkomststate redan gör, eller låt reglerna lagra stora sällan ändrade delar separat (`room.store(key, value)`). Annars skrivs en stor frågebank om vid varje buzz.
2. **Ägarens andra flik:** ett val som gör att en andra flik med ägarnyckel för en icke-spelande ägarroll nekas eller går med som åskådare i stället för som spelare (gäller alla spel med en ledare som inte spelar).
3. **Avstängning utan att rummet blir privat:** ett val (t.ex. `banMakesPrivate: false`) för spel med en öppen kod på en storskärm, där bara den avstängdes identitet spärras och spelarlänken förnyas men koden fortsatt fungerar.
4. **Ett snabbt testverktyg för server-run-regler** i Node (ett fejkat `room` med timer och meddelanden), så att ett spel kan prova sina regler utan workerd; smoke-testet visar att det går.
5. **Server-run och ägaren borta:** beskriv i guiden vad som händer när ägaren tappar anslutningen i ett server-run-rum (rummet fortsätter, timer går), och erbjud `closeAfterOwnerAwayMs` om det saknas.
6. **Stabilitet:** märk välkomststate, `at` och `rttMs` som stabila innan Buzzy bygger på dem, eller säg vilka som kan ändras.

Efter implementationen (när Buzzy körts en tid):

7. Använd Playtest-inspelningar för att mäta buzzordningens rättvisa (skillnad mellan tryck och `at`, `rttMs` per enhet) och justera taket på 100 ms.
8. Mät Buzzys meddelanden och lagringsskrivningar per kväll och sätt adminsidans andel och `maxMessagesPerDay` därefter.
9. Om flera spel får ett quizliknande upplägg: överväg ett gemensamt mönster för "ledare + spelare + storskärm" i exemplen.
