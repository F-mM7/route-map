export const colors = {
  background: {
    primary: 'white',
    secondary: '#f5f5f5',
    hover: '#f0f0f0',
    dropdown: 'white',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    error: '#d32f2f',
    placeholder: '#999999',
    input: '#333333',
    dropdown: '#333333',
  },
  button: {
    primary: '#007bff',
    primaryText: 'white',
    disabled: '#cccccc',
    disabledText: '#888888',
  },
  border: {
    primary: '#cccccc',
    secondary: '#eeeeee',
    dropdown: '#cccccc',
  },
  station: {
    tag: '#e0e0e0',
    tagText: '#333333',
  },
} as const;

export const fontSize = {
  small: '12px',
  normal: '14px',
  medium: '16px',
  large: '18px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '10px',
  lg: '16px',
  xl: '20px',
} as const;

export const borderRadius = {
  small: '4px',
  medium: '8px',
} as const;

export const shadows = {
  station: '0 1px 3px rgba(0, 0, 0, 0.2)',
  text: '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8), 1px -1px 2px rgba(255, 255, 255, 0.8), -1px 1px 2px rgba(255, 255, 255, 0.8)',
} as const;