# Buzzy — plan och mål

Uppdaterad 2026-11-08. Aktuell uppgiftsstatus finns i [BACKLOG.md](BACKLOG.md); återstartsinformation finns i [HANDOFF.md](HANDOFF.md).

## Produktmål och ramar

- Mobilen är huvudplattform: en host leder ett quiz och deltagare buzzar från egna enheter. Dator har kompletterande stöd.
- Bygg vidare på det etablerade gränssnittet och dess befintliga färger, typografi, kontroller och animationer. Hostens vyer är ljusa, spelarens spelyta och leaderboard mörka.
- Prioritera tillförlitlig gemensam spelstatus, återanslutning och tydliga besked. En rumskod ska inte ge hostbehörighet.
- Hushålla med Firebase-kvoten. Spark är nuvarande ram; ingen betalplansändring är beställd. Friska anslutningar ska inte göra periodiska hälsoläsningar eller skrivningar.

## Nuvarande fas

Hosting-körning [run42529524063](https://github.com/BadBagel47/buzzy/actions/runs/42529524063) lyckades från `5cadbca20e5ea3b91d660309c00f1c9bc92ac634`; användaren bekräftar att live valdes och att `buzzy.trythis.one` nu fungerar. Specifika host-/spelarflöden på domänen är inte separat bekräftade. Användaren uppger att återanslutningen i #293 verkar fungera.

Pilotkanalen gäller en dag per publicering och använder samma Firebase-projekt som live-versionen. Den är ingen isolerad testdatabas. Live är publicerat och användaren bekräftar att domänen fungerar.

## Närmast

1. #341–343 är ändrade och run42556139061 lyckades; användaren ombads välja live, men målkanalen är inte direkt avläst. Visuellt användarprov återstår. #284/#338 är publicerade till live i run42529524063; visuellt prov och belastningsprov återstår. #337: prova host och spelare på `buzzy.trythis.one`.
   #335/#336/#339/#340 är ändrade och verifierade lokalt efter körbesked; publicering och riktiga visuella prov återstår.
2. #290: vibration märks inte i Brave eller Chrome på användarens Android; fortsatt felsökning återstår.
3. #331: invänta användarens andra projekt med admininloggning via engångslänkar. Välj ingen annan inloggningslösning under väntan.
4. #332: förbered integritets-/lagringsinformation och beslut om gallring inför publik lansering. Den preliminära diskussionen om samtycke är ingen full juridisk granskning.

## Inför skarp lansering

- Bekräfta relevanta mobilflöden, tillgänglighet och verklig användning av gratiskvoten. Respektera att #253:s manuella skärmläsarprov är pausat; det har inte gjorts till nytt ovillkorligt lanseringskrav.
- Bestäm vilka som får vara host och hur behörigheten säkras även vid direkta Firebase-anrop. Deltagare ska kunna spela utan synligt inloggningssteg.
- Gå igenom lagring av spelarnamn, UID, spelhistorik, konton och övergivna rum. Rummet raderas vid bekräftat hostavslut; automatisk gallring av övergivna rum är inte implementerad.
- Prova flödena på `buzzy.trythis.one`, som är publicerad via Firebase Hosting och Cloudflare enligt #337. Cloudflare-skydd på domänen ersätter inte Firebase-regler.
- Kontrollera leverantörsvillkor, relevanta gratisnivåer, personuppgiftsansvar och eventuella tredjepartsbilder före beslut.

Användaren har godkänt #335/#336/#339/#340. Övriga planerade steg följer separata körbesked; inga betalplans- eller regeländringar ingår i detta paket.

## Senare och historik

- #43: individuellt hostgodkännande av varje ny deltagare är uppskjutet och inget krav för första lanseringen.
- #279: större hostredesign är uppskjuten. Senare uttryckliga UI-ändringar är separata beslut.
- #111: den tidigare kodstädningen är avslutad; återstarta den inte.
- Den äldre `BUZZY_NEXT_PHASE_PLAN.md` i `/workspace/buzzy-output` bevaras som historik. Aktuell plan är detta dokument.
