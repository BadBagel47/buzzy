# Buzzy — steg för steg i webbläsaren

Modell för förberedelser och felsökning: **GPT-6.1 Sol, högt resonemang**. Ingen terminal, installation eller privat nyckelfil behövs från användaren. Alla Google-/GitHub-resurser nedan är förslag tills användaren skapar dem i respektive webbgränssnitt. Paketet är lokalt verifierat och uppladdat till main; båda manuella workflows syns i Actions. Googlefederation och metadata-inventering har verifierats i Actions. Regelkopian kommer från manuellt bekräftad konsoltext; Hosting-pilot är inte körd.

Vi gör kopplingen i etapper: källkod på GitHub, ett läsande Google-konto, GitHub/Google-koppling, inventering, regelgranskning och sist pilot. Inget behöver publiceras till spelets huvudsida.

## 1. Lägg det granskade paketet i rätt repo

Repo: [BadBagel47/buzzy](https://github.com/BadBagel47/buzzy). Det är **offentligt** och var tomt vid kontrollen. När paketet läggs där blir källkoden offentlig. Codex har efter uttryckligt godkännande lagt upp det granskade paketet på main. **Steg 1 är klart; börja med steg 2.**

Om Codex lägger upp filerna åt dig behövs ingen egen filhantering. Alternativt kan du ladda ner ZIP-leveransen, dubbelklicka den på Mac och använda GitHubs **uploading an existing file** på det tomma repot, eller **Add file → Upload files**. Ladda upp **innehållet** i mappen `buzzy-github-release`, inte den yttre mappen. På Mac visar **⌘ + Skift + .** dolda filer; `.github` och `.gitignore` måste följa med. Välj `main` som gren. Ladda aldrig upp `node_modules`, inloggningsfiler eller hela chattexporten. Paketet håller sig under webbuppladdningens hundrafilsgräns.

Efter uppladdning ska repots rot visa `.github`, `ops`, `tests`, `docs`, `buzzy-live-pilot`, `buzzy-output` och `README.md`. Actions ska visa de två manuella flödena. Ingen körning startar av uppladdningen.

## 2. Öppna rätt Google-projekt

Öppna [Google Cloud-projektet](https://console.cloud.google.com/home/dashboard?project=buzzy-197dc). Kontrollera att projekt-ID är `buzzy-197dc` och projektnummer `775038676052`. Välj Google-kontot som äger Firebase-projektet. Projektet ligger kvar på Spark; koppla inte betalningskonto.

Via **APIs & Services → Library** går det att aktivera API:er med knappen **Enable/Aktivera** om de inte redan är aktiva. För identitetskopplingen behövs **Identity and Access Management (IAM) API**, **IAM Service Account Credentials API** och **Security Token Service API**. Dessa aktiverar inte någon spelserver eller Blaze. Inventeringen läser också Firebase Management, Firebase Authentication/Identity Toolkit, Firebase Realtime Database Management, Firebase Hosting, Cloud Resource Manager, Cloud Billing och Service Usage. Aktivera en saknad API uttryckligen i konsolen om en körning rapporterar `SERVICE_DISABLED`; flödet gör inte det automatiskt. Cloud Billing API används enbart för läsning av om projektet har aktiv billing.

Om konsolen kräver ett betalningskonto eller saknar behörigheter, stanna på den sidan och visa texten för Codex. Ändra inte betalplan för att komma vidare.

## 3. Skapa ett läsande tjänstekonto

Öppna [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=buzzy-197dc). Välj **Create service account**:

| Fält | Värde |
|---|---|
| Namn | Buzzy GPT |
| Service account ID | `buzzy-gpt` |
| E-post efter skapande | `buzzy-gpt@buzzy-197dc.iam.gserviceaccount.com` |
| Projektroller | **Firebase Viewer** (`roles/firebase.viewer`) och **Service Usage Viewer** (`roles/serviceusage.serviceUsageViewer`) |

Lämna frivillig användaråtkomst tom i skapandeguiden. **Skapa ingen key/JSON-nyckel.** Kontot får läsrättigheter; vi använder dem bara till projektinställningar och befintliga regler, inte spelar-/kontolistor. Viewer-rollen är en projektroll och kan omfatta mer läsning än våra nio fasta GET-anrop. Den är ingen dataskrivarroll.

## 4. Skapa kopplingen från GitHub

Öppna [Workload Identity Pools](https://console.cloud.google.com/iam-admin/workload-identity-pools?project=buzzy-197dc). Välj **Create pool**:

| Fält | Värde |
|---|---|
| Namn | Buzzy GitHub |
| Pool ID | `buzzy-github` |
| Provider type | OpenID Connect / OIDC |
| Provider ID | `github` |
| Issuer URL | `https://token.actions.githubusercontent.com` |
| Audience | Default audience |

Lägg in följande **attribute mappings**. Varje rad är en separat mappning från fältet till uttrycket:

| Google-fält | Uttryck |
|---|---|
| `google.subject` | `assertion.sub` |
| `attribute.repository_id` | `assertion.repository_id` |
| `attribute.repository_owner_id` | `assertion.repository_owner_id` |
| `attribute.ref` | `assertion.ref` |
| `attribute.event_name` | `assertion.event_name` |
| `attribute.workflow_ref` | `assertion.workflow_ref` |

Detta repos faktiska OIDC-subject innehåller både namn och numeriska ID:n (`BadBagel47@340718529/buzzy@1423632612`). Använd exakt formen nedan; det äldre namnformatet nekas.

Klistra in hela följande i **Attribute condition**. Villkoret släpper endast in detta repo/ägare, `main` och de två namngivna manuella flödena med rätt Environment:

```text
assertion.repository_id == '1423632612' &&
assertion.repository_owner_id == '340718529' &&
assertion.ref == 'refs/heads/main' &&
assertion.event_name == 'workflow_dispatch' &&
(
  (
    assertion.workflow_ref == 'BadBagel47/buzzy/.github/workflows/firebase-inventory.yml@refs/heads/main' &&
    assertion.sub == 'repo:BadBagel47@340718529/buzzy@1423632612:environment:firebase-inventory'
  ) ||
  (
    assertion.workflow_ref == 'BadBagel47/buzzy/.github/workflows/firebase-pilot.yml@refs/heads/main' &&
    assertion.sub == 'repo:BadBagel47@340718529/buzzy@1423632612:environment:firebase-pilot'
  )
)
```

Poolen/provider-vyn ska visa denna provider:

```text
projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/providers/github
```

Öppna därefter tjänstekontot `buzzy-gpt` → **Principals with access → Grant access**. Lägg till denna principal med rollen **Workload Identity User** (`roles/iam.workloadIdentityUser`) **på tjänstekontot**, inte på hela projektet:

```text
principal://iam.googleapis.com/projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/subject/repo:BadBagel47@340718529/buzzy@1423632612:environment:firebase-inventory
```

Om gränssnittet istället använder poolens **Grant access → Grant access using Service Account**: välj `buzzy-gpt`, matcha `google.subject` mot `repo:BadBagel47@340718529/buzzy@1423632612:environment:firebase-inventory` och kontrollera samma principal i slutresultatet. Ge inte hela poolen generell åtkomst. Federation genom ett tjänstekonto behöver inte någon tjänstekontonyckel eller generell Token Creator-roll.

Google-ändringen kan ta några minuter att slå igenom. Det är inte ett skäl att skapa en privat nyckel eller vidga åtkomsten.

## 5. Skapa läsmiljön i GitHub

Öppna [repo → Settings → Environments](https://github.com/BadBagel47/buzzy/settings/environments). Skapa Environment **`firebase-inventory`**. Begränsa deployment branches till **Selected branches and tags → main**. Lägg under **Environment variables**, inte Secrets:

| Variabel | Värde |
|---|---|
| `WIF_PROVIDER` | `projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/providers/github` |
| `GOOGLE_SERVICE_ACCOUNT` | `buzzy-gpt@buzzy-197dc.iam.gserviceaccount.com` |

Dessa är offentliga resursnamn, inga lösenord/token. Under **Settings → Actions → General** måste Actions få använda de SHA-låsta standardactionerna från `actions` och `google-github-actions`. GitHub-token ska behålla läsåtkomst; inget brett write-token behövs.

## 6. Kör första inventeringen

Öppna [Actions](https://github.com/BadBagel47/buzzy/actions). Välj **Firebase - inspect and back up → Run workflow → main**. Välj `rules_source=api` för automatisk regel-API-läsning. För detta repos läskonto som nekas regelendpointen används i stället `rules_source=console`; markera då `console_rules_confirmed` först efter att konsolens aktuella regler har jämförts med den sparade `ops/rules-evidence/console-current.rules.json`. Klicka sedan **Run workflow**. Ingen automatisk fallback finns. Körningen ska visa läsande status och ett artifact `buzzy-inventory-…`. Ladda ner och spara det på datorn före någon regeländring; GitHub behåller kopian bara tre dagar.

Artifact innehåller:

- `existing-database.rules.json`: sparad regeltext, från API i API-läge eller från uttryckligen bekräftad konsolkopia i konsolläge. Läs `rulesSource`/`rulesApiVerified` i rapporten.
- I konsolläge: `rules-evidence.json` anger källa/proveniens och `before-pilot.rules.json` bevarar första stängda regeluppsättningen.
- `proposed-database.rules.json`: de lokalt verifierade Buzzy-reglerna.
- `inventory.json`: sanerad projekt-/Auth-/databas-/Hosting-/planstatus, tidigare release-ID:n och båda regelhasharna.

Ingen speldata, användarlista, OAuth-klienthemlighet eller autentiseringsfil hämtas eller sparas. Metadata om tidigare Hosting-releaser är **inte** en full kopia av den gamla webbplatsens filer. Hämta inte hela databasroten som backup i onödan.

Vid OIDC-fel före Google-inloggning visar körningens Summary även **GitHub identity selectors** och artifactet kan innehålla `oidc-selectors.json`. Där visas endast förutbestämda offentliga claims och jämförelser, ingen JWT eller token. Jämför faktisk identitet med provider-villkoret innan något ändras.

Om något misslyckas visar nu även **API read errors** och publika annotations de tillåtna strukturerade felkoderna: exempelvis SERVICE_DISABLED eller IAM_PERMISSION_DENIED, berörd API och eventuellt namngiven IAM-permission. Råa felmeddelanden, token och godtyckliga metadata loggas inte. HTTP 401/403 ensamt avgör inte vilken åtgärd som behövs. Fältet rulesBackupSaved visar om vald regeltext har sparats; rulesSource och rulesApiVerified skiljer API-backup från manuell konsolkopia; proposed-database.rules.json är aldrig en backup av nuvarande molnregler.

Om något misslyckas: läs den namngivna resursen/HTTP-statusen i rapporten. Det kan bero på API-aktivering, IAM eller propagation. Kontrollera orsaken; ge inte kontot Owner/Editor eller databasadministration som generell lösning. Ingen deploy får göras med ofullständig inventering.

## 7. Granska regler före pilot

Den konkreta granskningen finns i [RULES_REVIEW_289.md](RULES_REVIEW_289.md). Run 42126629347 och artifactets hash/filer har verifierats: inga API-fel, ingen aktiverad/länkad fakturering, rätt projekt/databas/Auth/Hosting och bevarad stängd konsolkopia. Föreslagna regler matchar exakt den tidigare lokalt testade #288-versionen. Användaren har därefter godkänt och publicerat just filen. En ny konsolkopia matchar godkänd JSON (endast sista radbrytningen skiljer sig). Aktuell snapshot/hash/proveniens är uppdaterad; före-pilot-backupen är oförändrad. Detta är konsol-/användarverifiering, inte en regel-API-läsning. Nästa steg är Hosting-kontot och pilotmiljön enligt steg 8.

Visa rapporten och regelfilerna för Codex. Kontrollera att rätt projekt/Spark/Anonymous/Hosting/RTDB har lästs, att eventuella befintliga regler är bevarade och att inga andra appar i databasen påverkas. De föreslagna reglerna ersätter hela instansens nuvarande regeluppsättning.

Om granskningen godkänner ändringen: öppna [Firebase Realtime Database → Rules](https://console.firebase.google.com/project/buzzy-197dc/database/buzzy-197dc-default-rtdb/rules). Spara först befintliga regler, ersätt sedan med hela innehållet i `proposed-database.rules.json` och välj **Publish**. Detta är en verklig molnändring och görs först efter konkret granskning; GitHub gör den inte åt dig. Vid behov återställs hela den sparade gamla regeluppsättningen samma väg.

I konsolläge: kopiera efter godkänd publicering hela den aktuella regeltexten från Firebase-konsolen och lämna den till Codex. Vi uppdaterar konsolkopian och dess hash/proveniens, medan before-pilot-backupen ligger kvar. En framtida körning med kryssrutan bekräftar att kopian fortfarande matchar de aktuella konsolreglerna; GitHub kan inte oberoende bevisa live-texten med detta konto.

Kör inventeringen igen med rätt valt evidensläge. Båda hashvärdena ska nu matcha. Spara den granskade föreslagna SHA-256-strängen till pilotsteget. Om de skiljer sig stoppar pilotflödet utan uppladdning.

Kontrollera i Firebase-konsolen att Anonymous är på och Auto clean-up fortsatt av, enligt tidigare beslut. Under Hosting kan den första **Get started**-guiden behöva slutföras för standardsiten. Ingen CLI-installation behövs från dig; fil-/deploydelen ersätts av GitHub-flödet. API-/site-skapande görs inte av inventeringen. Koppla inte in App Hosting/Cloud Run/Functions eller Blaze.

## 8. Koppla Hosting-kontot först när inventeringen är granskad

Skapa på samma sätt ett tjänstekonto med ID **`buzzy-hosting`**, e-post `buzzy-hosting@buzzy-197dc.iam.gserviceaccount.com`. Ge projektrollerna **Firebase Viewer**, **Service Usage Viewer** och **Firebase Hosting Admin** (`roles/firebasehosting.admin`). Ingen Realtime Database Admin, Auth Admin, Editor, Owner, billing- eller API-enable-roll.

På just detta tjänstekontos flik **Principals with access** lägger du rollen **Workload Identity User** för:

```text
principal://iam.googleapis.com/projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/subject/repo:BadBagel47@340718529/buzzy@1423632612:environment:firebase-pilot
```

Skapa GitHub Environment **`firebase-pilot`**, begränsad till `main`. Lägg samma `WIF_PROVIDER`, men `GOOGLE_SERVICE_ACCOUNT=buzzy-hosting@buzzy-197dc.iam.gserviceaccount.com`. Lägg dig själv som **Required reviewer** om inställningen finns på repots plan; lämna **Prevent self-review** av om du är ensam och själv ska kunna godkänna. Manuell Run workflow och regelhash krävs alltid, även utan reviewer-funktionen.

Hosting Admin är en projektroll som kan påverka även huvudsidan. Begränsningen till preview ligger i de granskade workflow-/scriptfilerna och behörigheten till just dem. Det är ingen Google IAM-isolering till en enda kanal. Ändra inte filerna till live-deploy eller lägg till automatiska triggers utan ny granskning.

## 9. Publicera den konkreta piloten när du är redo

På Actions väljer du **Firebase - publish reviewed pilot → Run workflow → main**. Ange den granskade hashsträngen i `reviewed_rules_sha256`. Använd samma `rules_source` som granskats. Konsolläge kräver att `console_rules_confirmed` markeras efter en ny aktuell konsolkontroll; en gammal snapshot/ett godkännande från en tidigare run räcker inte som bekräftelse för en ny run. Bygget och lokalt interceptat HTTPS-prov körs först utan Google-behörighet. Godkänn därefter eventuell Environment-granskning. En ny läsande metadatakontroll och kontroll av vald regelevidens körs innan `pilot` laddas upp med giltighet **en dag**.

Körningen får inte:

- skriva databasregler eller speldata,
- synka Auth-domäner,
- skapa/uppgradera billing eller aktivera API:er,
- ersätta huvudkanalen `live`.

Den faktiska adressen visas av Firebase-utskriften och i Hosting-konsolen. Den ska följa `https://buzzy-197dc--pilot-….web.app`. Använd den faktiska länken; gissa inte suffixet. Preview kan vara offentligt nåbar för den som har länken; det är inget privat inloggningsskydd. Anonymous Auth behöver inte någon popup-inloggning. Om API-nyckeln har egna referensbegränsningar måste previewadressen tillåtas uttryckligen efter granskning i webbkonsolen.

Prova host + två riktiga mobiler, First/Timed, sen buzz, Retry, bakgrundstimer, reload och End game. Följ faktisk Firebase-användning. Länken räknar mot samma projekt/databas som huvudappen; den isolerar inte data och raderar inte rum vid expiry. Huvudpublicering är ett senare separat beslut.

## Återgång och stängning

Piloten kan tas bort via Hosting-konsolens previewkanaler eller löpa ut efter en dag; tidigare huvudrelease är kvar. Databasregler återställs från den nedladdade backupen i regelredigeraren efter granskning. Avsluta egna testspel via End game så rumsdata raderas. Vid avslutad pilot kan användaren stänga provider eller ta bort kontots Workload Identity User-bindning; då kan GitHub inte längre få nya Google-token. Detta raderar inte befintliga rum eller andra Firebase-resurser.

Den äldre Codex-inloggningshjälpen i buzzy-operations behövs inte för detta spår. Inga Firebase-konton eller Google-nycklar ska skickas i chatten.


## Om en tidigare koppling gav attribute-condition-fel

I körning 42115890476 matchade alla claims utom sub: den faktiska GitHub-identiteten hade @ID efter ägare och repo. Rätta båda sub-strängarna i provider-villkoret enligt steg 4, och lägg till den rättade inventory-principalen med Workload Identity User på buzzy-gpt via Principals with access. Behåll övriga repo-/ägar-/gren-/event-/workflowvillkor oförändrade. När den nya kopplingen fungerar kan den tidigare namn-only-principalen tas bort från samma konto; rör inte andra befintliga principals. Ingen bredare principalSet-, Owner-, Editor- eller Token Creator-roll behövs. Pilotidentiteten följer samma ID-kvalificerade repoformat men har ännu inte observerats i en verklig pilotkörning.


## Aktuell första konsolbackup

Användaren lämnade följande regler, vars JSON-formatering normaliserats men vars behörigheter behållits:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

Kanonisk SHA-256: `015b3c9522d817bcb4544d5df22b987b57dd6aa615028779c68cd0c6903428ab`. Detta är en manuell konsolkopia, inte API-verifierade originalbytes. Första metadata-inventeringen i konsolläge kan slutföras med denna kopia, men pilotpubliceringen stoppas eftersom de stängda reglerna inte matchar de föreslagna spelreglerna. Ingen regelförändring är ännu utförd.


## Aktuell publicerad konsolkopia

Regelpubliceringen är användarbekräftad och kopian från Rules-editorn är granskad. Kanonisk hash är `148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a`, samma som förslaget. Snapshoten behåller exakt den mottagna texten; endast filens sista LF skiljer från den pinnade förslagsfilen. Det tidigare avsnittet om första stängda konsolbackup beskriver fortfarande den bevarade återgångspunkten, inte nuvarande publicerade regler.

Nästa nya metadatakontroll kan göras av pilotflödets egen förkontroll efter att Hosting-identitet/miljö är klara; en separat inventory-run är inte nödvändig bara för att upprepa samma åtta läsningar. Piloten kräver fortsatt nytt uttryckligt beslut och dess aktuella manuella konsolbekräftelse.


## Hosting-piloten förberedd för beslut

Användaren har bekräftat Hosting-konto/delegering och firebase-pilot-miljö med main/variabler. Första faktiska Hosting-inloggningen/deployen är ännu inte provad. Se [PILOT_RUN_289.md](PILOT_RUN_289.md) för det exakta föreslagna publika endagsmålet. Ren installation, build och lokala config-/HTTPS-prov är klara från primär checkout; det lokala HTTPS-provet fångar upp samtliga externa appanrop. Invänta publiceringsbeslut före Run workflow för denna pilot.
