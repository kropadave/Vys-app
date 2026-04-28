import { Pressable, StyleSheet, Text, View } from 'react-native';

const colors = {
  ink: '#17211D',
  muted: '#6C756F',
  border: '#D7E0DA',
  locked: '#F0F2EF',
};

export function LockedBuyButton() {
  return (
    <View style={styles.wrap}>
      <Pressable disabled style={styles.button}>
        <Text style={styles.icon}>Zamčeno</Text>
        <Text style={styles.buttonText}>Koupit</Text>
      </Pressable>
      <Text style={styles.help}>Pro nákup musíš být přihlášený.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.locked,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    opacity: 0.78,
  },
  icon: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  buttonText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  help: { color: colors.muted, fontSize: 12, lineHeight: 16 },
});
