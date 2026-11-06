# #289 — GitHub Actions med webbaserad Google-koppling

**Källkod på GitHub, Googlefederation verifierad, Firebase-pilot publicerad via godkänd endagskörning.** Användaren vill arbeta helt via webben. Modell: GPT-6.1 Sol, högt resonemang. Nästa fria ID #291.

## Aktuellt

GitHub-repo BadBagel47/buzzy är offentligt. Två manuella flöden finns; inga push-/PR-/schemautlösare. GitHub OIDC/WIF och kontot buzzy-gpt fungerar efter rättning till ID-kvalificerat subject. Tidigare fel rapporterades från run 42123366809: Cloud Billing API var avstängt och regelendpointen nekade läskontot. Användaren har aktiverat API:et och lämnat konsolens hela regeltext, som endast innehåller .read:false och .write:false. Därefter har run 42126629347 och hela artifactet granskats: inga API-fel, billingEnabled:false, billingAccountLinked:false och bevarad manuellt bekräftad konsolkopia. Detta säger inget om befintliga data.

Regelkopian är sparad i ops/rules-evidence/console-current.rules.json och oföränderlig före-pilot-referens before-pilot.rules.json. Snapshotmetadata anger projekt/databas, manuell källa, fångsttid och kanonisk hash. HTML-blanksteg och radbrytningsmarkeringar från chatten normaliserades till giltig JSON, med exakt samma behörigheter; det är inte en kopia av verifierade originalbytes från servern. Originalmeddelandet är bevarat separat i den lokala backupen.

## Två uttryckliga evidenslägen

Standard api kräver lyckad regel-API-läsning och faller aldrig automatiskt tillbaka vid 401. Console kräver aktivt valt rules_source=console och console_rules_confirmed=true vid varje run. Den sparade konsolkopians projekt/databas/hash och bevarade baseline valideras före användning. Flödet gör då åtta fasta metadata-GET-anrop, sparar kopior och märker rapport/artifact som console-copy-confirmed, rulesApiVerified:false. Det verifierar inte oberoende vad som är publicerat i Firebase.

Inventory kan slutföra metadata och bevara den aktuella stängda konsolkopian. En grön sådan körning betyder inte redo att publicera spel: stängda regler matchar inte förslaget och pilotgaten nekar fortsatt. Regelförslaget har nu godkänts/publicerats av användaren. Den nya konsolkopian matchar godkänd JSON och snapshot/hash/proveniens har uppdaterats; före-pilot-backupen är oförändrad. Pilot kräver matchande snapshot/proposed/reviewed-hash, ny operatörsbekräftelse och alla övriga aktuella projekt-/plan-/Auth-/databas-/Hosting/API-kontroller.

## Begränsningar

Inga CI-regel-/dataskrivningar, privata nycklar, allmän Admin eller användarterminal. Cloud Billing-kontrollen läser bara om faktureringskonto är länkat/aktiverat; ingen betalplansändring görs. Pilotkommandot är fast Hosting-only, kanal pilot, en dag och avstängd Auth-domänsynk. Hosting Admin är en projektroll; previewbegränsningen ligger i granskad kod och WIF-villkor, inte kanal-IAM. Preview delar verklig databas och saknar privat länkskydd. Expiry raderar inga rum.

Artifactretention är tre dagar; användaren sparar backup lokalt före regeländring. Release-ID:n är metadata, ingen full gammal webbplatskopia. Manuell konsolbekräftelse förlitar sig på operatörens kontroll; API-läge ger oberoende läsning när kontoåtkomst tillåter. Använd ingen publiceringsgate som om manuell evidens vore API-verifierad.

## Verifiering

20 operationstest passerar utan skips: bland annat riktig tidigare OIDC-claims-regression, felredigering utan credentials, båda evidenslägenas negativa fall och full sandboxad konsolkörning med åtta GETs där stängda regler aldrig tillåter pilot. Två workflows passerar actionlint 1.7.7; shellcheck/pyflakes inte körda. Verklig konsolkopias hash/projekt/databas/baseline validerad lokalt. Tre tidigare appconfigprov och ett interceptat HTTPS-prov är historisk oförändrad-app-evidens, inte nykörda. Inget nytt appbygge eller full emulatorregression behövs för dessa operativa ändringar; verklig mobilpilot återstår.

## Nästa steg

Användaren godkände den konkreta publika piloten. [Körning 42139283579](https://github.com/BadBagel47/buzzy/actions/runs/42139283579) lyckades i verify/tester samt pilot/auth/förkontroll/Hosting-only-deploy. Källrevision 31dbd67c5d55055a2c48b8bcd14addcabf45fc31. Den faktiska previewadressen återstår att hämta ur CLI-loggen eller Hosting-konsolen; inga adresser/suffix ska gissas. Verkliga mobiltester och Usage-kontroll återstår. Huvudkanalen och nya billing-/regeländringar ingår inte i publiceringen.
