# Buzzy — plan och mål

Uppdaterad 2026-11-13. Aktuell uppgiftsstatus finns i [BACKLOG.md](BACKLOG.md); återstartsinformation finns i [HANDOFF.md](HANDOFF.md).

## Produktmål och ramar

- Mobilen är huvudplattform: en host leder ett quiz och deltagare buzzar från egna enheter. Dator har kompletterande stöd.
- Bygg vidare på det etablerade gränssnittet och dess befintliga färger, typografi, kontroller och animationer. Hostens vyer är ljusa, spelarens spelyta och leaderboard mörka.
- Prioritera tillförlitlig gemensam spelstatus, återanslutning och tydliga besked. En rumskod ska inte ge hostbehörighet.
- Hushålla med Firebase-kvoten. Spark är nuvarande ram; ingen betalplansändring är beställd. Friska anslutningar ska inte göra periodiska hälsoläsningar eller skrivningar.

## Nuvarande fas

Live på https://buzzy.trythis.one via Firebase Hosting, som publiceras via grenen `release` (#385). Senaste publicering finns i [HANDOFF.md](HANDOFF.md). Fasen är förfining av hostens gränssnitt (mörkt tema, formspråk), viewer för storskärm och AI-frågor, med löpande användarprov.

## Närmast

1. Integritet och gallring inför lansering: #332 och #405. Underlaget finns i [PRIVACY_332.md](PRIVACY_332.md) och väntar på beslut.
2. Användarprov av publicerade ändringar på riktiga enheter, se HANDOFF.
3. #290 (vibration) och #345 (tillfälligt hostfel) när det finns nytt underlag.
4. #387 (AI-frågor) mot riktiga Claude när nyckeln finns.
5. Parkerat: #331 (hostinloggning, väntar på engångslänkslösning), #348–#350, #351 väg 2, #360, #377 och #380.

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
