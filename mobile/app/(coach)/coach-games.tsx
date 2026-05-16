import { Feather } from '@expo/vector-icons';
import { useMemo, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import {
  coachTrainingGameTypeLabels,
  useCoachTrainingGames,
  type CoachTrainingGameType,
  type CoachTrainingGameWithMeta,
  type SaveCoachTrainingGameInput,
} from '@/hooks/use-coach-training-games';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];
type TypeFilter = CoachTrainingGameType | 'all';

const gameTypes: CoachTrainingGameType[] = ['warmup', 'skill-building', 'cooldown', 'competition'];
const starValues = [1, 2, 3, 4, 5];

const initialForm: SaveCoachTrainingGameInput = {
  title: '',
  description: '',
  rules: '',
  ageGroup: '6-12 let',
  playerCount: '4-12 hráčů',
  spaceNeeded: 'tělocvična / venkovní spot',
  skillGoal: '',
  type: 'warmup',
};

export default function CoachGamesScreen() {
  const { games, ready, busy, createGame, rateGame, refreshGames, toggleFavorite } = useCoachTrainingGames();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SaveCoachTrainingGameInput>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [playerFilter, setPlayerFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const ageOptions = useMemo(() => uniqueSorted(games.map((game) => game.ageGroup)), [games]);
  const playerOptions = useMemo(() => uniqueSorted(games.map((game) => game.playerCount)), [games]);
  const favoriteCount = games.filter((game) => game.isFavorite).length;
  const ratedGames = games.filter((game) => game.ratingCount > 0);
  const averageRating = ratedGames.length > 0
    ? ratedGames.reduce((sum, game) => sum + game.ratingAverage, 0) / ratedGames.length
    : 0;

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      if (favoritesOnly && !game.isFavorite) return false;
      if (typeFilter !== 'all' && game.type !== typeFilter) return false;
      if (ageFilter !== 'all' && game.ageGroup !== ageFilter) return false;
      if (playerFilter !== 'all' && game.playerCount !== playerFilter) return false;
      if (!query) return true;

      const haystack = [game.title, game.description, game.rules, game.ageGroup, game.playerCount, game.spaceNeeded, game.skillGoal, coachTrainingGameTypeLabels[game.type]]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [ageFilter, favoritesOnly, games, playerFilter, search, typeFilter]);

  const submitGame = async () => {
    const required = [form.title, form.description, form.rules, form.ageGroup, form.playerCount, form.spaceNeeded, form.skillGoal];
    if (required.some((value) => value.trim().length === 0)) {
      setFormError('Vyplň název, popis, pravidla, věk, počet hráčů, prostor i rozvíjenou dovednost.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await createGame(form);
      setForm(initialForm);
      setFormOpen(false);
    } catch {
      setFormError('Hru se nepodařilo uložit. Zkus to prosím znovu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Hry"
        title="Hry na trénink"
        subtitle="Komunitní knihovna her od trenérů pro rozcvičky, skill-building, cooldown a soutěžní bloky."
        icon="zap"
        metrics={[
          { label: 'Sdílené hry', value: String(games.length), tone: 'blue' },
          { label: 'Oblíbené', value: String(favoriteCount), tone: 'pink' },
          { label: 'Průměr', value: averageRating > 0 ? averageRating.toFixed(1) : '—', tone: 'amber' },
        ]}
        actionLabel={formOpen ? 'Zavřít formulář' : 'Přidat hru'}
        actionIcon={formOpen ? 'x' : 'plus'}
        onActionPress={() => setFormOpen((value) => !value)}
      />

      {formOpen ? (
        <GameForm
          form={form}
          error={formError}
          saving={saving}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onSubmit={submitGame}
        />
      ) : null}

      <CoachCard
        title="Filtry"
        subtitle={`${filteredGames.length} z ${games.length} her`}
        right={(
          <Pressable style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.84 }]} onPress={refreshGames}>
            {busy ? <ActivityIndicator size="small" color={CoachColors.blue} /> : <Feather name="refresh-cw" size={16} color={CoachColors.blue} />}
            <Text style={styles.refreshButtonText}>Obnovit</Text>
          </Pressable>
        )}
      >
        <View style={styles.searchBox}>
          <Feather name="search" size={17} color={CoachColors.slateMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Hledat podle názvu, pravidel nebo dovednosti"
            placeholderTextColor={CoachColors.slateMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterBlock}>
          <View style={styles.filterRow}>
            <FilterChip label="Vše" active={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
            {gameTypes.map((type) => (
              <FilterChip key={type} label={coachTrainingGameTypeLabels[type]} active={typeFilter === type} onPress={() => setTypeFilter(type)} />
            ))}
          </View>
          <View style={styles.filterRow}>
            <FilterChip label="Oblíbené" icon="heart" active={favoritesOnly} onPress={() => setFavoritesOnly((value) => !value)} />
            <FilterChip label="Věk: vše" active={ageFilter === 'all'} onPress={() => setAgeFilter('all')} />
            {ageOptions.map((age) => (
              <FilterChip key={age} label={age} active={ageFilter === age} onPress={() => setAgeFilter(age)} />
            ))}
          </View>
          <View style={styles.filterRow}>
            <FilterChip label="Hráči: vše" active={playerFilter === 'all'} onPress={() => setPlayerFilter('all')} />
            {playerOptions.map((players) => (
              <FilterChip key={players} label={players} active={playerFilter === players} onPress={() => setPlayerFilter(players)} />
            ))}
          </View>
        </View>
      </CoachCard>

      {!ready ? (
        <CoachCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={CoachColors.blue} />
            <Text style={styles.muted}>Načítám komunitní hry...</Text>
          </View>
        </CoachCard>
      ) : filteredGames.length === 0 ? (
        <CoachCard>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="plus" size={22} color={CoachColors.blue} />
            </View>
            <Text style={styles.emptyTitle}>Zatím tu není žádná hra pro tento výběr</Text>
            <Text style={styles.muted}>Přidej první hru a ostatní trenéři ji uvidí ve své knihovně.</Text>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.86 }]} onPress={() => setFormOpen(true)}>
              <Feather name="plus" size={17} color="#fff" />
              <Text style={styles.primaryButtonText}>Přidat hru</Text>
            </Pressable>
          </View>
        </CoachCard>
      ) : (
        filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onRate={(rating) => rateGame(game.id, rating)}
            onFavorite={() => toggleFavorite(game.id)}
          />
        ))
      )}

      <View style={{ height: 96 }} />
    </ScrollView>
  );
}

