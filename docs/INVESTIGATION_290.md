# #290 — vibration vid spelarens buzz

Utredning 2026-11-07. Modell vald för avgränsad research: Luna. Ingen appkod ändrad enbart genom denna utredning.

## Slutsats

En kort vibration kan erbjudas som frivillig haptisk återkoppling på Android-webbläsare som exponerar Vibration API, inklusive Chromium-baserade webbläsare som Brave. Det går att begära vibration lokalt från spelarens knapptryckning; det kräver inget Firebase-anrop och förbrukar ingen Firebase-kvot.

Detta är stöd på API-/plattformnivå, inte bekräftelse av faktisk vibration på just användarens Android/Brave-enhet. Operativsystem, webbläsarversion, enhetens inställningar och tillgänglig hårdvara kan ändå göra att begäran ignoreras. Buzzy behöver därför fortsätta fungera likadant utan vibration.

iOS-webbläsare (Safari och andra webbläsare som använder WebKit på iPhone) exponerar normalt inte `navigator.vibrate()`. En vanlig webbsida eller installerad webbapp kan därför inte lova haptik på iPhone genom detta API. Det skulle kräva en separat inbyggd applösning för bredare iOS-haptik.

## Hur det passar Buzzy

Spelarens knapp är `.coin-buzzer` och dess buzz-händelse går via `buzz(id)` i `buzzy-live-pilot/src/bridge.js`. En haptikbegäran kan göras synkront vid ett giltigt tryck, innan den asynkrona Firebase-kommandovägen startar. Webbläsare kan begränsa vibration till en synlig sida och/eller en nylig användarinteraktion; därför bör eventuell begäran inte vänta på serversvaret. Den innebär då återkoppling på knapptrycket, inte bekräftelse att servern registrerade buzzet.

API:t är progressiv förbättring: kontrollera att `navigator.vibrate` finns och anropa det endast för ett giltigt spelartryck. Om API saknas eller anropet misslyckas ska spelets nuvarande visuella och ljudmässiga återkoppling fortsätta utan fel eller ändrat spelbeteende. Mönster bör hållas korta och enkla, exempelvis en enda puls på cirka 30–50 ms; undvik långa eller upprepade pulser. Ingen vibration ska läggas på hostens kontroller.

## Rekommenderat nästa steg

Om punkten godkänns för implementation: lägg till en kort lokal puls på Android där API finns, med befintlig knapp-feedback som fallback. Bekräfta på riktig Android/Brave-telefon att det fungerar vid tryck och inte vid låsta/otillgängliga knappar. Kontrollera också att iPhone/Safari fortsätter fungera normalt utan vibration. Beslut om en av/på-inställning är ännu inte taget.

## Referenser

- [MDN: Navigator.vibrate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) — API-form, tillgänglighet och användningsbegränsningar.
- [W3C Vibration API](https://www.w3.org/TR/vibration/) — standardens aktiva dokumentation.
- [Can I use: Vibration API](https://caniuse.com/vibration) — webbläsarstödöversikt; kontrollera aktuell mobilversion vid implementation.

Ingen webbläsare eller fysisk mobil testades i denna miljö. Exakt stöd i en viss version av Brave/Android måste därför verifieras på enheten.
