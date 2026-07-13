import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Fonts } from '@/constants/fonts';

type HeroCoverCardProps = {
  imageUrl: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

export function HeroCoverCard({ imageUrl, title, subtitle, style }: HeroCoverCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(11,8,8,0)', 'rgba(11,8,8,0.35)', 'rgba(11,8,8,0.85)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#272024',
  },
  textBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
  },
  title: {
    fontSize: 36,
    fontFamily: Fonts.condensedBlackItalic,
    color: '#F5EDEA',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#E5D5D5',
  },
});