function GameForm({
  form,
  error,
  saving,
  onChange,
  onSubmit,
}: {
  form: SaveCoachTrainingGameInput;
  error: string | null;
  saving: boolean;
  onChange: (patch: Partial<SaveCoachTrainingGameInput>) => void;
  onSubmit: () => void;
}) {
  return (
    <CoachCard title="Nová hra" subtitle="Vyplň strukturu hry, která se má sdílet mezi trenéry.">
      <View style={styles.formGrid}>
        <FormField label="Název" value={form.title} onChangeText={(title) => onChange({ title })} placeholder="Např. Precision štafeta" />
        <FormField label="Věková skupina" value={form.ageGroup} onChangeText={(ageGroup) => onChange({ ageGroup })} placeholder="6-12 let" />
        <FormField label="Počet hráčů" value={form.playerCount} onChangeText={(playerCount) => onChange({ playerCount })} placeholder="4-12 hráčů" />
        <FormField label="Potřebný prostor" value={form.spaceNeeded} onChangeText={(spaceNeeded) => onChange({ spaceNeeded })} placeholder="Tělocvična, spot, žíněnky" />
      </View>

      <View style={styles.typePicker}>
        {gameTypes.map((type) => (
          <FilterChip
            key={type}
            label={coachTrainingGameTypeLabels[type]}
            active={form.type === type}
            onPress={() => onChange({ type })}
          />
        ))}
      </View>

      <FormField label="Popis" value={form.description} onChangeText={(description) => onChange({ description })} placeholder="Krátce popiš princip hry" multiline />
      <FormField label="Pravidla" value={form.rules} onChangeText={(rules) => onChange({ rules })} placeholder="Jedno pravidlo na řádek" multiline />
      <FormField label="Cíl / rozvíjená dovednost" value={form.skillGoal} onChangeText={(skillGoal) => onChange({ skillGoal })} placeholder="Koordinace, odraz, flow, reakce..." multiline />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={({ pressed }) => [styles.primaryButton, saving && styles.disabledButton, pressed && { opacity: 0.86 }]} onPress={onSubmit} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="share-2" size={17} color="#fff" />}
        <Text style={styles.primaryButtonText}>{saving ? 'Ukládám...' : 'Sdílet hru'}</Text>
      </Pressable>
    </CoachCard>
  );
}

