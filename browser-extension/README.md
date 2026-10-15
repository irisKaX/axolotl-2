# Axolotl · propojení karet

Malé doprovodné rozšíření pro Chrome a Edge. Propojí URL řádek v Axolotlu se skutečnými webovými kartami ve stejném okně prohlížeče.

## Instalace

1. [Stáhni rozšíření ZIP](https://iriskax.github.io/axolotl-2/downloads/axolotl-prohlizec.zip) a rozbal ho do složky, kterou si ponecháš.
2. V Chrome otevři `chrome://extensions`, v Edge `edge://extensions`.
3. Zapni **Režim pro vývojáře** a zvol **Načíst rozbalené**.
4. Vyber rozbalenou složku obsahující `manifest.json`.
5. Obnov [Axolotl](https://iriskax.github.io/axolotl-2/). Vedle URL najeď na ikonu karet a klikni na požadovanou stránku.

**Aktuální karta** automaticky používá poslední aktivní webovou stránku v témže okně. Výběrem konkrétní karty zůstane URL navázaná na ni, i když přejdeš jinam. Aktualizuje se i po navigaci vybrané karty. Po zavření vybrané karty se obnoví automatický výběr.

Výběr mění pracovní URL v Axolotlu; nepřepíná samotný prohlížeč na jinou kartu. Zadáním vlastní URL přejdeš do ručního režimu. Enter adresu uloží, Escape vrátí předchozí hodnotu. Ručně zadaná adresa zůstává zachovaná při obnovení aplikace v dané relaci.

## Oprávnění

Rozšíření používá oprávnění `tabs` pro názvy a adresy karet. Do Axolotlu předává jen běžné HTTP/HTTPS stránky ze stejného okna. Vynechá interní stránky prohlížeče, anonymní karty i samotný Axolotl. Nečte obsah stránek, nemění je a nic neposílá na server. Komunikační skript běží pouze na `https://iriskax.github.io/axolotl-2/`.

Zdrojový kód je v této složce. Rozšíření vyžaduje Chrome/Chromium 121 nebo novější. Po aktualizaci rozšíření jej znovu načti na stránce rozšíření a obnov Axolotl.
