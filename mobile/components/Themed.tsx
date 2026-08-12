/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useThemeStore } from '../store/themeStore';

export type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colors = useThemeStore((state) => state.getColors());
  const effectiveTheme = useThemeStore((state) => state.getEffectiveTheme());

  const color = effectiveTheme === 'light' && lightColor 
    ? lightColor 
    : effectiveTheme === 'dark' && darkColor 
    ? darkColor 
    : colors.text;

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colors = useThemeStore((state) => state.getColors());
  const effectiveTheme = useThemeStore((state) => state.getEffectiveTheme());

  const backgroundColor = effectiveTheme === 'light' && lightColor 
    ? lightColor 
    : effectiveTheme === 'dark' && darkColor 
    ? darkColor 
    : colors.background;

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