function GameCard({ game, onRate, onFavorite }: { game: CoachTrainingGameWithMeta; onRate: (rating: number) => void; onFavorite: () => void }) {
  const typeLabel = coachTrainingGameTypeLabels[game.type];
  const rules = game.rules.split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <CoachCard>
      <View style={styles.gameHeader}>
        <View style={[styles.gameIcon, { backgroundColor: typeTint(game.type) }]}>
          <Feather name={iconForType(game.type)} size={20} color={typeColor(game.type)} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <Text style={styles.gameTitle}>{game.title}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeTint(game.type), borderColor: typeColor(game.type) + '44' }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor(game.type) }]}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={styles.muted}>{game.description}</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.favoriteButton, game.isFavorite && styles.favoriteButtonActive, pressed && { opacity: 0.82 }]} onPress={onFavorite} accessibilityLabel="Uložit hru do oblíbených">
          <Feather name="heart" size={18} color={game.isFavorite ? '#fff' : CoachColors.pink} />
        </Pressable>
      </View>

      <View style={styles.metaGrid}>
        <Meta icon="users" label="Věk" value={game.ageGroup} />
        <Meta icon="user-plus" label="Hráči" value={game.playerCount} />
        <Meta icon="map-pin" label="Prostor" value={game.spaceNeeded} />
        <Meta icon="target" label="Dovednost" value={game.skillGoal} />
      </View>

      <View style={styles.rulesBlock}>
        <Text style={styles.blockLabel}>Pravidla</Text>
        {rules.length > 1 ? rules.map((rule, index) => (
          <View key={`${game.id}-rule-${index}`} style={styles.ruleRow}>
            <View style={[styles.ruleDot, { backgroundColor: typeColor(game.type) }]} />
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        )) : <Text style={styles.ruleText}>{game.rules}</Text>}
      </View>

      <View style={styles.ratingPanel}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.blockLabel}>Hodnocení trenérů</Text>
          <Text style={styles.muted}>{game.ratingCount > 0 ? `${game.ratingAverage.toFixed(1)} / 5 · ${game.ratingCount} hodnocení` : 'Zatím bez hodnocení'}</Text>
        </View>
        <View style={styles.starRow}>
          {starValues.map((rating) => {
            const active = (game.myRating ?? 0) >= rating;
            return (
              <Pressable key={rating} style={({ pressed }) => [styles.starButton, active && styles.starButtonActive, pressed && { opacity: 0.78 }]} onPress={() => onRate(rating)} accessibilityLabel={`Ohodnotit ${rating} z 5`}>
                <Feather name="star" size={16} color={active ? '#fff' : CoachColors.amber} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.authorRow}>
        <Feather name="user" size={14} color={CoachColors.slateMuted} />
        <Text style={styles.authorText}>{game.createdByName} · {game.createdAt}</Text>
      </View>
    </CoachCard>
  );
}

function FormField({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={CoachColors.slateMuted}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: FeatherIconName }) {
  return (
    <Pressable style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.84 }]} onPress={onPress}>
      {icon ? <Feather name={icon} size={14} color={active ? '#fff' : CoachColors.blue} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Meta({ icon, label, value }: { icon: FeatherIconName; label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Feather name={icon} size={15} color={CoachColors.blue} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'cs'));
}

function iconForType(type: CoachTrainingGameType): FeatherIconName {
  if (type === 'warmup') return 'zap';
  if (type === 'skill-building') return 'target';
  if (type === 'cooldown') return 'moon';
  return 'award';
}

function typeColor(type: CoachTrainingGameType) {
  if (type === 'warmup') return CoachColors.amber;
  if (type === 'skill-building') return CoachColors.blue;
  if (type === 'cooldown') return CoachColors.teal;
  return CoachColors.pink;
}

function typeTint(type: CoachTrainingGameType) {
  if (type === 'warmup') return CoachColors.amberSoft;
  if (type === 'skill-building') return CoachColors.blueSoft;
  if (type === 'cooldown') return CoachColors.tealSoft;
  return CoachColors.pinkSoft;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: CoachColors.borderStrong, backgroundColor: CoachColors.blueSoft, paddingHorizontal: 12, paddingVertical: 8 },
  refreshButtonText: { color: CoachColors.blue, fontWeight: '900', fontSize: 12 },
  searchBox: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.panelAlt, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, minWidth: 0, color: CoachColors.slate, fontSize: 14, fontWeight: '700', paddingVertical: 10 },
  filterBlock: { gap: Spacing.sm },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: CoachColors.slate, borderColor: CoachColors.slate },
  chipText: { color: CoachColors.slate, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  chipTextActive: { color: '#fff' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  field: { flex: 1, minWidth: 240, gap: 6 },
  fieldLabel: { color: CoachColors.slate, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 46, borderRadius: Radius.lg, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.panelAlt, color: CoachColors.slate, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 14, fontWeight: '700' },
  inputMultiline: { minHeight: 92, lineHeight: 20 },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  errorText: { color: CoachColors.red, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  primaryButton: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: Radius.lg, backgroundColor: CoachColors.slate, paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  loadingRow: { minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: CoachColors.blueSoft, borderWidth: 1, borderColor: CoachColors.borderStrong },
  emptyTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  gameHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  gameIcon: { width: 46, height: 46, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  gameTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  typeBadge: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, lineHeight: 15, fontWeight: '900' },
  favoriteButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.pinkSoft, backgroundColor: '#fff' },
  favoriteButtonActive: { backgroundColor: CoachColors.pink, borderColor: CoachColors.pink },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaItem: { flexGrow: 1, flexBasis: 180, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.panelAlt, padding: Spacing.md },
  metaLabel: { color: CoachColors.slateMuted, fontSize: 10, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase' },
  metaValue: { color: CoachColors.slate, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  rulesBlock: { gap: 8, borderTopWidth: 1, borderTopColor: CoachColors.border, paddingTop: Spacing.md },
  blockLabel: { color: CoachColors.slate, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  ruleDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  ruleText: { flex: 1, minWidth: 0, color: CoachColors.slate, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  ratingPanel: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.md, borderRadius: Radius.lg, backgroundColor: CoachColors.amberSoft, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', padding: Spacing.md },
  starRow: { flexDirection: 'row', gap: 6 },
  starButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(245,158,11,0.26)' },
  starButtonActive: { backgroundColor: CoachColors.amber, borderColor: CoachColors.amber },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorText: { color: CoachColors.slateMuted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
});