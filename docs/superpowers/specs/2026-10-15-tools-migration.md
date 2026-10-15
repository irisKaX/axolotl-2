# Přenos nástrojů do Axolotlu 2.0

Požadavek: převést všech deset nástrojů z O2 Axolotl 2.4.22, přizpůsobit je současnému designu a office nepřenášet. Uživatelka výslovně zadala provedení migrace; navazujeme na schválený design systému a nasazování přes GitHub.

## Chování
Stávající adresy v menu otevřou skutečné nástroje. QR a konvertor fungují lokálně i bez rozšíření. Kontroly webu, screenshot, PDF a stahování obrázků používají cílovou kartu z hlavičky a aktualizované doprovodné rozšíření. Chybějící připojení se zobrazí s návodem, nikoli s falešnými výsledky. Výsledky a nastavení přežijí přepnutí nástroje; změna cílové stránky zruší rozběhnuté kontroly a zneplatní jejich výsledky. Lokální QR a soubory konvertoru zůstanou zachované.

## Struktura
Původní nástroje a jejich modely v src/tools/legacy zachovají kontroléry, výpočty, exporty, filtry, rušení a limity. Nový host propojí jejich lifecycle s React aplikací a PageContextProvider. Sdílené formuláře, panely, dialogy a výsledky budou používat aktuální tokeny, zaoblení a barvy. Nepřenášíme původní header, office, mesh pozadí, podstavce ani maskoty.

Rozšíření přijímá pouze přesně určené operace od hlavního rámu této aplikace. Zpracování cílové stránky běží v rozšíření s kontrolou relace a cílové karty. Původní privilegované síťové funkce nejsou vystavené jako libovolné Chrome API. Podporujeme průběh, zrušení, screenshot události a kontrolu dokončení vzdálených stahování. Lokální webové exporty používají prohlížečové uložení a netvrdí ověřené dokončení, pokud je prohlížeč nedokáže doložit.

## Vzhled a ověření
Header, logo, pozadí, menu a prázdná plocha office zůstávají. Nástroje používají monochromatické ikony a aktuální plochy v dark/light. Dlouhé výsledky nástrojů mohou scrollovat; požadavek dashboardu bez scrollu zůstává. Ověříme routování všech deseti nástrojů, zachování stavu, přerušení, webové exporty, zabezpečení bridge, původní modelové testy, produkční build a viditelný dark/light výsledek. Skutečné privilegované operace vyžadují instalaci aktualizovaného ZIPu v prohlížeči uživatelky.
