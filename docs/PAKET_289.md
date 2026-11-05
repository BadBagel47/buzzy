# #289 — GitHub Actions med webbaserad Google-koppling

**Källkod uppladdad till GitHub; inte Firebase-aktiverat eller publicerat.** Användaren vill inte köra något i terminalen och gav Kör för detta alternativ. Modell: GPT-6.1 Sol, högt resonemang. Nästa fria ID #290.

## Leverans

- Arbets-/leveransmapp: /workspace/buzzy-github-release.
- Hela webbhandledningen: buzzy-github-release/docs/WEBBSETUP.md.
- Självbärande källkodspaket: BUZZY_GITHUB_ACTIONS_289.zip.
- Rapporter: buzzy-github-release/reports/readiness-289.json och test-/actionlint-loggar.

Paketet har två manuella workflows: först läsande inventering och exakt rå regelbackup; därefter en separat, granskad Hosting-preview i en dag. Ingen push-/PR-/schemautlösare finns. Google OIDC/WIF ger tillfällig åtkomst till separata tjänstekonton; inga privata JSON-nycklar eller användarens CLI-login behövs. Behörigheten begränsas till numeriska repo-/ägar-ID:n, main, rätt workflow och environment.

## Kontrollerade gränser

Inventeringen gör nio fasta GET-anrop, hämtar inga speldata/kontolistor, följer inga tokenbärande redirects och exporterar inte full Auth-konfiguration eller OAuth-hemligheter. Kommentarer i regler sparas exakt för återgång men ignoreras vid JSON-/hashjämförelse. Aktuell rules-API-backup och sanerad release-/projektmetadata sparas med tre dagars artifact-retention; användaren behöver ladda ner backup före regeländring. Release-ID:n är metadata, ingen full kopia av tidigare site.

Ingen CI-databasskrivning. Efter inventering och konkret granskning kan regler publiceras i Firebase-konsolen; flödet stoppar om befintliga regler inte matchar föreslagna och granskad hash. Hosting API måste redan vara aktivt, rätt projekt/databas/site/Anonymous kontrolleras och aktiv/länkad billing stoppar. Billing-info är en kontroll av länkning/aktivering; den är inte i sig ett separat Firebase-plannamn. Spark är fortsatt användarens krav.

Pilotkommandot är låst till hosting:channel:deploy pilot, expires 1d, no-authorized-domains, fast projekt och Hosting-only-konfiguration. Huvudkanalen är inte mål. Hosting Admin har dock projektomfattande Hosting-rättigheter; kanalbegränsningen ligger i granskad kod/Workload-villkor, inte en separat kanal-IAM-roll. Preview delar riktig databas och saknar privat länkskydd. Expiry raderar inga rum.

## Faktisk verifiering

16 passerade lokala testposter utan skips: 12 operationstest med lokala API-fixtures, 3 appkonfigurationsprov, 1 HTTPS-prov på den byggda piloten med samtliga molnanrop interceptade. Ren npm ci med oförändrad låsfil och separat pilotbuild passerar. Två workflow-filer passerar actionlint 1.7.7; shellcheck/pyflakes är inte körda. Officiell actionlint-binär checksummeverifierad. Actionreferenser är SHA-låsta och verifierade mot officiella GitHub-taggar. Hosting REST-adresser jämförda med Googles publika Discovery-beskrivning.

#288:s 66 manifestposter verifieras oförändrade. Spelkällor/databasregler/låsfil är byte-identiska; HTTPS-testet i nya kopian accepterar CHROMIUM_PATH för GitHub-browsern. Full emulatorregression är inte nykörd när spelbeteendet inte ändrats. GitHub-runnern, Google federation/IAM och verklig Auth/RTDB/mobilanslutning är inte verifierade.

## Nästa externa steg

Repo BadBagel47/buzzy är offentligt, ID 1423632612, ägar-ID 340718529. Det granskade paketets 53 filer har efter användarens uttryckliga godkännande lagts upp på main i commit 09d0e00b94a12962e5f30b5819c220a417a2517a. Båda manuella workflowfiler syns på Actions-sidan. Ingen workflowkörning är startad. ZIP har avgränsade projekt-/UI-indata, inga chattexporter, node_modules eller credentials. Därefter följer användaren webbguiden för läsande tjänstekonto och WIF/Environment, kör inventering, sparar backup och granskar resultatet före någon molnregel-/Hosting-ändring. Ingen Google IAM/WIF/API-ändring, betalplansändring eller deploy är utförd.

Miljöns tidigare Google/Firebase-nätutkast är redan aktivt i revision 7. GitHub-spåret kräver inte att samma miljöutkast godkänns igen. Den gamla Codex-login-hjälpen är historik och ska inte erbjudas som ett krav för detta spår.
