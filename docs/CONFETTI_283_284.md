# Senare status: rättning i källan

#283–284 har nu genomförts efter användarens körbeslut för det samlade paketet. Se [UI_REFINEMENTS_304_313.md](UI_REFINEMENTS_304_313.md). Publicering/mobilprov återstår. Underlaget nedan beskriver den tidigare ogjorda statusen och diagnosen före rättningen.

# Statuskontroll 2026-11-07

#283 och #284 är fortfarande ogjorda i källan till den publicerade liveversionen (5be3cf06ea404b0a155f65dbdebd22231686a735). Nedan följer det tidigare underlaget, oförändrat. Dess hänvisning till nästa ID285 gäller den tidpunkten; aktuell lista finns i BACKLOG.md. Inga nya tester eller produktändringar kördes vid denna statuskontroll.

# #283/#284 — vinstkonfetti, nästa paket

## Användarens önskemål

1. ”Gör så att vinstkonfettin sprutar upp från de nedre hörnen och upp mot mitten.”
2. ”Kolla om konfettin vid vinst fungerar som den ska när man trycker på vinstknappen upprepade gånger.”

Registrerade som separata punkter i samma väntande paket enligt användarens arbetssätt. Den andra punkten är nu undersökt read-only; ingen produktfix har körts.

## #283 — uppåt/inåt från de två nedre hörnen

I v7.51 startar den globala konfettin över skärmens överkant och faller ned. Knappeventet heter celebrate och kommer från Launch final celebration i Settings → Session and history. Befintlig confetti() skapar 65 partiklar i ett gemensamt, icke-klickfångande lager. Stöd för celebration av/på och reducerad rörelse finns.

Önskad förändring: ursprung i nedre vänstra och nedre högra hörnet, rörelse uppåt och in mot mitten som två sammanhängande utkast. Återanvänd befintlig färgpalett och rimlig partikelmängd/tid; bevara att effekten inte fångar tryck, samt av/på-inställningen och prefers-reduced-motion. Mobil är huvudplattform. Ingen ny vinstregel, gradering eller avslutslogik ingår.

## #284 — upprepade tryck: fel reproducerat

confetti() tömmer det gemensamma lagret och skapar en ny omgång vid varje anrop, men schemalägger en ny setTimeout(...,2100) utan att avbryta eller ogiltigförklara tidigare timer. Ett äldre anrop kan därför tömma en senare konfettiomgång.

Native Chromium-prov vid 390×844, normal rörelse, oförändrad v7.51-källa, riktiga knappklick och MutationObserver:

- Ett tryck: konfettin städades efter cirka 2102 ms.
- Två tryck med begärt mellanrum 1100 ms: den senaste omgången städades redan efter cirka 913 ms.
- Tre tryck med begärda mellanrum 700/700 ms: den senaste omgången städades redan efter cirka 549 ms.

Minsta partikelanimation är 1500 ms, med ytterligare individuella fördröjningar. De två senare fallen avbryts alltså innan animationerna kan bli färdiga. Detta är ett faktiskt lokalt återstart-/städningsfel, inte bara en kodhypotes. Det motsvarar hur den gamla timern pekar på samma root-element. Faktiska uppmätta intervall och händelser finns i rapporten; klickens väntetid gör att verkligt intervall inte är exakt det begärda.

Kommande rättning ska göra upprepade utlösningar robusta: en gammal städning får inte kapa en ny omgång. En ren återstart vid nytt tryck är en rimlig utgångspunkt eftersom det redan är nuvarande startbeteende; en överlappande extraeffekt är inte beställd. Bevara städning efter sista giltiga omgång, inga kvarvarande lager/partiklar och inga ändringar i poäng, spelfas, knapparnas nåbarhet eller rörelsepreferensen.

## Evidens och status

Skript: qa/diagnose_confetti_v751.cjs. Resultat: qa/V7_51_CONFETTI_DIAGNOSIS.json. Tre fall passerar sina diagnoskrav, inga JS-sidfel. Befintlig v7.51 SHA-256 verifierad oförändrad. Provet är Chromium/Linux i mobilstorlek, inte verklig Android/Brave. Inga aktuella vinst-/konfettiregisterposter hittades att återöppna; #283/#284 är separata nya beteenden.

**Ingen produktändring körd.** Samlat väntande paket är nu #280–#284: knapptryck på startsidan, fyra tecken i rumskoder, demokodsgräns, konfettiriktning och upprepade konfettitryck. #279 förblir uppskjuten efter fungerande release; #253 pausat och #43 uppskjutet. Nästa lediga ID #285.
