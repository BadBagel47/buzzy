# #332 och #405: lagring, integritet och gallring

Underlag 2026-11-13. Bygger på läsning av koden (`src/`, `database.rules.json`) och den korta laggenomgången i #405. Detta är ingen juridisk bedömning. Inget är ändrat i appen. Besluten i slutet är användarens.

## 1. Vad som lagras

### Firebase Realtime Database (`europe-west1`), per rum `rooms/<kod>`

| Del | Innehåll | Vem kan läsa |
|---|---|---|
| `meta` | Hostens anonyma UID, när rummet skapades | Alla inloggade som känner rumskoden |
| `members` | Spelarens visningsnamn, anonyma UID, platsnummer, tid för anslutning | Hosten, spelare och viewers i rummet |
| `scores`, `adjustments` | Poäng och poängjusteringar per UID | Rummets deltagare |
| `attempts`, `control` | Buzzordning och tider per fråga, med UID | Rummets deltagare |
| `moderation` | Status som borttagen eller avstängd per UID | Rummets deltagare |
| `viewers`, `viewerSeats` | Viewer-skärmarnas anonyma UID | Rummets deltagare |
| `presentation` | Den visade frågetexten och eventuell bildadress | Rummets deltagare |
| `settings`, `selection`, `celebration` | Spelinställningar | Rummets deltagare |
| `private` | Hostens frågor med svar, källor och AI-uppgifter (#387) | Bara hosten |
| `archive` | Rundhistorik för Round overview | Bara hosten |

- Rummet raderas helt när hosten avslutar spelet med End game.
- Ett rum som överges, till exempel när hosten bara stänger fliken, ligger kvar utan tidsgräns. Det finns ingen automatisk gallring.

### Firebase Authentication

- Varje enhet får ett anonymt konto (UID) som sparas i webbläsaren (IndexedDB) och återanvänds.
- Kontona raderas aldrig av appen. De anonyma kontona blir alltså fler med tiden.

### Webbläsarens lagring

| Nyckel | Typ | Innehåll | Syfte |
|---|---|---|---|
| `buzzy-spark-ui-session` | sessionStorage | Roll och rumskod | Återanslutning efter omladdning |
| `buzzy-pending-room-create` | sessionStorage | Tillfälligt skapande-ID | Förhindrar dubbla rum |
| `buzzy-host-theme` | localStorage | Auto, Light eller Dark | Hostens temaval (#378) |
| `buzzy-anthropic-key` | localStorage | Hostens egen API-nyckel | AI-frågor (#387), skickas bara till Anthropic |
| `buzzy-ai-mixes` | localStorage | Sparade ämnesblandningar | AI-frågor |
| `firebaseLocalStorageDb` | IndexedDB | Firebase-inloggningen | Det anonyma kontot |

Appen har inga kakor, inga analysverktyg, inga externa typsnitt och inga ljudfiler från tredje part.

### Tredje parter

- **Google Firebase** (Hosting, Auth, Realtime Database): behandlar allt ovan. Hosting loggar IP-adresser. Google är personuppgiftsbiträde, och överföring utanför EU kan förekomma trots att databasen ligger i europe-west1.
- **Cloudflare**: står bara för DNS-posten (DNS only). Trafiken går inte genom Cloudflare.
- **Anthropic** (#387, valfritt för hosten): webbläsaren skickar ämnen, språk och frågeutkast direkt till Anthropic med hostens egen nyckel. Inga spelaruppgifter skickas.
- **Bildadresser i frågor**: en fråga kan ha en bild från en valfri `https`-adress. Spelarnas och viewerns webbläsare hämtar bilden direkt, så den webbplatsen ser deras IP-adresser.

## 2. Lagar och regler (från #405)

| Område | Regel | Bedömning och risk | Förslag |
|---|---|---|---|
| Lagring i webbläsaren | LEK 9 kap. 28 § (PTS) | Allt som lagras behövs för en tjänst som användaren själv begär, så undantaget från samtycke gäller troligen. Temaval och AI-blandningar är bekvämlighet som hosten själv väljer. | Ingen samtyckesruta. Beskriv lagringen i integritetsinformationen. |
| Spelarnamn, UID och speldata | GDPR (IMY) | Personuppgifter, även med påhittade namn. Rättslig grund är troligen berättigat intresse eller avtal: att kunna spela. Risken är låg för data som raderas, men hög för rum som aldrig raderas. | Integritetsinformation och gallring, se nedan. |
| Leverantörer | GDPR art. 28 och 44 | Firebase har Googles dataskyddsvillkor. Anthropic används med hostens egen nyckel och eget konto. | Godkänn Googles villkor i Firebase-konsolen om det inte redan är gjort. Hänvisa till Anthropic i texten om AI-frågor. |
| Barn som spelare | GDPR art. 8 och 12 | Quiz används ofta i skolor och familjer. Appen erbjuder inga tjänster som kräver samtycke, men informationen måste vara lättbegriplig. | Kort och enkel text. Inga konton för spelare. |
| Bilder i frågor | GDPR och upphovsrätt | Bilder från andra webbplatser exponerar spelarnas IP-adresser och kan vara upphovsrättsskyddade. Hosten ansvarar för innehållet. | Nämn det i informationen. Kan tas upp som eget ID om det behövs. |

Källor: [IMY](https://www.imy.se) och [PTS om kakor](https://www.pts.se). Frågor om rättslig grund och vem som är personuppgiftsansvarig (Buzzy eller hosten) bör vid behov stämmas av med en jurist.

## 3. Gallring av övergivna rum

Spark-planen saknar Cloud Functions. Databasreglerna låter bara hosten radera sitt eget rum, och ingen klient kan lista rum.

| Alternativ | Hur | För | Mot |
|---|---|---|---|
| A. Schemalagd GitHub Action (rekommenderas) | Ett workflow körs en gång per dygn. Det raderar rum äldre än 24 timmar och anonyma konton som inte använts på 30 dagar. Det använder samma Google-inloggning som Hosting-publiceringen. | Gratis, ingen ändring av databasreglerna, går att följa i Actions. | Kräver en engångsåtgärd: tjänstekontot behöver rätt att skriva i databasen och hantera Auth. Rummet kan finnas kvar i upp till ett dygn efter tidsgränsen. |
| B. Cloud Function på Blaze | En schemalagd funktion gör samma sak. | Inbyggt i Firebase. | Byte till betalplan, vilket inte är beställt. |
| C. Regel plus städning från klienten | Reglerna tillåter att vem som helst raderar ett rum som är äldre än 24 timmar, och klienten städar sina egna gamla rum. | Ingen server. | Klienten känner bara till sina egna rum, så övergivna rum blir kvar. Kräver dessutom en regeländring. |

Föreslagen tidsgräns: 24 timmar efter att rummet skapades. Ett quiz pågår sällan längre. Alternativet är att räkna 12 timmar från senaste aktivitet, vilket kräver att aktivitetstiden lagras.

## 4. Utkast till integritetsinformation (engelska, projektets språk)

> **Privacy in Buzzy**
>
> Buzzy lets a host run a quiz and players buzz in from their own devices. No account or email is needed.
>
> **What we store.** When you join a game we store the name you type, an anonymous ID for your device, your buzzes and your score. The host's questions and answers are visible only to the host. Everything belongs to one game room.
>
> **How long.** A room and everything in it is deleted when the host ends the game, and automatically 24 hours after it was created. Anonymous device IDs that have not been used for 30 days are deleted.
>
> **On your device.** Buzzy keeps your current room and, for hosts, the chosen theme in your browser's storage so the game works after a reload. Buzzy uses no cookies, no ads and no analytics.
>
> **Who processes data.** Buzzy runs on Google Firebase (hosting and database in the EU). Hosts who use AI questions send topics directly to Anthropic with their own key; no player data is sent. Images in questions are loaded from the address the host chose.
>
> **Your rights.** You can ask us to delete your data or tell you what we store: [contact]. You can also contact the Swedish Authority for Privacy Protection (IMY).

Utkastet förutsätter alternativ A med 24 timmar och 30 dagar. Kontaktuppgift och ansvarig behöver fyllas i.

## 5. Beslut som behövs från användaren

1. Gallringsalternativ (A, B eller C) och tidsgräns.
2. Vem som står som personuppgiftsansvarig och vilken kontaktadress som ska användas i texten.
3. Var informationen ska visas, till exempel en länk "Privacy" på förstasidan och i hostens Settings.
4. Om bilder från andra webbplatser i frågor ska begränsas eller bara beskrivas.

När besluten är tagna kan genomförandet registreras och köras: sida och länk i appen, och gallringsworkflowet med engångsåtgärden för behörigheter.
