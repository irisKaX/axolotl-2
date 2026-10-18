# Ověření a stav publikace

Zdroj aplikace: b9bfb20f7a4baa6142d5491c8151c56397d4b6aa. Přidané důkazy nemění kód ani otestovaný build.

Build, TypeScript, šest testů headeru a všech 12 skupin browser kontrol prošly lokálně i v GitHub Actions. Čtyři kombinace výchozího dark/light a desktop/mobile mají nula nálezů axe. Screenshoty zde jsou z lokálního běhu; všech šest CI screenshotů a CI výsledky jsou v artefaktu.

- [Desktop](screenshots/dark-1366.png)
- [Mobil](screenshots/dark-390.png)
- [Lokální výsledky](local-results.json)
- [CI výsledky](ci-results.json)
- [Kompletní CI evidence včetně light screenshotů](https://github.com/irisKaX/axolotl-preview/actions/runs/39154890441/artifacts/12146523152)
- [Otestovaný Pages artefakt](https://github.com/irisKaX/axolotl-preview/actions/runs/39154890441/artifacts/12146438533)

Softwarový SwiftShader: lokálně přibližně 4 FPS desktop / 13.4 FPS mobilní viewport; CI 3.4 / 10.7 FPS. Toto není měření fyzického Macu nebo iPhonu. Efekt vyžaduje hardwarové ověření; statický fallback odpojí WebGL. Podrobná omezení jsou v README.md.

## Publikace čeká na oprávnění

GitHub odmítl deploy job před spuštěním runneru: `Branch "preview/dark-veil-lab-20261018" is not allowed to deploy to github-pages due to environment protection rules.`

Ochrany ani oprávnění se neměnily. Veřejná adresa dark-veil-lab zatím není publikovaná. Pro dokončení musí vlastník povolit pouze tuto větev v repozitáři irisKaX/axolotl-preview, Settings → Environments → github-pages → Deployment branches and tags. Poté lze znovu spustit pouze deploy job běhu 39154890441; před opakováním je nutné ověřit, že mezitím nebylo publikováno jiné preview.

Kontrola hashů sestaveného artefaktu potvrzuje zachování všech 273 dosavadních preview souborů. Main, produkční aplikace, katalog a produkční oprávnění zůstaly nedotčené.
