// src/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e3f2ff',
    100:'#b3daff',
    200:'#84c2ff',
    300:'#55abff',
    400:'#2693ff',
    500:'#007bff',
    600:'#0066cc',
    700:'#005199',
    800:'#003c66',
    900:'#002533',
  },
  accent: {
    50: '#e6fffa',
    100:'#b2f5ea',
    200:'#81e6d9',
    300:'#4fd1c5',
    400:'#38b2ac',
    500:'#319795',
    600:'#2c7a7b',
    700:'#285e61',
    800:'#234e52',
    900:'#1d4044',
  }
};

const fonts = {
  heading: `'Montserrat', sans-serif`,
  body:    `'Inter', sans-serif`,
};

const fontSizes = {
  sm:  '0.875rem',
  md:  '1rem',
  lg:  '1.125rem',
  xl:  '1.25rem',
  '2xl':'1.5rem',
  '3xl':'1.875rem',
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes
});

