# Buzzy — steg för steg i webbläsaren

Modell för förberedelser och felsökning: **GPT-6.1 Sol, högt resonemang**. Ingen terminal, installation eller privat nyckelfil behövs från användaren. Alla Google-/GitHub-resurser nedan är förslag tills användaren skapar dem i respektive webbgränssnitt. Paketet är lokalt verifierat och uppladdat till main; båda manuella workflows syns i Actions. Ingen GitHub-körning eller molnbehörighet är ännu verifierad.

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

Klistra in hela följande i **Attribute condition**. Villkoret släpper endast in detta repo/ägare, `main` och de två namngivna manuella flödena med rätt Environment:

```text
assertion.repository_id == '1423632612' &&
assertion.repository_owner_id == '340718529' &&
assertion.ref == 'refs/heads/main' &&
assertion.event_name == 'workflow_dispatch' &&
(
  (
    assertion.workflow_ref == 'BadBagel47/buzzy/.github/workflows/firebase-inventory.yml@refs/heads/main' &&
    assertion.sub == 'repo:BadBagel47/buzzy:environment:firebase-inventory'
  ) ||
  (
    assertion.workflow_ref == 'BadBagel47/buzzy/.github/workflows/firebase-pilot.yml@refs/heads/main' &&
    assertion.sub == 'repo:BadBagel47/buzzy:environment:firebase-pilot'
  )
)
```

Poolen/provider-vyn ska visa denna provider:

```text
projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/providers/github
```

Öppna därefter tjänstekontot `buzzy-gpt` → **Principals with access → Grant access**. Lägg till denna principal med rollen **Workload Identity User** (`roles/iam.workloadIdentityUser`) **på tjänstekontot**, inte på hela projektet:

```text
principal://iam.googleapis.com/projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/subject/repo:BadBagel47/buzzy:environment:firebase-inventory
```

Om gränssnittet istället använder poolens **Grant access → Grant access using Service Account**: välj `buzzy-gpt`, matcha `google.subject` mot `repo:BadBagel47/buzzy:environment:firebase-inventory` och kontrollera samma principal i slutresultatet. Ge inte hela poolen generell åtkomst. Federation genom ett tjänstekonto behöver inte någon tjänstekontonyckel eller generell Token Creator-roll.

Google-ändringen kan ta några minuter att slå igenom. Det är inte ett skäl att skapa en privat nyckel eller vidga åtkomsten.

## 5. Skapa läsmiljön i GitHub

