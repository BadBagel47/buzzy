# #289 — konkret plan för ett dygns Hosting-pilot

**Användaren godkände piloten; publiceringen lyckades i run 42139283579.** Reglerna är redan separat godkända, publicerade av användaren och jämförda med aktuell konsolkopia. Denna plan gäller webbplatsens första pilotuppladdning, inte någon ny regelpublicering.

| Val | Exakt mål |
|---|---|
| GitHub-workflow | `Firebase - publish reviewed pilot`, `firebase-pilot.yml`, `main` |
| Google-projekt och Hosting-site | `buzzy-197dc` |
| Kanal | `pilot` |
| Giltighet | `1d` från publicering, enligt Firebase-kanalens expireTime |
| Webbpaket | `buzzy-live-pilot/dist-pilot`, byggt från låsta beroenden |
| Regelkälla | `console`, med ny operatörsbekräftelse |
| Granskad kanonisk regelhash | `148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a` |
| Google-konto | `buzzy-hosting@buzzy-197dc.iam.gserviceaccount.com` |
| GitHub Environment | `firebase-pilot`, endast `main` |

Resultatet blir en publik HTTPS-previewadress som Firebase returnerar, på formen `buzzy-197dc--pilot-….web.app`. Suffixet ska inte gissas. Länken delar projektets **verkliga Auth och databas** samt Spark-kvoter. Det är alltså ett nätverksspel för riktiga testklienter, inte en lokal demo. Den manuellt skapade vägen har inga demospelare/frågor eller demo-fallback. En lyckad uppladdning är inte ett genomfört speltest.

## Publiceringens omfattning

CLI-kommandot är låst till `hosting:channel:deploy pilot`, `--project buzzy-197dc`, `--expires 1d`, `--no-authorized-domains` och en genererad Hosting-only-konfiguration. Huvudkanalen `live`, Auth-domäner, databasregler och speldata är inte skrivmål för kommandot. Ingen betalplans-/billingändring eller API-aktivering ingår. Den aktuella stängda före-pilot-backupen bevaras. Kanalens expiry raderar inga rum eller andra databasdata.

Hosting Admin är en projektroll och kan i sig påverka annan Hosting. Begränsningen till denna kanal upprätthålls av granskad kod, manuellt workflow, repo-/gren-/identitetsvillkor och vald miljö, inte en kanalbaserad IAM-roll. Användaren har skapat konto/roller/delegering/miljö enligt guiden, och Hosting-identitetens Google-auth samt förkontroll/publicering är nu verifierade i run 42139283579.

## Kontroller före varje uppladdning

Workflow bygger och provar appkonfiguration, operativa spärrar och en interceptad HTTPS-körning utan Google-publiceringsbehörighet. Det behåller endast det testade webbpaketet som artifact. I separata pilotjobbet hämtas tillfällig Google-identitet efter installation/återställning av paket. Samma säkra OIDC-selectordiagnostik som i inventeringen visar enbart tillåtna publika fält, aldrig token.

Före uppladdning krävs rätt projekt/databas/site, Anonymous Auth, redan aktivt Hosting API och ingen aktiverad/länkad fakturering. Åtta metadataresurser läses på nytt i konsolläge. Snapshotens projekt/databas/hash, granskad hash och aktuell operatörsbekräftelse måste matcha. Konsoltexten är manuellt verifierad, inte oberoende läst genom regel-API. Godkännandet måste vara färskt, bundet till samma commit/evidensläge och uttryckligen utan databaswrites.

Den nu aktuella primära checkouten har genomgått ren `npm ci` med oförändrad låsfil, tre passerade konfigurationsprov, pilotbuild och ett passerat HTTPS-prov med alla appens externa Firebase-anrop fångade. Tidigare 20 operationstest för oförändrade guardmoduler/snapshot har passerat. YAML kontrolleras med actionlint. Detta är lokal verifiering; GHA-runner/Hosting-token/realistisk mobilspelning prövas först efter publiceringsbeslutet. Inga extra app-/emulatorprov har körts utan ändrad spelkod.

## Efter publicering

Hämta den faktiska länken från körningen eller Hosting-konsolen. Prova host och två riktiga mobiler: skapa/gå med, First/Timed, sen buzz, Retry, bakgrundstimer, reload och End game. Kontrollera faktisk användning i Firebase. Piloten kan tas bort via previewkanalen eller löpa ut; huvudrelease ändras inte. Huvudpublicering och framtidsfunktioner, exempelvis #290 vibration, är separata beslut.


## Faktiskt resultat

[Run 42139283579](https://github.com/BadBagel47/buzzy/actions/runs/42139283579), källa `31dbd67c5d55055a2c48b8bcd14addcabf45fc31`: verify och pilot lyckades i alla steg. Hosting-auth, återställning av det testade artifactet, färsk förkontroll och Hosting-only-kommandot passerade. Deploysteget avslutades 2026-11-06T00:48:25Z. Jobbresultatet är verifierat via publika jobbsteg. Användaren har därefter lämnat den faktiska pilotadressen: https://buzzy-197dc--pilot-mrst5vi1.web.app. Exakt expireTime är ännu inte avläst. Codex-miljöns aktiva nätpolicy tillåter inte previewvärden, så inget HTTP-/webbläsarprov mot adressen har gjorts härifrån. En full verklig spelomgång är ännu inte verifierad.


## Första manuella anslutningsprovet

Öppna pilotlänken på datorn och välj **Host a game**. Öppna samma länk i mobilens Brave, ange rummets fyrteckenskod och ett namn och välj **Join game**. Kontrollera att spelaren syns i hostens Players och att båda vyerna visar anslutning. Börja med en mobil; anslut därefter en andra för buzzordning och resten av spelprovet. Avsluta egna testspel via **End game** när testet är klart. Att bara öppna startsidan initierar enligt koden inte Auth; skapa/gå med och spelhandlingar använder riktig Firebase-kvot. Detta är instruktioner, inte avklarade prov.

De förberedda fixarna #291 (knappar) och #293 (återanslutning/väntelägen) finns ännu bara i källan. Se [RECONNECT_293.md](RECONNECT_293.md). Pilotadressen visar äldre publicerad version tills en ny pilotkörning på main slutförts.
