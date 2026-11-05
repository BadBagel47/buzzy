# #288 — Spark HTTPS-pilot, förberedd men inte publicerad

Modell för detta paket: GPT-6.1 Sol, högt resonemang. Fortsättning på #287, i separat mapp. Originalet `buzzy-spark-app` och tidigare referenser är bevarade. Användaren har godkänt förberedelserna, inte en automatisk publicering eller betalplansändring.

## Två uttryckliga byggmål

`npm run build` bygger det lokala emulatorläget till `dist`. Det accepterar endast localhost/127.0.0.1 och använder demo-buzzy-ui.

`npm run build:pilot` bygger till **dist-pilot** med den redan mottagna offentliga konfigurationen för **buzzy-197dc**, Realtime Database i europe-west1. Det kräver en godkänd HTTPS-origin: standardadresserna buzzy-197dc.web.app/firebaseapp.com eller projektets kanaladress buzzy-197dc--pilot-….web.app. Inga emulatorfunktioner anropas i detta läge. Fel adress/projekt ger fel före SDK-start; inget runtimeval från URL-parametrar eller demofallback. Hostkontroll sker fortfarande genom Auth UID och databasregler, inte genom origin-kontrollen.

Pilotbyggets livekonfiguration är aktiv i just det byggda paketet; paketet har **inte** laddats upp, och inga verkliga Auth-/databasanrop har utförts. Den offentliga apiKey är klientkonfiguration och ger inte deploybehörighet.

## Reproducera kontrollerna

Node24, Java21, Chromium och npm behövs. Behåll den bifogade systermappen buzzy-output med de frysta UI-referenserna.

```sh
NPM_CONFIG_CACHE=/tmp/buzzy-npm-cache npm ci --no-audit --no-fund
npm run test:config
npm run build
npm test
npm run test:production
npm run build:pilot
npm run test:pilot
```

Emulatorproven startar/stänger sina tjänster på 9099/9000/5173. Kör dem sekventiellt med #287/#286/#277. `test:pilot` kör den riktiga pilotbundlen på simulerade HTTPS-origins i Chromium. Alla externa anrop fångas lokalt: Auth nekas av en testfixture. Det verifierar SDK-routing, CSP och säker felhantering, **inte** lyckad molninloggning eller anslutning till verklig RTDB. Inga Firebase-token eller privata nycklar skapas/sparas av provet.

## Driftfiler och resurser

`firebase.pilot.json` pekar Hosting på dist-pilot och reglerna på den kända databasinstansen. Ingen Functions-konfiguration finns. `.firebaserc` behåller demoprojektet; ett riktigt projekt måste anges uttryckligen vid en framtida publicering. Hosting cachelagrar hashade tillgångar långvarigt och HTML utan cache. CSP begränsar anslutningar till Firebase och är provad med byggda sidan. Befintlig inline-JS/CSS kräver unsafe-inline; detta är inte en nonce-baserad strikt CSP. Frågebilder på en HTTPS-pilot bör använda HTTPS.

Samma låga löpande trafik som #287: inga timer-tickskrivningar, individuella små händelser, ändrade metadatafält och inget bibliotek-/historikflöde till spelarna. Samma provisoriska 12 platser. Ingen ny kapacitets-/kvotgaranti. Konfetti #283/#284 väntar separat.

## Webbaserat publiceringsspår #289

Den här mappen ingår nu i det separat förberedda GitHub-paketet #289. Se ../README.md och ../docs/WEBBSETUP.md. Användaren ska inte behöva installera CLI eller köra terminalkommandon. Google-inloggning sker via GitHubs OIDC/Workload Identity Federation, med tillfällig åtkomst och två separata tjänstekonton. Ingen privat nyckelfil eller interaktiv Firebase-inloggning ska efterfrågas.

Manuell inventering läser och sparar befintliga regler/releasemetadata före ändring. Regler publiceras efter granskning i Firebase-konsolen, inte av CI. Pilotflödet kontrollerar aktuell projekt-/plan-/Auth-/databas-/site-/API-status och en granskad regelhash, och skapar endast en endagspreview i Hosting-kanalen pilot. Den genererade firebase.hosting-ci.json innehåller enbart Hosting, med fast site. Auth-domänsynk är avstängd. Huvudpublicering är ett senare beslut.

Molnbehörighet, GitHub-körning och faktisk mobilanslutning är ännu inte verifierade. Varken detta paket eller #288 har publicerats. Originalet i /workspace/buzzy-live-pilot är bevarat. Nätverksdomänerna för tidigare Codex-login är aktiva i revision 7 men behövs inte som en ny användaråtgärd för GitHub-spåret.
