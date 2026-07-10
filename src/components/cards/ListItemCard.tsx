import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/fonts';

type ListItemCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  iconBackgroundColor?: string;
  onPress?: () => void;
};

export function ListItemCard({
  title,
  subtitle,
  icon,
  iconBackgroundColor = '#34272B',
  onPress,
}: ListItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#272024',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: '#E5D5D5',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#867677',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 17,
  },
});