Öppna [repo → Settings → Environments](https://github.com/BadBagel47/buzzy/settings/environments). Skapa Environment **`firebase-inventory`**. Begränsa deployment branches till **Selected branches and tags → main**. Lägg under **Environment variables**, inte Secrets:

| Variabel | Värde |
|---|---|
| `WIF_PROVIDER` | `projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/providers/github` |
| `GOOGLE_SERVICE_ACCOUNT` | `buzzy-gpt@buzzy-197dc.iam.gserviceaccount.com` |

Dessa är offentliga resursnamn, inga lösenord/token. Under **Settings → Actions → General** måste Actions få använda de SHA-låsta standardactionerna från `actions` och `google-github-actions`. GitHub-token ska behålla läsåtkomst; inget brett write-token behövs.

## 6. Kör första inventeringen

Öppna [Actions](https://github.com/BadBagel47/buzzy/actions). Välj **Firebase - inspect and back up → Run workflow → main → Run workflow**. Körningen ska visa läsande status och ett artifact `buzzy-inventory-…`. Ladda ner och spara det på datorn före någon regeländring; GitHub behåller kopian bara tre dagar.

Artifact innehåller:

- `existing-database.rules.json`: full befintlig regeluppsättning för återgång.
- `proposed-database.rules.json`: de lokalt verifierade Buzzy-reglerna.
- `inventory.json`: sanerad projekt-/Auth-/databas-/Hosting-/planstatus, tidigare release-ID:n och båda regelhasharna.

Ingen speldata, användarlista, OAuth-klienthemlighet eller autentiseringsfil hämtas eller sparas. Metadata om tidigare Hosting-releaser är **inte** en full kopia av den gamla webbplatsens filer. Hämta inte hela databasroten som backup i onödan.

Vid OIDC-fel före Google-inloggning visar körningens Summary även **GitHub identity selectors** och artifactet kan innehålla `oidc-selectors.json`. Där visas endast förutbestämda offentliga claims och jämförelser, ingen JWT eller token. Jämför faktisk identitet med provider-villkoret innan något ändras.

Om något misslyckas: läs den namngivna resursen/HTTP-statusen i rapporten. Det kan bero på API-aktivering, IAM eller propagation. Kontrollera orsaken; ge inte kontot Owner/Editor eller databasadministration som generell lösning. Ingen deploy får göras med ofullständig inventering.

## 7. Granska regler före pilot

Visa rapporten och regelfilerna för Codex. Kontrollera att rätt projekt/Spark/Anonymous/Hosting/RTDB har lästs, att eventuella befintliga regler är bevarade och att inga andra appar i databasen påverkas. De föreslagna reglerna ersätter hela instansens nuvarande regeluppsättning.

Om granskningen godkänner ändringen: öppna [Firebase Realtime Database → Rules](https://console.firebase.google.com/project/buzzy-197dc/database/buzzy-197dc-default-rtdb/rules). Spara först befintliga regler, ersätt sedan med hela innehållet i `proposed-database.rules.json` och välj **Publish**. Detta är en verklig molnändring och görs först efter konkret granskning; GitHub gör den inte åt dig. Vid behov återställs hela den sparade gamla regeluppsättningen samma väg.

Kör inventeringen igen. Båda hashvärdena ska nu matcha. Spara den granskade föreslagna SHA-256-strängen till pilotsteget. Om de skiljer sig stoppar pilotflödet utan uppladdning.

Kontrollera i Firebase-konsolen att Anonymous är på och Auto clean-up fortsatt av, enligt tidigare beslut. Under Hosting kan den första **Get started**-guiden behöva slutföras för standardsiten. Ingen CLI-installation behövs från dig; fil-/deploydelen ersätts av GitHub-flödet. API-/site-skapande görs inte av inventeringen. Koppla inte in App Hosting/Cloud Run/Functions eller Blaze.

## 8. Koppla Hosting-kontot först när inventeringen är granskad

Skapa på samma sätt ett tjänstekonto med ID **`buzzy-hosting`**, e-post `buzzy-hosting@buzzy-197dc.iam.gserviceaccount.com`. Ge projektrollerna **Firebase Viewer**, **Service Usage Viewer** och **Firebase Hosting Admin** (`roles/firebasehosting.admin`). Ingen Realtime Database Admin, Auth Admin, Editor, Owner, billing- eller API-enable-roll.

På just detta tjänstekontos flik **Principals with access** lägger du rollen **Workload Identity User** för:

```text
principal://iam.googleapis.com/projects/775038676052/locations/global/workloadIdentityPools/buzzy-github/subject/repo:BadBagel47/buzzy:environment:firebase-pilot
```

Skapa GitHub Environment **`firebase-pilot`**, begränsad till `main`. Lägg samma `WIF_PROVIDER`, men `GOOGLE_SERVICE_ACCOUNT=buzzy-hosting@buzzy-197dc.iam.gserviceaccount.com`. Lägg dig själv som **Required reviewer** om inställningen finns på repots plan; lämna **Prevent self-review** av om du är ensam och själv ska kunna godkänna. Manuell Run workflow och regelhash krävs alltid, även utan reviewer-funktionen.

Hosting Admin är en projektroll som kan påverka även huvudsidan. Begränsningen till preview ligger i de granskade workflow-/scriptfilerna och behörigheten till just dem. Det är ingen Google IAM-isolering till en enda kanal. Ändra inte filerna till live-deploy eller lägg till automatiska triggers utan ny granskning.

## 9. Publicera den konkreta piloten när du är redo

På Actions väljer du **Firebase - publish reviewed pilot → Run workflow → main**. Ange den granskade hashsträngen i `reviewed_rules_sha256`. Bygget och lokalt interceptat HTTPS-prov körs först utan Google-behörighet. Godkänn därefter eventuell Environment-granskning. En ny läsande molnkontroll/backup körs innan `pilot` laddas upp med giltighet **en dag**.

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
