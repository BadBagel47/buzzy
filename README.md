# Buzzy — webbaserad Spark-pilot (#289)

**Källkoden är uppladdad till GitHub; Firebase-piloten är inte publicerad.** Användaren godkände uppladdningen till det offentliga repot `BadBagel47/buzzy`. Det granskade paketet lades upp oförändrat i commit `09d0e00b94a12962e5f30b5819c220a417a2517a`. Den här leveransen innehåller projektkällor och frysta UI-referenser, inte kontots chattexport eller privata nycklar. Tidigare #288 och #287 är bevarade separat.

Användaren ska inte behöva installera något eller köra terminalkommandon. Följ [webbguiden](docs/WEBBSETUP.md). Inventeringen läser bara inställningar och bevarar reglernas evidens: antingen en API-läsning eller en uttryckligen bekräftad konsolkopia. Ett separat manuellt flöde kan efter granskning publicera en endagspilot till Hosting-kanalen `pilot`. Inget flöde publicerar till huvudsidan. Googlefederation och hela metadata-inventeringen är nu verifierade i Actions. Den granskade rapporten visar ingen aktiverad/länkad fakturering. Nuvarande regler är en manuellt bekräftad, bevarad konsolkopia. [Det konkreta regelförslaget](docs/RULES_REVIEW_289.md) är klart för användarens publiceringsbeslut; ingen molnregeländring eller Hosting-pilot är utförd.

## Paketets delar

- `.github/workflows/firebase-inventory.yml`: manuell inventering, GET-anrop och backup av befintliga regler; inga npm-installationer eller resursändringar.
- `.github/workflows/firebase-pilot.yml`: låst installation, konfigurations-/HTTPS-prov, separat Google-inloggning, ny backup/förkontroll, därefter enbart Hosting-preview.
- `ops/`: fasta projekt-/repo-/gren-/identitetskontroller, läsande API-adresser och avgränsat deploykommando.
- `buzzy-live-pilot/`: kopia av #288-källorna. Enda testanpassningen är valbar `CHROMIUM_PATH` för GitHubs testwebbläsare. Spelets logik/regler är oförändrade.
- `buzzy-output/`: enbart de två frysta UI-indata som generatorn kräver. Detta är inte den stora arbetsmappen med historik.
- `tests/operations.test.mjs`: behörighets-/inventerings-/publiceringsspärrar med lokala API-fixtures.
- `reports/readiness-289.json`: vad som faktiskt har kontrollerats lokalt och vad som återstår.

## Behörighet och godkännande

GitHub OIDC och Google Workload Identity Federation används via två separata tjänstekonton, ett läsande och ett för Hosting. **Ingen JSON-privatnyckel, Firebase CI-token eller Google-inloggningskod behövs.** Tillfälliga behörigheter skapas för rätt repo, numerisk ägare/repo-identitet, `main`, rätt manuella workflow och rätt GitHub Environment.

Inga push-/pull-request-/schemautlösare finns. Att lägga koden på GitHub aktiverar ingen Firebase-publicering. Behörighetskopplingen måste först skapas i Google/GitHubs webbkonsoler. Review och Run workflow sker av användaren. Firebase-planen förblir Spark; flödet nekar pilot när ett länkat billingkonto rapporteras aktivt eller planstatus inte går att kontrollera.

Databasregler ändras **inte** av något workflow. Efter backup och granskning kan användaren publicera de föreslagna reglerna i Firebase-konsolens regelredigerare. Pilotflödet kräver exakt matchning med granskad hash och vald regelevidens. API-läge kräver en lyckad aktuell regel-API-läsning. Konsolläge kräver separat uttrycklig bekräftelse vid varje körning att den sparade kopian matchar konsolens aktuella regler; detta är manuell kontroll, ingen oberoende API-verifiering. Första Hosting-/Auth/API-aktivering görs vid behov uttryckligen i webbkonsolen. CLI-flödet tillåts inte börja förrän Hosting API är verifierat aktiverat; Auth-domänsynk är avstängd.

Preview isolerar inte databasen. Aktuella regler och rumsdata hör till det riktiga projektet, även när webbplatsen ligger på en previewadress. Spara backupen lokalt före regeländring. Artifact-retention är tre dagar och pilotlänken gäller en dag. Pilotens giltighet raderar inte övergivna rum och stoppar inte åtkomst genom andra webbplatser.

Publika GitHub-repon kan köras med standardvärdar utan Actions-minutkostnad enligt GitHubs vanliga villkor; artifacts/cacher är fortfarande resurser. Paketet använder kort retention och små webbbyggen. Detta är inte en kvot-/kostnadsgaranti för Firebase eller GitHub. Ingen Blaze eller betalningskoppling ingår.

## Regelbackup och manuellt konsolläge

Användarens konsolkopia sparas i `ops/rules-evidence/console-current.rules.json` med projekt/databas/hash/proveniens i `console-snapshot.json`. Den första, helt stängda regeluppsättningen bevaras separat i `before-pilot.rules.json` för återgång. Formatering normaliserades från chattens HTML-/radbrytningsmarkeringar, behörigheterna är exakt `.read: false` och `.write: false`. Detta bevisar inte att databasen är tom.

Standardvalet `rules_source=api` är fortsatt strikt och faller aldrig automatiskt tillbaka vid 401. Välj `rules_source=console` och markera `console_rules_confirmed` endast efter kontroll av aktuell konsoltext mot sparad kopia. Konsolläget gör åtta metadata-GET-anrop och ingen regel-API-läsning. Rapport/artifact anger källan och `rulesApiVerified: false`. En grön metadata-inventering är inte ett publiceringsgodkännande: den nuvarande stängda kopian matchar inte föreslagna spelregler och pilotspärren stoppar fortfarande.

Efter en godkänd regelpublicering ska användaren lämna en ny konsolkopia. Endast den aktuella kopian/metadata uppdateras; före-pilot-backupen behålls. Pilot kräver sedan samma manuella bekräftelse, matchande föreslagen/granskad hash och övriga molnkontroller. Den manuella vägen ger inte läskontot bredare IAM-rättigheter.

## Validering för utvecklare

Kör `node --test tests/operations.test.mjs` från roten. I `buzzy-live-pilot`: låst `npm ci`, `npm run test:config`, `npm run build:pilot`, `CHROMIUM_PATH=/path/to/chromium npm run test:pilot`. Actions kör samma kontroller. Den fulla emulator-/mobilpiloten är inte ersatt av dessa kontroller. Interceptade HTTPS-prov visar inte en lyckad verklig Firebase-anslutning.

Officiell grund: [Google auth-action och WIF](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account), [Firebase Hosting-preview](https://firebase.google.com/docs/hosting/test-preview-deploy), [Google Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
