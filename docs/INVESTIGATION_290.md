# #290 — vibration vid spelarens buzz

Utredning 2026-11-07. Modell vald för avgränsad research: Luna. Efterföljande implementation använder en enda 40 ms lokal puls vid spelarens giltiga buzztryck.

## Slutsats

En kort vibration kan erbjudas som frivillig haptisk återkoppling på Android-webbläsare som exponerar Vibration API, inklusive Chromium-baserade webbläsare som Brave. Det går att begära vibration lokalt från spelarens knapptryckning; det kräver inget Firebase-anrop och förbrukar ingen Firebase-kvot.

Detta är stöd på API-/plattformnivå, inte bekräftelse av faktisk vibration på just användarens Android/Brave-enhet. Operativsystem, webbläsarversion, enhetens inställningar och tillgänglig hårdvara kan ändå göra att begäran ignoreras. Buzzy behöver därför fortsätta fungera likadant utan vibration.

iOS-webbläsare (Safari och andra webbläsare som använder WebKit på iPhone) exponerar normalt inte `navigator.vibrate()`. En vanlig webbsida eller installerad webbapp kan därför inte lova haptik på iPhone genom detta API. Det skulle kräva en separat inbyggd applösning för bredare iOS-haptik.

## Hur det passar Buzzy

Spelarens knapp är `.coin-buzzer` och dess buzz-händelse går via `buzz(id)` i `buzzy-live-pilot/src/bridge.js`. En haptikbegäran kan göras synkront vid ett giltigt tryck, innan den asynkrona Firebase-kommandovägen startar. Webbläsare kan begränsa vibration till en synlig sida och/eller en nylig användarinteraktion; därför bör eventuell begäran inte vänta på serversvaret. Den innebär då återkoppling på knapptrycket, inte bekräftelse att servern registrerade buzzet.

API:t är progressiv förbättring: kontrollera att `navigator.vibrate` finns och anropa det endast för ett giltigt spelartryck. Om API saknas eller anropet misslyckas ska spelets nuvarande visuella och ljudmässiga återkoppling fortsätta utan fel eller ändrat spelbeteende. Mönster bör hållas korta och enkla, exempelvis en enda puls på cirka 30–50 ms; undvik långa eller upprepade pulser. Ingen vibration ska läggas på hostens kontroller.

## Implementerat

I `buzzy-live-pilot/src/bridge.js` görs anropet direkt när spelarens giltiga buzztryck hanteras och före det asynkrona Firebase-kommandot. Om API:t saknas eller kastar fel ignoreras det och spelet fortsätter oförändrat. Ingen vibration begärs från hostkontroller och ingen databastrafik tillkommer.

Första implementationen publicerades i [run42410517841](https://github.com/BadBagel47/buzzy/actions/runs/42410517841). Användaren rapporterar att vibration inte märks i Brave och provar Chrome innan fortsatt felsökning. Den ska ske vid tryck på spelarens aktiva buzzer; hostens knapp för att aktivera buzzrar ger ingen vibration. Om den uteblir även i Chrome behöver felsökas på den faktiska Android-versionen och enhetens vibrationsinställningar. Ingen sådan felsökning är gjord ännu.

iPhone/Safari ska fortsätta fungera normalt utan vibration. En separat av/på-inställning har inte lagts till.

## Referenser

- [MDN: Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) — API-form, tillgänglighet och användningsbegränsningar.
- [W3C Vibration API](https://www.w3.org/TR/vibration/) — standardens aktiva dokumentation.
- [Can I use: Vibration API](https://caniuse.com/vibration) — webbläsarstödöversikt; kontrollera aktuell mobilversion vid implementation.

Ingen webbläsare eller fysisk mobil testades i denna miljö. Exakt stöd i en viss version av Brave/Android måste därför verifieras på enheten.
