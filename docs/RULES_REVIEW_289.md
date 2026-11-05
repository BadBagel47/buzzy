# #289 — godkänd regeländring, publicering bekräftad via konsolkopia

## Förslag

Ersätt den nuvarande helt stängda regeluppsättningen med [den granskade Buzzy-regelfilen](../buzzy-live-pilot/database.rules.json). Rotens `.read:false` och `.write:false` ligger kvar; avgränsade undantag införs under `/rooms`. Inga andra databasgrenar öppnas av förslaget. Publicering ändrar åtkomstregler, inte lagrade data. Användaren har uttryckligen godkänt och genomfört publiceringen i Firebase-konsolen. Därefter mottagen konsoltext matchar godkänd JSON; endast slutlig LF saknas. Det är en manuellt verifierad konsolkopia, inte en oberoende API-läsning.

## Vad beteendet innebär

- En anonymt autentiserad spelidentitet kan skapa ett rum med fyrteckenskod och sig själv som ägare. Rumsägaren kan avsluta/radera sitt rum.
- Rumsägaren styr omgångar, inställningar, bedömning och poäng. Deltagarnas tillåtna skrivningar gäller bland annat egen anslutning, buzz och inläsningskvittens. Serverreglerna kontrollerar aktuell omgång/försök, identitet, dubbletter och aktiv deadline där timer används.
- Medlemskap och privata delar har separata läsregler. Kontroll/ledigplatsinfo och publicerad shown-flagga kan läsas av autentiserad klient med rumskoden för anslutningsflödet; detta är inte en garanti att all rumskontroll är läsbar enbart för medlemmar. Privat frågebibliotek och arkiv är ägarbegränsade.
- Valideringar finns för bland annat kod, medlemskap, fält, tid och poäng. Tolv platsnycklar finns enligt nuvarande provschema. Värden är betrodd poängadministratör; inget skydd mot avsiktlig manipulation av värden utlovas. Alla ägarprivata arkivfält är inte storleksbegränsade av reglerna.

## Verifierad utgångspunkt

Artifact från run [42126629347](https://github.com/BadBagel47/buzzy/actions/runs/42126629347) har SHA256 `8dcb08840d9716c39882b2c1d4a81b97f2634942e871962d3aab3a04d523ea66`, vilket matchar GitHubs publicerade digest. Rapporten har inga API-fel: rätt projekt/nummer ACTIVE, Anonymous på, rätt EU-databas ACTIVE, Hosting-site och Hosting API tillgängliga, inga tidigare live-releaser eller pilot returnerade. `billingEnabled:false` och `billingAccountLinked:false` bekräftar ingen aktiverad/länkad fakturering vid kontrollen. Det är ingen kapacitets-/gratisgaranti för framtida användning.

Nuvarande regler är en operatörsbekräftad konsolkopia, inte en oberoende regel-API-läsning (`rulesApiVerified:false`). Artifactets kopia matchar den sparade [före-pilot-backupen](../ops/rules-evidence/before-pilot.rules.json). Formatering från chattkopian är normaliserad, behörigheterna är exakt `.read:false`/`.write:false`. Detta bevisar inte att databasen saknar lagrade data.

## Exakta filer

| Fil | SHA256 |
|---|---|
| Före-pilot, kanonisk JSON | `015b3c9522d817bcb4544d5df22b987b57dd6aa615028779c68cd0c6903428ab` |
| Föreslagna spelregler, kanonisk JSON | `148f20561cfda93c8177442caa1fd07b0b06ff5fb67f79c2b448f1b23fb7ad9a` |
| Föreslagen fil, exakta bytes | `31f2cb1e3149a01bada6ef4fa8547dc51845126b22adf0aa79434a848c100498` |

Artifactets föreslagna fil är byte-identisk med arbetsrepots och den oförändrade #288-regelfilen. Tidigare lokal emulatorintegration passerade 27 testposter inklusive föräldrar och provade bland annat privata läsningar, direkta nekade SDK-skrivningar, First/Timed, deadline, poäng, Retry och platsgräns. Detta är tidigare evidens för exakt samma regler; sviten är inte nykörd under denna dokumentgranskning och visar inte en verklig mobilpilot. Den senaste operativa sviten har 20 passerade testposter för bland annat manuellt/API-evidensläge och publiceringsspärrar.

## Beslut och återgång

Användarens uttryckliga beslut och efterföljande publicering är registrerade. GitHub-flödet skriver fortfarande inga databasregler. Backupen återställs genom att publicera hela before-pilot.rules.json i samma Rules-editor; det stänger klientåtkomsten igen utan att radera data.

Den nya aktuella konsolkopian har jämförts och snapshot/hash/proveniens är uppdaterade. Före-pilot-backupen är kvar. Hosting-konto/pilotmiljö och separat konkret pilotbeslut återstår; den nya läsande metadata-/evidenskontrollen görs av pilotens förkontroll före uppladdning. Huvudkanalen publiceras inte av denna ändring.
