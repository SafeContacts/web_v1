import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    500: '#374151',  // Gray 700
    600: '#2f3c4a',
    700: '#26303b',
  },
  secondary: {
    500: '#6B7280',  // Gray 500
    600: '#5c6671',
    700: '#4e5963',
  },
  accent: {
    500: '#10B981',  // Green 500
    600: '#0f9d75',
    700: '#0e8c67',
  },
  background: '#F9FAFB',  // off-white
  surface:    '#FFFFFF',
  text: {
    900: '#111827',
    50:  '#1F2937'
  }
};

const fonts = {
  heading: `'Poppins', sans-serif`,
  body:    `'Roboto', sans-serif`
};

const fontSizes = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem'
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  components: {
    Button: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'light' ? 'brand.500' : 'brand.600',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'light' ? 'brand.600' : 'brand.700'
          }
        })
      }
    }
  }
});

