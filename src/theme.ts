import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

const fonts = {
  heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  mono: `'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace`,
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'xl',
      _focus: {
        boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
      },
    },
    variants: {
      solid: {
        bg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        color: 'white',
        _hover: {
          bg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          transform: 'translateY(-1px)',
          boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      outline: {
        borderColor: 'primary.500',
        color: 'primary.600',
        _hover: {
          bg: 'primary.50',
          borderColor: 'primary.600',
        },
      },
      ghost: {
        _hover: {
          bg: 'gray.100',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: '2xl',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        _hover: {
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'xl',
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      px: 3,
      py: 1,
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'light' ? 'gray.50' : 'gray.900',
        color: props.colorMode === 'light' ? 'gray.900' : 'gray.50',
        transition: 'background-color 0.2s',
      },
    }),
  },
});
