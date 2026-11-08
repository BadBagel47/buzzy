# Buzzy — plan och mål

Uppdaterad 2026-11-08. Aktuell uppgiftsstatus finns i [BACKLOG.md](BACKLOG.md); återstartsinformation finns i [HANDOFF.md](HANDOFF.md).

## Produktmål och ramar

- Mobilen är huvudplattform: en host leder ett quiz och deltagare buzzar från egna enheter. Dator har kompletterande stöd.
- Bygg vidare på det etablerade gränssnittet och dess befintliga färger, typografi, kontroller och animationer. Hostens vyer är ljusa, spelarens spelyta och leaderboard mörka.
- Prioritera tillförlitlig gemensam spelstatus, återanslutning och tydliga besked. En rumskod ska inte ge hostbehörighet.
- Hushålla med Firebase-kvoten. Spark är nuvarande ram; ingen betalplansändring är beställd. Friska anslutningar ska inte göra periodiska hälsoläsningar eller skrivningar.

## Nuvarande fas

Spelbar Firebase-pilot är publicerad. Senast verifierad publicering är [run42520516709](https://github.com/BadBagel47/buzzy/actions/runs/42520516709), källa `ca4b60ea96a28f8bb77a153ce652056a91971db5`. Användaren uppger att återanslutningen i #293 verkar fungera. Senast publicerad justering av Play-knappen inväntar mobilbedömning.

Pilotkanalen gäller en dag per publicering och använder samma Firebase-projekt som den riktiga tjänsten. Den är ingen isolerad testdatabas. Ingen skarp huvudpublicering eller domänkoppling har genomförts i detta arbetsflöde.

## Närmast

1. #284/#336: genomför överlappande konfettiskurar och långsammare nedfall. #337: förbered `buzzy.trythis.one` och publicering till live-kanalen.
2. #290: vibration märks inte i Brave eller Chrome på användarens Android; fortsatt felsökning återstår.
3. #331: invänta användarens andra projekt med admininloggning via engångslänkar. Välj ingen annan inloggningslösning under väntan.
4. #332: förbered integritets-/lagringsinformation och beslut om gallring inför publik lansering. Den preliminära diskussionen om samtycke är ingen full juridisk granskning.

## Inför skarp lansering

- Bekräfta relevanta mobilflöden, tillgänglighet och verklig användning av gratiskvoten. Respektera att #253:s manuella skärmläsarprov är pausat; det har inte gjorts till nytt ovillkorligt lanseringskrav.
- Bestäm vilka som får vara host och hur behörigheten säkras även vid direkta Firebase-anrop. Deltagare ska kunna spela utan synligt inloggningssteg.
- Gå igenom lagring av spelarnamn, UID, spelhistorik, konton och övergivna rum. Rummet raderas vid bekräftat hostavslut; automatisk gallring av övergivna rum är inte implementerad.
- Publicera till `buzzy.trythis.one` via Firebase Hosting och Cloudflare enligt #337. Cloudflare-skydd på domänen ersätter inte Firebase-regler.
- Kontrollera leverantörsvillkor, relevanta gratisnivåer, personuppgiftsansvar och eventuella tredjepartsbilder före beslut.

Användaren har godkänt #284, #336 och #337. Övriga planerade steg följer separata körbesked; inga betalplans- eller regeländringar ingår i domänarbetet.

## Senare och historik

- #43: individuellt hostgodkännande av varje ny deltagare är uppskjutet och inget krav för första lanseringen.
- #279: större hostredesign är uppskjuten. Senare uttryckliga UI-ändringar är separata beslut.
- #111: den tidigare kodstädningen är avslutad; återstarta den inte.
- Den äldre `BUZZY_NEXT_PHASE_PLAN.md` i `/workspace/buzzy-output` bevaras som historik. Aktuell plan är detta dokument.
