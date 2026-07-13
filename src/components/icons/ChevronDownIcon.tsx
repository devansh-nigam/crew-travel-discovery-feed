import Svg, { Path } from 'react-native-svg';

type ChevronDownIconProps = {
  size?: number;
  color?: string;
};

export function ChevronDownIcon({ size = 18, color = '#E5D5D5' }: ChevronDownIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
