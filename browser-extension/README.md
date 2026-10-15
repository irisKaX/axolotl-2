# Axolotl · nástroje prohlížeče

Doprovodné rozšíření pro Chrome a Edge (verze 1.1.0) propojuje webový Axolotl s kartami v témže okně. Přenáší původní sběr PDF, snímání stránky a prvků, hledání na webu, stahování obrázků i kontroly metadat, nadpisů, strukturovaných dat a obrázků. QR a konvertor obrázků pracují přímo v aplikaci.

## Instalace a aktualizace

1. [Stáhni ZIP](https://iriskax.github.io/axolotl-2/downloads/axolotl-prohlizec.zip) a rozbal jej do složky, kterou si ponecháš.
2. Otevři `chrome://extensions` nebo `edge://extensions` a zapni **Režim pro vývojáře**.
3. Zvol **Načíst rozbalené** a vyber složku s `manifest.json`. Při aktualizaci nahraď obsah původní složky a klikni u rozšíření na **Obnovit**.
4. Obnov [Axolotl](https://iriskax.github.io/axolotl-2/) a vyber webovou kartu v URL řádku.

Je potřeba Chrome/Chromium 121 nebo novější. Původní rozšíření 1.0.0 umělo pouze seznam karet; pro nástroje je nutná aktualizace.

**Aktuální karta** vybírá poslední aktivní webovou stránku ve stejném okně. Výběrem konkrétní karty zůstane URL navázaná na ni. Přechod na jinou URL nebo obnovení cílové stránky zruší rozběhnutou práci. Při snímání se prohlížeč přepne na zdrojovou kartu a po dokončení se vrátí do aplikace. Během snímání karty nepřepínej.

## Oprávnění a přístup

- `tabs` poskytuje názvy, URL a aktivaci karet.
- `scripting` spouští původní sběrače výsledků a dočasné ovládání výběru a snímání.
- `downloads` ukládá vzdálené PDF a potvrzuje skutečné dokončení nebo přerušení stažení.
- `storage` drží krátkodobé relace a zámky snímání; neukládá je trvale.
- `<all_urls>` je potřebné pro snímání viditelné karty a načtení obsahu různých webů. Povolené operace přesto přijímají pouze běžné HTTP/HTTPS karty ve stejném okně, mimo anonymní režim a mimo Axolotl.

Požadavky přijímá pouze hlavní rám aplikace na přesné cestě `https://iriskax.github.io/axolotl-2/` (také varianta bez posledního lomítka). Výsledky a události patří konkrétní kartě a dokumentu aplikace. Zavření nebo navigace cíle ukončí kontroly, síťové načítání i snímání.

Veřejné síťové požadavky neposílají přihlašovací údaje. Hledání může po rozpoznané odpovědi přihlášení jednou zopakovat původní adresu s existující relací prohlížeče; takový požadavek nesmí následovat přesměrování. Původní ověřování PDF zachovává stejnou ochranu. Rozšíření nečte hodnoty cookies a nepředává je aplikaci. Obrazové soubory mají limit 25 MiB, text 4 MiB a mapy webu 10 MiB; metadata obrázků načítají nejvýše 64 KiB. Požadavky mají časový limit a lze je zrušit.

Lokální exporty QR, snímků, konvertoru a ZIPů ukládá webová aplikace přes standardní dialog prohlížeče. Jejich dokončení nemůže webová stránka potvrdit stejným způsobem jako vzdálené PDF.
