/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// 自动获取当前主题下的文本颜色
// const textColor = useThemeColor({}, 'text');

// 浅色模式用蓝色，深色模式用亮蓝色
// const buttonColor = useThemeColor(
//   { light: '#007AFF', dark: '#0A84FF' }, 
//   'tint'
// );