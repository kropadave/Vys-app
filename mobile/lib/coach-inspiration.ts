// Trenérská znalostní báze — první pomoc, metodika učení a levelování v parkouru.

export type InspirationCategoryKey = 'first-aid' | 'methodology' | 'leveling';

export type InspirationItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags?: string[];
};

export type InspirationCategory = {
  key: InspirationCategoryKey;
  title: string;
  subtitle: string;
  icon: string; // Feather icon name
  accent: string; // Brand color
  intro?: string;
  sourceNote?: string;
  items: InspirationItem[];
};

export const inspirationCategories: InspirationCategory[] = [
  {
    key: 'first-aid',
    title: 'První pomoc',
    subtitle: 'Základní postupy pro trenéry',
    icon: 'plus-square',
    accent: '#F0445B',
    intro: 'Obsah je zpracován v souladu s ERC Guidelines 2025 (European Resuscitation Council), doporučeními ILCOR 2025 a aktuálním konsensem AHA/ERC pro laické poskytovatele první pomoci. Postupy jsou přizpůsobeny kontextu dětského sportovního tréninku (parkour, freerunning, gymnastika).',
    sourceNote: 'Zdroje obsahu první pomoci: ERC Guidelines 2025 First Aid (Djärv et al., Resuscitation 2025), ILCOR CoSTR 2025, AHA/AAP 2025 Choking Guidelines, PEACE & LOVE protokol (Dubois & Esculier, BJSM 2020)',
    items: [
      {
        id: 'fa-general',
        title: 'Obecné zásady',
        summary: 'Zachovejte klid, jednejte rychle a s rozvahou.',
        tags: ['Základ', 'ABCDE'],
        content: `- Zachovejte klid, jednejte rychle a s rozvahou.
- Nejprve vždy zajistěte bezpečnost prostředí — pro zraněného i ostatní děti.
- Pokud si nejste jisti stavem dítěte, volejte 155 / 112. Ideálně na hlasitý reproduktor, abyste mohli pomáhat současně.
- Nikdy nepodceňujte ani zdánlivě lehké příznaky.
- Používejte jen vybavení a postupy, ve kterých jste proškoleni.
- Přistupujte k postiženému strukturovaně: ABCDE (A – dýchací cesty, B – dýchání, C – oběh, D – vědomí, E – celkový stav).
- Mějte na tréninku vždy lékárničku s: jednorázovými rukavicemi, sterilním krytím, elastickým obinadlem, náplastmi, fyziologickým roztokem, chladícím sáčkem, nůžkami.`,
      },
      {
        id: 'fa-concussion',
        title: 'Otřes mozku (úder do hlavy)',
        summary: 'Příznaky: bolest hlavy, zmatenost, závratě, nevolnost, ztráta paměti, spavost, citlivost na světlo nebo hluk, změny chování, nerovnoměrné zorničky.',
        tags: ['Hlava', '155'],
        content: `Příznaky: bolest hlavy, zmatenost, závratě, nevolnost, ztráta paměti, spavost, citlivost na světlo nebo hluk, změny chování, nerovnoměrné zorničky.

Postup:
1. Okamžitě přerušte aktivitu a vyřaďte dítě z tréninku.
2. Uložte dítě do klidové polohy, kontrolujte vědomí.
3. Sledujte příznaky — zeptejte se na jméno, co dnes dělali, jak se cítí.
4. Nechte dítě pod dohledem dospělé osoby po celou dobu.
5. Vždy kontaktujte rodiče. Doporučte lékařské vyšetření (ideálně do 72 hodin).
6. Dítě se NESMÍ vrátit do tréninku ten samý den. Návrat ke sportu pouze postupně a se souhlasem lékaře.

Červené příznaky — VOLEJTE IHNED 155:
- Ztráta vědomí (i krátká)
- Opakované zvracení
- Záchvaty / křeče
- Silná nebo zhoršující se bolest hlavy
- Výtok z nosu nebo uší (čirá tekutina nebo krev)
- Zhoršující se zmatenost nebo chování

Poznámka: Dřívější rada „nedávejte dítěti spát po úderu do hlavy" je překonaná. Podle aktuálních doporučení (ERC 2025) spánek není škodlivý, ale dítě by mělo být pravidelně kontrolováno (každé 2–3 hodiny v prvních 24 hodinách).`,
      },
      {
        id: 'fa-spine',
        title: 'Poranění páteře',
        summary: 'Příznaky: bolest v zádech nebo krku, necitlivost, slabost či brnění v končetinách, potíže s pohybem.',
        tags: ['Páteř', '155'],
        content: `Příznaky: bolest v zádech nebo krku, necitlivost, slabost či brnění v končetinách, potíže s pohybem.

Postup:
1. Nehýbejte se zraněným, pokud to není nezbytně nutné (např. ohrožení dalším nebezpečím).
2. Stabilizujte hlavu a krk v poloze, v jaké se nacházejí — držte oběma rukama, zabraňte jakémukoli pohybu.
3. Okamžitě volejte 155 / 112.
4. Pokud dítě nedýchá a leží na břiše, velmi opatrně otočte na záda technikou „log roll" (celé tělo najednou, bez rotace páteře) a zahajte KPR.
5. Udržujte dítě v klidu, průběžně kontrolujte dýchání a vědomí.
6. Kontaktujte rodiče.

Poznámka dle ERC 2025: Omezení pohybu krční páteře (cervical spinal motion restriction) by měli provádět zejména vyškolení záchranáři. Laik by měl především zabránit jakémukoli zbytečnému pohybu a zajistit stabilizaci do příjezdu záchranky.`,
      },
      {
        id: 'fa-fracture',
        title: 'Zlomenina',
        summary: 'Příznaky: silná bolest, otok, deformace, neschopnost končetinu používat, případně nepřirozená poloha.',
        tags: ['Končetina', '155'],
        content: `Příznaky: silná bolest, otok, deformace, neschopnost končetinu používat, případně nepřirozená poloha.

Postup:
1. Končetinou nehýbejte — nechte ji v poloze, ve které je.
2. Imobilizujte dlahou nebo improvizovaně (pevně srolované noviny, prkno, fixace ke zdravé končetině). Znehybněte kloub nad i pod místem zlomeniny.
3. Přiložte led (přes látku) na max. 15–20 minut — nikdy přímo na kůži.
4. Při otevřené zlomenině (kost proniká kůží) překryjte ránu sterilním krytím. NEPOKOUŠEJTE se kost narovnat ani zasouvat zpět.
5. Sledujte prokrvení za místem poranění — barva prstů (blednutí = špatné), teplota, citlivost.
6. Volejte 155. Kontaktujte rodiče.
7. Zaznamenejte čas úrazu a okolnosti pro záchranáře.
8. Uklidňujte dítě — stres a panika bolest subjektivně zhoršují.`,
      },
      {
        id: 'fa-sprain-contusion',
        title: 'Podvrtnutí / naraženina',
        summary: 'Příznaky podvrtnutí: bolest, otok, omezený pohyb, někdy modřina. Příznaky naraženiny: bolest, otok, modřina, pohyblivost omezená, ale zachovaná.',
        tags: ['RICE', 'Chlazení'],
        content: `Příznaky podvrtnutí: bolest, otok, omezený pohyb, někdy modřina. Příznaky naraženiny: bolest, otok, modřina, pohyblivost omezená, ale zachovaná.

Postup:
1. Okamžitě zastavte cvičení a posaďte dítě. Zklidněte ho.
2. Chraňte poraněnou oblast — zabraňte dalšímu pohybu (bandáž, dlaha, nebo podepřete rukou).
3. Zvedněte končetinu nad úroveň srdce — pomáhá snížit otok.
4. Přiložte kompresní obvaz (elastické obinadlo) — pevně, ale ne příliš utaženě. Kontrolujte prsty (barva, teplota, citlivost) — pokud bělají nebo mravenčí, povolte.
5. Chlazení: pokud máte k dispozici led nebo chladící sáček, přiložte přes látku na max. 15–20 minut. Neaplikujte led přímo na kůži.
6. Při silné bolesti, výrazném otoku, deformaci nebo neschopnosti zatížit končetinu kontaktujte rodiče a doporučte lékařské vyšetření.
7. Při naraženině: přiložte led na 15–20 minut, opakujte po hodině. Při přetrvávajících potížích (silná bolest, nemožnost pohybu) doporučte vyšetření.

Poznámka: Klasický RICE protokol (klid, led, komprese, elevace) je stále vhodný pro okamžitou první pomoc na tréninku. Novější doporučení (PEACE & LOVE, 2019/2025) upozorňují, že úplný klid a nadměrné chlazení mohou zpomalovat hojení. V kontextu akutní pomoci na tréninku ale chlazení pro úlevu od bolesti zůstává rozumným krokem. Důležité je neaplikovat led déle než 20 minut a po prvním ošetření předat péči rodičům/lékaři.`,
      },
      {
        id: 'fa-wound-bleeding',
        title: 'Tržná rána / odřenina / krvácení',
        summary: 'Příznaky: viditelná rána, krvácení (mírné až silné), bolest.',
        tags: ['Krvácení', 'Rukavice'],
        content: `Příznaky: viditelná rána, krvácení (mírné až silné), bolest.

Postup:
1. Nasaďte si ochranné rukavice z lékárničky.
2. Vypláchněte ránu čistou vodou nebo fyziologickým roztokem. Nepoužívejte peroxid ani alkohol — dráždí tkáň a zpomaluje hojení.
3. Pokud rána krvácí, stlačte ji přímo sterilním obvazem a držte stálý, pevný tlak po dobu 3–5 minut. Neodtrhávejte obvaz — pokud prosakuje, přidejte další vrstvu.
4. Po zastavení krvácení přelepte náplastí nebo sterilním krytím.
5. Při hluboké ráně, viditelné tukové tkáni či svalu, zaseklém cizím předmětu (NEVYTAHUJTE!) nebo ráně delší než 1 cm — volejte 155.

Masivní / život ohrožující krvácení (dle ERC 2025):
1. Přiložte pevný přímý manuální tlak na krvácející místo.
2. Použijte standardní nebo hemostatický obvaz přímo na ránu, poté na něj zatlačte.
3. Pokud krvácení na končetině neustává, zvažte přiložení zaškrcovadla (turniketu) 5–7 cm nad ránu (ne přes kloub). Zapište čas přiložení.
4. Volejte 155.

Poznámka: U jakékoli otevřené rány ověřte, zda má dítě platné očkování proti tetanu. Vždy informujte rodiče.`,
      },
      {
        id: 'fa-choking',
        title: 'Dušení (cizí těleso v dýchacích cestách)',
        summary: 'Příznaky: neschopnost dýchat nebo mluvit, modré rty, lapání po dechu, kašel (pokud částečná obstrukce).',
        tags: ['Dýchání', '155'],
        content: `Příznaky: neschopnost dýchat nebo mluvit, modré rty, lapání po dechu, kašel (pokud částečná obstrukce).

Postup:
1. Pokud dítě kašle — povzbuzujte ho ke kašli. Kašel je nejúčinnější způsob odstranění tělesa. Nezasahujte, dokud je kašel účinný.
2. Pokud dítě NEMŮŽE kašlat, mluvit ani dýchat — zahajte:
   - U dětí nad 1 rok a dospělých: 5 úderů do zad mezi lopatky (dlaní, dítě mírně předkloněné) → pokud nepomáhá → 5 stlačení nadbřišku (Heimlichův manévr).
   - U kojenců do 1 roku: 5 úderů do zad → 5 stlačení hrudníku (NE břicha — riziko poranění).
3. Střídejte 5 úderů do zad a 5 stlačení, dokud těleso nevyjde nebo dokud dítě neztratí vědomí.
4. Pokud dítě ztratí vědomí — položte na zem, volejte 155/112 a zahajte KPR (začněte kompresemi).
5. I po úspěšném odstranění překážky vždy vyhledejte lékařskou kontrolu (riziko poranění dýchacích cest nebo vnitřních orgánů).`,
      },
      {
        id: 'fa-winded',
        title: 'Vyražený dech',
        summary: 'Příznaky: krátkodobá neschopnost dýchat, bolest v oblasti hrudníku nebo břicha, panika.',
        tags: ['Dýchání'],
        content: `Příznaky: krátkodobá neschopnost dýchat, bolest v oblasti hrudníku nebo břicha, panika.

Postup:
1. Uklidněte dítě — vysvětlete, že se dech vrátí.
2. Instrukujte k pomalému, hlubokému dýchání — nádech nosem, výdech ústy.
3. Nechte ho sedět nebo ležet v pohodlné poloze (mírný předklon často pomáhá).
4. Dech se většinou vrátí do normálu během 1–3 minut.
5. Pokud potíže s dýcháním přetrvávají déle než 5 minut nebo se zhoršují — volejte 155.`,
      },
      {
        id: 'fa-fainting',
        title: 'Mdloba / slabost',
        summary: 'Příznaky: bledost, závratě, pocení, rozmazané vidění, ztráta vědomí.',
        tags: ['Vědomí'],
        content: `Příznaky: bledost, závratě, pocení, rozmazané vidění, ztráta vědomí.

Postup:
1. Položte dítě na záda a zvedněte nohy nad úroveň srdce (podložte batohem, žíněnkou).
2. Uvolněte oblečení kolem krku a pasu, zajistěte přísun čerstvého vzduchu.
3. Pokud je dítě v bezvědomí, ale normálně dýchá — uložte do stabilizované polohy na boku (recovery position dle ERC 2025).
4. Pokud NEDÝCHÁ normálně — zahajte resuscitaci: u dětí 5 úvodních vdechů, poté poměr 15:2 (komprese:vdechy). Volejte 155.
5. Po probuzení nabídněte vodu po malých doušcích.
6. Před návratem do tréninku počkejte alespoň 30 minut a sledujte stav.
7. Při opakovaných mdlobách doporučte rodičům lékařské vyšetření.`,
      },
      {
        id: 'fa-asthma',
        title: 'Astmatický záchvat',
        summary: 'Příznaky: obtížné dýchání, pískání při výdechu, kašel, nemožnost mluvit celou větu, úzkost.',
        tags: ['Dýchání', 'Léky'],
        content: `Příznaky: obtížné dýchání, pískání při výdechu, kašel, nemožnost mluvit celou větu, úzkost.

Postup:
1. Posaďte dítě vzpřímeně — mírný předklon, ruce opřené o kolena.
2. Zklidněte dítě — stres zhoršuje dýchací obtíže.
3. Pokud má dítě svůj úlevový inhalátor (typicky salbutamol), pomozte mu ho použít.
4. Pokud se stav nezlepší do 5 minut nebo se zhoršuje (nemůže mluvit celou větu, modré rty, vtahování mezižeberních prostorů) — volejte 155.
5. Před tréninkem vždy zjistěte od rodičů, zda má dítě astma a kde je jeho inhalátor.`,
      },
      {
        id: 'fa-anaphylaxis',
        title: 'Alergická reakce / anafylaxe',
        summary: 'Příznaky: kopřivka, otok obličeje/rtů/jazyka, obtížné dýchání, svírání v krku, závratě, rychlý pokles tlaku.',
        tags: ['Alergie', '155'],
        content: `Příznaky: kopřivka, otok obličeje/rtů/jazyka, obtížné dýchání, svírání v krku, závratě, rychlý pokles tlaku.

Postup:
1. Pokud má dítě předepsaný adrenalinový autoinjektor (EpiPen / Jext), pomozte mu ho aplikovat do vnější strany stehna (i přes oblečení).
2. Volejte 155.
3. Položte dítě na záda se zvednutými nohami. Pokud zvrací nebo má obtížné dýchání, posaďte ho.
4. Kontaktujte rodiče.
5. Před každou sezonou zjistěte od rodičů alergie dětí a kde mají léky.`,
      },
      {
        id: 'fa-nosebleed',
        title: 'Krvácení z nosu',
        summary: 'Posaďte dítě a mírně mu nakloňte hlavu DOPŘEDU.',
        tags: ['Krvácení'],
        content: `Postup:
1. Posaďte dítě a mírně mu nakloňte hlavu DOPŘEDU (NE dozadu — krev by tekla do žaludku a dítě by mohlo zvracet).
2. Stiskněte měkkou část nosu (pod kostěným hřbetem) a držte 10–15 minut bez přerušení.
3. Dítě ať dýchá ústy.
4. Po zastavení krvácení: 2 hodiny se nesmí smrkat, vyhýbat se fyzické námaze.
5. Pokud krvácení neustává po 20 minutách — volejte 155.`,
      },
      {
        id: 'fa-heatstroke',
        title: 'Tepelný úpal / přehřátí',
        summary: 'Příznaky: horká a suchá kůže, zmatenost, bolest hlavy, nevolnost, teplota nad 40 °C.',
        tags: ['Horko', '155'],
        content: `Příznaky: horká a suchá kůže, zmatenost, bolest hlavy, nevolnost, teplota nad 40 °C.

Postup:
1. Přesuňte dítě do stínu nebo chladné místnosti.
2. Svlékněte přebytečné oblečení.
3. Aktivně chlaďte — mokré hadry na krk, čelo, podpaží, třísla. Pokud je k dispozici ventilátor, použijte ho.
4. Dejte pít chladnou (ne ledovou) vodu po malých doušcích.
5. Pokud se objeví zmatenost, zvracení, ztráta vědomí nebo teplota nad 40 °C — volejte 155. Jde o život ohrožující stav.`,
      },
      {
        id: 'fa-kit-checklist',
        title: 'Kontrolní seznam lékárničky pro trenéra',
        summary: 'Před každým tréninkem zkontrolujte, zda máte vše potřebné.',
        tags: ['Lékárnička'],
        content: `Před každým tréninkem zkontrolujte, zda máte:
- Jednorázové rukavice (min. 4 páry)
- Sterilní obvazy a krytí (různé velikosti)
- Elastické obinadlo
- Náplasti (různé velikosti)
- Fyziologický roztok (výplach ran)
- Chladící sáček (instant)
- Nůžky
- Záchranná (izotermická) fólie
- Resuscitační rouška
- Kontakty na rodiče a seznam alergií/zdravotních omezení dětí`,
      },
    ],
  },
  {
    key: 'methodology',
    title: 'Metodika učení',
    subtitle: 'Jak správně učit nové pohyby',
    icon: 'book-open',
    accent: '#8B1DFF',
    items: [
      {
        id: 'me-progressive-learning',
        title: 'Princip progresivního učení',
        summary: 'Vždy začněte s nejjednodušší variantou triku (precision na zemi → nízká překážka → vyšší).',
        content: `1. Vždy začněte s nejjednodušší variantou triku (precision na zemi → nízká překážka → vyšší).
2. Dítě musí zvládnout pohyb 5× za sebou bez chyby, než postoupí na vyšší úroveň.
3. Při strachu se vraťte o krok zpět a zopakujte. Strach je přirozená ochrana, ne slabost.
4. Nikdy netlačte na výšku/obtížnost — riziko zranění výrazně převyšuje přínos.
5. Držte se pravidla: nejdřív kontrola, pak rychlost, pak styl.`,
      },
      {
        id: 'me-spotting',
        title: 'Dopomoc (spotting)',
        summary: 'Stůjte vždy v zóně dopadu, ne v zóně rozjezdu.',
        content: `1. Stůjte vždy v zóně dopadu, ne v zóně rozjezdu.
2. Držte ruku v úrovni boků dítěte — tam je jeho těžiště.
3. Při saltu zezadu jistěte za záda a kyčle, při saltu dopředu za ramena a břicho.
4. Vysvětlete dítěti, kde vaše ruka bude — musí vám věřit. Řekněte: „Budu tě držet tady, dokud neřeknu jinak."
5. Postupně dopomoc snižujte, ale neoznamujte to předem, dokud nemáte jistotu, že zvládne samo.
6. Nikdy nestahujte dopomoc náhle — plynulé snižování buduje důvěru.`,
      },
      {
        id: 'me-feedback',
        title: 'Konstruktivní zpětná vazba',
        summary: 'Začněte vždy pozitivem — co se povedlo („Super, že ses rozhodl skočit!").',
        content: `1. Začněte vždy pozitivem — co se povedlo („Super, že ses rozhodl skočit!").
2. Konkrétně řekněte, co zlepšit („Ruce jsi dal moc dopředu — příště je drž u těla").
3. Ukažte nebo předveďte správné provedení — vizuální ukázka funguje lépe než slova.
4. Nechte dítě zkusit znovu okamžitě, dokud má motivaci. Po 3 pokusech bez zlepšení udělejte pauzu.
5. Vyhněte se srovnávání s ostatními dětmi — srovnávejte jen s jeho vlastním minulým výkonem.`,
      },
      {
        id: 'me-fear',
        title: 'Práce se strachem',
        summary: 'Nikdy se dítěti nesmějte a nezesměšňujte ho před skupinou. Strach je normální a má své místo.',
        content: `1. Nikdy se dítěti nesmějte a nezesměšňujte ho před skupinou. Strach je normální a má své místo.
2. Rozložte trik na menší kroky, aby dítě cítilo postupný úspěch.
3. Použijte měkké podložky, žíněnky, snížené překážky — fyzická bezpečnost snižuje psychický strach.
4. Nechte dítě rozhodnout, kdy je připraveno — nikdy netlačte. Nabídněte: „Chceš to zkusit, nebo ještě jednou nácvik?"
5. Pochvalte každý pokus, i neúspěšný — důležitá je odvaha, ne výsledek.
6. Pokud dítě opakovaně odmítá, respektujte to a nabídněte alternativu.`,
      },
      {
        id: 'me-group',
        title: 'Vedení skupiny 8–12 dětí',
        summary: 'Na začátku jasně řekněte pravidla a co dnes budete dělat (max. 2 minuty).',
        content: `1. Na začátku jasně řekněte pravidla a co dnes budete dělat (max. 2 minuty).
2. Rozdělte skupinu do stanic s rotací po 5–7 minutách.
3. Vždy mějte přehled o všech dětech — nikdy nestůjte zády k žádné skupině.
4. Nejaktivnější dítě postavte vedle nejméně aktivního — přirozeně si pomáhají.
5. Využijte „mentory" — šikovnější děti mohou ukazovat pohyb mladším (buduje to jejich sebevědomí).
6. Závěr lekce vždy reflexí: co se naučili, co se povedlo, na co se těší příště.
7. Buďte konzistentní v pravidlech — co platí první trénink, platí vždy.`,
      },
    ],
  },
  {
    key: 'leveling',
    title: 'Levelování v parkouru',
    subtitle: 'Systematický postup od základů po kombinace',
    icon: 'trending-up',
    accent: '#14C8FF',
    intro: 'Levelování představuje systematický způsob, jak vést trénink od jednoduchých dovedností až po komplexní a náročné kombinace. Pomáhá sportovcům i trenérům sledovat progres, motivuje k postupnému zlepšování a zároveň podporuje bezpečnost.',
    items: [
      {
        id: 'lv-overall',
        title: '1. Celková úroveň',
        summary: 'Zahrnuje dlouhodobý rozvoj dovedností a fyzických schopností praktikanta.',
        content: `Zahrnuje dlouhodobý rozvoj dovedností a fyzických schopností praktikanta. Cílem je celkové zlepšení kondice, síly, vytrvalosti, techniky a sebevědomí.

Příklady:
- Začátečník → základní pohyby (roll, vault, precision jump)
- Pokročilý → složitější techniky (kong vault, cat leap, wall run)
- Expert → plynulé kombinace pohybů ve vysoké rychlosti, dlouhé a přesné skoky, akrobatické prvky`,
      },
      {
        id: 'lv-exercise',
        title: '2. Konkrétní cvičení',
        summary: 'Zaměřuje se na detailní zlepšování techniky v rámci jednoho pohybu.',
        content: `Zaměřuje se na detailní zlepšování techniky v rámci jednoho pohybu. Praktikant se učí ladit provedení a postupně zvyšovat obtížnost.

Příklady:
- Precision jump → prodlužování vzdálenosti skoku
- Vault → od jednoduchého (speed vault) po složitější (double kong vault)
- Wall run → postupné zvyšování dosažené výšky`,
      },
      {
        id: 'lv-situation',
        title: '3. Změna situace',
        summary: 'Schopnost adaptovat se na různé prostředí, podmínky a typy překážek.',
        content: `Schopnost adaptovat se na různé prostředí, podmínky a typy překážek. Klíčový krok k reálnému použití parkouru mimo tréninkovou halu.

Příklady:
- Skoky na různých površích (beton, tráva, písek)
- Překážky v různých výškách (nízká zídka vs. vysoká zeď)
- Trénink za odlišných podmínek (mokro, sucho, různé roční období)`,
      },
      {
        id: 'lv-variations',
        title: '4. Variace a kombinace',
        summary: 'Vyšší stupeň dovedností — propojení více technik do plynulých sekvencí.',
        content: `Vyšší stupeň dovedností — propojení více technik do plynulých sekvencí. Zvyšuje komplexnost, koordinaci a kreativitu.

Příklady:
- Kong vault → navazuje precision jump
- Wall run → přechod do cat leap na druhou stěnu
- Série různých vaultů v rychlém sledu`,
      },
      {
        id: 'lv-principles',
        title: '5. Obecné principy',
        summary: 'Parkour není jen o technice, ale i o filozofii tréninku a přístupu k překonávání překážek.',
        content: `Parkour není jen o technice, ale i o filozofii tréninku a přístupu k překonávání překážek.

Klíčové zásady:
- Postupná progrese → zvyšování obtížnosti krok za krokem, bezpečný rozvoj bez zbytečných zranění
- Efektivita pohybu → plynulost, minimalizace zbytečných pohybů a spotřeby energie
- Kreativita → hledání nových cest, kombinací a způsobů, jak se pohybovat`,
      },
      {
        id: 'lv-mario',
        title: '6. Herní princip „MARIO"',
        summary: 'Metoda, která využívá princip levelů známých z her.',
        content: `Metoda, která využívá princip levelů známých z her.
- Cvičenci plní úkoly na jednotlivých stanovištích („levelech") — od nejjednodušších po nejtěžší.
- Každý level se opakuje, dokud trenér nerozhodne, že praktikant může postoupit výš.
- Skvěle funguje zejména pro děti 6–12 let, protože je hravá, motivační a zároveň umožňuje postupnou a bezpečnou progresi.`,
      },
    ],
  },
];
