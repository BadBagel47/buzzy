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

Uppdaterat 2026-11-21. Buzzy har inga spelare ännu; användaren provar själv.

1. Flytten till network-kit (#408) är huvudspåret. network-kit används redan av Bricks, Critical och Vättigt (enligt användaren 2026-11-21). Först förberedelse (#441, #442, #429), sedan Buzzys rum på network-kit bakom en switch.
2. Fynden från genomgången #415 som löses av flytten rättas inte på Firebase. Bara det som stör egna prov rättas (#417, #418).
3. Nya frågetyper (#410) byggs på network-kit.
4. Oberoende av flytten: tillgänglighet (#436–#440) och lägre AI-kostnad (#414).
5. Integritet och gallring (#332, #405) väntar på användarens beslut; gallringen följer med network-kit.

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
