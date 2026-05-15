// Inspirace pro trenéry parkouru — první pomoc, metodika, harmonogram, hry.

export type InspirationCategoryKey = 'first-aid' | 'methodology' | 'curriculum' | 'warmup-games';

export type InspirationItem = {
  id: string;
  title: string;
  summary: string;
  steps?: string[];
  tags?: string[];
};

export type InspirationCategory = {
  key: InspirationCategoryKey;
  title: string;
  subtitle: string;
  icon: string; // Feather icon name
  accent: string; // Brand color
  items: InspirationItem[];
};

export const inspirationCategories: InspirationCategory[] = [
  {
    key: 'first-aid',
    title: 'První pomoc',
    subtitle: 'Postupy pro nejčastější situace na tréninku',
    icon: 'plus-square',
    accent: '#F0445B',
    items: [
      {
        id: 'fa-twist',
        title: 'Podvrtnutí kotníku / zápěstí',
        summary: 'Klasické zranění při doskocích a precision skocích.',
        steps: [
          'Okamžitě zastav cvičení a posaď dítě.',
          'Zvedni končetinu nad úroveň srdce.',
          'Přilož led (nikdy přímo na kůži – přes látku) na 15 minut.',
          'Pevně, ale ne škrtivě obvaž elastickým obinadlem.',
          'Při silné bolesti, otoku nebo deformaci kontaktuj rodiče a doporuč lékaře.',
        ],
        tags: ['Akutní', 'RICE'],
      },
      {
        id: 'fa-cut',
        title: 'Tržná rána / odřenina',
        summary: 'Po pádu na betonové překážce.',
        steps: [
          'Nasaď si rukavice z lékárničky.',
          'Vypláchni ránu fyziologickým roztokem nebo čistou vodou.',
          'Stlač sterilním obvazem dokud krvácení neustane (3–5 minut).',
          'Přelep náplastí nebo sterilním krytím.',
          'Při hluboké ráně nebo zaseklém objektu ránu nevytahuj a volej 155.',
        ],
        tags: ['Krvácení'],
      },
      {
        id: 'fa-head',
        title: 'Úder do hlavy',
        summary: 'Pád z výšky nebo náraz při saltu.',
        steps: [
          'Zachovej klid, dítě posaď nebo polož.',
          'Sleduj vědomí, zorničky a chování po dobu 15 minut.',
          'Při zvracení, ospalosti, dezorientaci nebo nerovnoměrných zorničkách volej 155.',
          'I při lehkém úrazu vždy informuj rodiče a doporuč 24h klid.',
          'Nikdy nedej dítěti spát hned po nárazu – počkej minimálně 1 hodinu.',
        ],
        tags: ['VÁŽNÉ', 'Sledování'],
      },
      {
        id: 'fa-fracture',
        title: 'Podezření na zlomeninu',
        summary: 'Slyšitelný praskot, deformace nebo neschopnost pohybu.',
        steps: [
          'Nehýbej s končetinou ani s dítětem.',
          'Imobilizuj končetinu v poloze, ve které je.',
          'Volej 155 a kontaktuj rodiče.',
          'Sleduj prokrvení (barva prstů, teplota).',
          'Dokumentuj čas úrazu a okolnosti pro záchranáře.',
        ],
        tags: ['VÁŽNÉ', '155'],
      },
      {
        id: 'fa-faint',
        title: 'Mdloba / slabost',
        summary: 'Často po intenzivním cvičení nebo v horku.',
        steps: [
          'Polož dítě na záda a zvedni nohy nad úroveň srdce.',
          'Uvolni oblečení, zajisti přívod vzduchu.',
          'Po probuzení nabídni vodu a něco sladkého.',
          'Před návratem do tréninku počkej alespoň 30 minut.',
          'Při opakovaných mdlobách doporuč rodičům lékařské vyšetření.',
        ],
        tags: ['Akutní'],
      },
    ],
  },
  {
    key: 'methodology',
    title: 'Metodika učení',
    subtitle: 'Jak správně učit nové pohyby a triky',
    icon: 'book-open',
    accent: '#8B1DFF',
    items: [
      {
        id: 'me-progression',
        title: 'Princip progresivního učení',
        summary: 'Od jednoduchého ke složitému – nikdy nepřeskakuj kroky.',
        steps: [
          'Vždy začni s nejjednodušší variantou triku (např. precision na zemi → na nízké překážce → na vyšší).',
          'Dítě musí zvládnout 5× za sebou bez chyby, než postoupí dál.',
          'Při strachu se vrať o krok zpět a zopakuj.',
          'Nikdy netlač na výšku/obtížnost – risk zranění je vyšší než přínos.',
        ],
      },
      {
        id: 'me-spotting',
        title: 'Dopomoc (spotting)',
        summary: 'Bezpečné jištění při akrobatických trikách.',
        steps: [
          'Stůj vždy v zóně dopadu, ne v zóně rozjezdu.',
          'Drž ruku v úrovni boků dítěte – tam je jeho těžiště.',
          'Při saltu zezadu jisti za záda a kyčle.',
          'Vysvětli dítěti, kde tvoje ruka bude – musí ti věřit.',
          'Postupně dopomoc snižuj, ale neoznamuj to, dokud nemáš jistotu.',
        ],
      },
      {
        id: 'me-feedback',
        title: 'Konstruktivní zpětná vazba',
        summary: 'Jak chválit a opravovat, aby dítě chtělo pokračovat.',
        steps: [
          'Začni vždy pozitivem ("Super, že jsi se rozhodl skočit!").',
          'Konkrétně řekni, co bylo špatně ("Ruce jsi dal moc dopředu").',
          'Ukaž nebo předveď správné provedení.',
          'Nech dítě zkusit znovu okamžitě, dokud má motivaci.',
          'Vyhni se srovnávání s ostatními dětmi.',
        ],
      },
      {
        id: 'me-fear',
        title: 'Práce se strachem',
        summary: 'Strach je přirozená reakce – nepodceňuj ho.',
        steps: [
          'Nikdy se dítěti nesměj a nezesměšňuj ho před skupinou.',
          'Rozlož trik na menší kroky, aby dítě cítilo postupný úspěch.',
          'Použij měkké podložky, žíněnky, snížené překážky.',
          'Nech dítě rozhodnout, kdy je připraveno – nikdy netlač.',
          'Pochval každý pokus, i neúspěšný.',
        ],
      },
      {
        id: 'me-group',
        title: 'Vedení skupiny 8–12 dětí',
        summary: 'Udržení pozornosti a bezpečnosti najednou.',
        steps: [
          'Na začátku jasně řekni pravidla a co dnes budete dělat.',
          'Rozděl skupinu do stanic (rotace po 5–7 minutách).',
          'Vždy měj přehled o všech dětech – nikdy nestůj zády.',
          'Nejaktivnější dítě postav vedle nejméně aktivního – pomáhá si.',
          'Závěr lekce vždy reflexí: co se naučili, co příště.',
        ],
      },
    ],
  },
  {
    key: 'curriculum',
    title: 'Harmonogram roku',
    subtitle: 'Co učit v kterém měsíci sezóny',
    icon: 'calendar',
    accent: '#14C8FF',
    items: [
      {
        id: 'cu-09',
        title: 'Září – Základy a navyknutí',
        summary: 'První měsíc, hodně nových dětí.',
        steps: [
          'Seznámení s prostorem a pravidly bezpečnosti.',
          'Základní pohyby: kočičí skok, precision skok na zemi.',
          'Hry na koordinaci a rovnováhu.',
          'Zhodnocení úrovně každého dítěte (testovací stanice).',
        ],
      },
      {
        id: 'cu-10',
        title: 'Říjen – Skoky a doskoky',
        summary: 'Bezpečný doskok je základ všeho.',
        steps: [
          'Technika doskoku: kotníky, kolena, kyčle absorbují náraz.',
          'Precision skoky na nízké zídky.',
          'Wall run – běh na zeď s odrazem.',
          'Roll (přemet vpřed přes rameno) na žíněnce.',
        ],
      },
      {
        id: 'cu-11',
        title: 'Listopad – Vault techniky',
        summary: 'Přeskoky přes překážky.',
        steps: [
          'Safety vault (jednou rukou, jednou nohou).',
          'Speed vault (jednou rukou, švih nohama).',
          'Lazy vault (z boku).',
          'Kombinace skoků a vaultů v okruhu.',
        ],
      },
      {
        id: 'cu-12',
        title: 'Prosinec – Síla a výdrž',
        summary: 'Před vánoční pauzou kondiční měsíc.',
        steps: [
          'Klik, dřep, výdrž v podporu (kondiční stanice).',
          'Vis na hrazdě, šplh.',
          'Plyometrie (skoky pro výbušnost).',
          'Zábavné kondiční hry (parkourová štafeta).',
        ],
      },
      {
        id: 'cu-01',
        title: 'Leden – Akrobacie základ',
        summary: 'Přemety, salta s dopomocí.',
        steps: [
          'Přemet stranou (cartwheel).',
          'Roundoff (rondát).',
          'Salto vzad s dopomocí na žíněnce.',
          'Backflip průprava (nácvik na trampolíně).',
        ],
      },
      {
        id: 'cu-02',
        title: 'Únor – Flow a kombinace',
        summary: 'Spojování pohybů do plynulých sekvencí.',
        steps: [
          'Návaznost vault → roll → wall run.',
          'Vlastní krátká sestava (každé dítě 3–5 pohybů).',
          'Video analýza – natočit a zhodnotit.',
          'Příprava na zimní workshop.',
        ],
      },
      {
        id: 'cu-03',
        title: 'Březen – Outdoor adaptace',
        summary: 'Přechod na venkovní spoty.',
        steps: [
          'Bezpečnost na betonu, kovu, mokrém povrchu.',
          'Čtení prostředí – odhad vzdáleností a výšek.',
          'Výjezd na venkovní spot (pod dohledem).',
          'Práce s reálnými překážkami (lavičky, zídky).',
        ],
      },
      {
        id: 'cu-04',
        title: 'Duben – Pokročilé triky',
        summary: 'Pro pokročilé skupiny.',
        steps: [
          'Wallflip, sideflip s dopomocí.',
          'Kong vault, dash vault.',
          'Precision z výšky na výšku.',
          'Příprava závěrečného vystoupení.',
        ],
      },
      {
        id: 'cu-05',
        title: 'Květen / červen – Závěr sezóny',
        summary: 'Předvedení a hodnocení pokroku.',
        steps: [
          'Závěrečné testy na náramky (skill tree).',
          'Týmová sestava pro rodiče.',
          'Předání odměn a certifikátů.',
          'Letní kemp – plánování a propagace.',
        ],
      },
    ],
  },
  {
    key: 'warmup-games',
    title: 'Rozehřívací hry',
    subtitle: 'Nápady na zahájení tréninku (5–10 min)',
    icon: 'zap',
    accent: '#FFB21A',
    items: [
      {
        id: 'wg-tag',
        title: 'Parkour honička',
        summary: 'Klasická honička s parkourovým twistem.',
        steps: [
          'Vyber 1–2 honiče (podle velikosti skupiny).',
          'Pravidlo: utíkat se smí jen po překážkách, ne po zemi.',
          'Dítě, které stoupne na zem, automaticky honí.',
          'Aktivuje obratnost, plánování trasy a flow.',
        ],
        tags: ['5 min', 'Skupina'],
      },
      {
        id: 'wg-mirror',
        title: 'Zrcadlo',
        summary: 'Dvojice – jeden vede, druhý opakuje.',
        steps: [
          'Rozděl skupinu do dvojic.',
          'Jeden dělá libovolné pohyby (skoky, kotouly, vaulty).',
          'Druhý je přesně kopíruje jako zrcadlo.',
          'Po 2 minutách výměna rolí.',
          'Učí pozornost, kontrolu těla, kreativitu.',
        ],
        tags: ['7 min', 'Dvojice'],
      },
      {
        id: 'wg-floor',
        title: 'Podlaha je láva',
        summary: 'Klasika v parkourovém pojetí.',
        steps: [
          'Rozmísti překážky po sále (žíněnky, kostky, lavičky).',
          'Děti se musí dostat z bodu A do bodu B bez doteku podlahy.',
          'Postupně přidávej časové limity nebo specifické pohyby.',
          'Varianta: štafeta dvojic.',
        ],
        tags: ['10 min', 'Skupina'],
      },
      {
        id: 'wg-rps',
        title: 'Kámen-nůžky-papír závod',
        summary: 'Energický rozehřívák s odměnou.',
        steps: [
          'Dvě řady dětí proti sobě, mezi nimi řada překážek.',
          'První dva běží proti sobě po překážkách, kde se potkají hrají KNP.',
          'Vítěz pokračuje, poražený se vrátí, a vybíhá další z jeho týmu.',
          'Tým, který se dostane na druhou stranu, vyhrává.',
        ],
        tags: ['8 min', 'Soutěž'],
      },
      {
        id: 'wg-numbers',
        title: 'Čísla a stanice',
        summary: 'Reaktivní rozehřívák.',
        steps: [
          'Po sále rozmísti 5 stanic očíslovaných 1–5.',
          'Děti volně pobíhají mezi nimi.',
          'Trenér vykřikne číslo – všichni musí na danou stanici a udělat 5× určený pohyb (klik, dřep, skok).',
          'Zvyšuj rychlost a kombinuj čísla (3+5 = oba pohyby).',
        ],
        tags: ['6 min', 'Reflex'],
      },
      {
        id: 'wg-flow',
        title: 'Flow vlak',
        summary: 'Skupinová sestava bez slov.',
        steps: [
          'Děti stojí v řadě.',
          'První provede jednoduchý pohyb (skok, kotoul).',
          'Druhý zopakuje + přidá svůj.',
          'Třetí zopakuje oba + přidá svůj.',
          'Pokračuje se, dokud někdo nepřeruší řetěz.',
          'Buduje paměť, koordinaci a kreativitu.',
        ],
        tags: ['10 min', 'Sekvence'],
      },
    ],
  },
];
