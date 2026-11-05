# Buzzy — webbaserad Spark-pilot (#289)

**Källkoden är uppladdad till GitHub; Firebase-piloten är inte publicerad.** Användaren godkände uppladdningen till det offentliga repot `BadBagel47/buzzy`. Det granskade paketet lades upp oförändrat i commit `09d0e00b94a12962e5f30b5819c220a417a2517a`. Den här leveransen innehåller projektkällor och frysta UI-referenser, inte kontots chattexport eller privata nycklar. Tidigare #288 och #287 är bevarade separat.

Användaren ska inte behöva installera något eller köra terminalkommandon. Följ [webbguiden](docs/WEBBSETUP.md). Den första molnkörningen läser bara inställningar och sparar regler. Ett separat manuellt flöde kan efter granskning publicera en endagspilot till Hosting-kanalen `pilot`. Inget flöde publicerar till huvudsidan. Båda manuella flödena syns nu under Actions; ingen körning har startats.

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

Databasregler ändras **inte** av något workflow. Efter backup och granskning kan användaren publicera de föreslagna reglerna i Firebase-konsolens regelredigerare. Pilotflödet kräver sedan exakt matchning med både granskad hash och reglerna som redan finns i molnet. Första Hosting-/Auth/API-aktivering görs vid behov uttryckligen i webbkonsolen. CLI-flödet tillåts inte börja förrän Hosting API är verifierat aktiverat; Auth-domänsynk är avstängd.

Preview isolerar inte databasen. Aktuella regler och rumsdata hör till det riktiga projektet, även när webbplatsen ligger på en previewadress. Spara backupen lokalt före regeländring. Artifact-retention är tre dagar och pilotlänken gäller en dag. Pilotens giltighet raderar inte övergivna rum och stoppar inte åtkomst genom andra webbplatser.

Publika GitHub-repon kan köras med standardvärdar utan Actions-minutkostnad enligt GitHubs vanliga villkor; artifacts/cacher är fortfarande resurser. Paketet använder kort retention och små webbbyggen. Detta är inte en kvot-/kostnadsgaranti för Firebase eller GitHub. Ingen Blaze eller betalningskoppling ingår.

## Validering för utvecklare

Kör `node --test tests/operations.test.mjs` från roten. I `buzzy-live-pilot`: låst `npm ci`, `npm run test:config`, `npm run build:pilot`, `CHROMIUM_PATH=/path/to/chromium npm run test:pilot`. Actions kör samma kontroller. Den fulla emulator-/mobilpiloten är inte ersatt av dessa kontroller. Interceptade HTTPS-prov visar inte en lyckad verklig Firebase-anslutning.

Officiell grund: [Google auth-action och WIF](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account), [Firebase Hosting-preview](https://firebase.google.com/docs/hosting/test-preview-deploy), [Google Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines).
