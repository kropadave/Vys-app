import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ParentCard, StatusPill } from '@/components/parent-card';
import { linkedParticipants, parentProfile, participantLookupCandidate } from '@/lib/parent-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function ParentProfile() {
  const [birthNumber, setBirthNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searched, setSearched] = useState(false);
  const [linked, setLinked] = useState(false);

  const canSearch = birthNumber.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0;
  const showCandidate = searched && canSearch;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Rodič · Profil</Text>
      <Text style={styles.title}>Můj profil</Text>
      <Text style={styles.body}>Tady bude rodič spravovat účet, účastníky a propojení na databázi.</Text>

      <ParentCard title="Účet rodiče">
        <View style={styles.profileRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{parentProfile.name}</Text>
            <Text style={styles.muted}>{parentProfile.email}</Text>
            <Text style={styles.muted}>{parentProfile.phone}</Text>
          </View>
          <StatusPill label="Přihlášen" tone="success" />
        </View>
      </ParentCard>

      <ParentCard title="Připojit účastníka">
        <Text style={styles.text}>
          Rodič zadá rodné číslo, jméno a příjmení. Backend potom najde účastníka v databázi a nabídne propojení s profilem.
        </Text>

        <View style={styles.form}>
          <Field label="Rodné číslo" value={birthNumber} onChangeText={setBirthNumber} placeholder="např. 010101/1234" />
          <Field label="Jméno" value={firstName} onChangeText={setFirstName} placeholder="Jméno účastníka" />
          <Field label="Příjmení" value={lastName} onChangeText={setLastName} placeholder="Příjmení účastníka" />
        </View>

        <Pressable
          disabled={!canSearch}
          onPress={() => setSearched(true)}
          style={({ pressed }) => [styles.button, !canSearch && styles.buttonDisabled, pressed && { opacity: 0.85 }]}>
          <Text style={styles.buttonText}>Vyhledat v databázi</Text>
        </Pressable>

        {showCandidate && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Nalezený účastník</Text>
            <Text style={styles.resultTitle}>{participantLookupCandidate.firstName} {participantLookupCandidate.lastName}</Text>
            <Text style={styles.muted}>Rodné číslo: {participantLookupCandidate.birthNumberMasked}</Text>
            <Text style={styles.muted}>Kroužek: {participantLookupCandidate.activeCourse}</Text>
            <Text style={styles.muted}>Level {participantLookupCandidate.level} · {participantLookupCandidate.bracelet} náramek</Text>
            <Pressable onPress={() => setLinked(true)} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>{linked ? 'Účastník propojen' : 'Přidat do mého profilu'}</Text>
            </Pressable>
          </View>
        )}
      </ParentCard>

      <ParentCard title="Aktuálně přidaní účastníci">
        {linkedParticipants.map((participant) => (
          <View key={participant.id} style={styles.childRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.childName}>{participant.firstName} {participant.lastName}</Text>
              <Text style={styles.muted}>{participant.activeCourse}</Text>
            </View>
            <StatusPill label={participant.bracelet} />
          </View>
        ))}
      </ParentCard>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 42 },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  text: { color: Palette.text, fontSize: 14, lineHeight: 20 },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  name: { color: Palette.text, fontSize: 22, fontWeight: '900' },
  form: { gap: Spacing.md },
  field: { gap: 7 },
  fieldLabel: { color: Palette.text, fontSize: 13, fontWeight: '900' },
  input: {
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceAlt,
    color: Palette.text,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  buttonDisabled: { opacity: 0.48 },
  buttonText: { color: '#fff', fontWeight: '900' },
  resultBox: { backgroundColor: Palette.primarySoft, borderColor: Palette.primaryDark, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: 6 },
  resultLabel: { color: Palette.accent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  resultTitle: { color: Palette.text, fontSize: 20, fontWeight: '900' },
  linkButton: { alignSelf: 'flex-start', marginTop: Spacing.sm, backgroundColor: Palette.success, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  linkButtonText: { color: '#07140F', fontWeight: '900' },
  childRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  childName: { color: Palette.text, fontSize: 16, fontWeight: '900' },
});
