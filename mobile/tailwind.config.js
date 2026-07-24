/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta cyberpunk / dark mode first (CavernicolApp V2 · jul 2026)
        obsidian: {
          void: '#000000',        // background base — true black OLED
          surface: '#0F0F0F',     // cards, sidebar
          border: '#1A1A1A',      // 1px stroke
          hi: '#333333',          // modal/popover border
          elevated: '#1A1A1A',    // popover bg
        },
        // Gradient primario (naranja fuego → magenta)
        flame: '#FF5637',         // orange fuego
        magenta: '#FF45A1',       // magenta
        amber: '#FFBA20',         // tertiary — alertas
        // Aliases legacy (se mantienen brand-* para no romper todas las clases,
        // pero mapeados al nuevo tema oscuro)
        brand: {
          primary: '#FF45A1',
          dark: '#FFFFFF',        // textos primarios (invertido en dark mode)
          muted: '#A0A0A0',       // textos secundarios
          bg: '#000000',
          border: '#1A1A1A',
          card: '#0F0F0F',
          faint: '#666666',
        },
        state: {
          success: '#22C55E',
          warning: '#FFBA20',
          danger: '#FF5637',
          info: '#3B82F6',
        },
        channel: {
          whatsapp: '#25D366',
          messenger: '#0084FF',
          instagram: '#E4405F',
          linkedin: '#0A66C2',
          email: '#A0A0A0',
          voice: '#8B5CF6',
          sms: '#22C55E',
        },
      },
      fontFamily: {
        // Sistema tipográfico Sora / Inter / Geist (cargadas por expo-font)
        heading: ['Sora_700Bold', 'System'],
        'heading-med': ['Sora_600SemiBold', 'System'],
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
        // Geist para labels técnicos (uppercase, wide tracking)
        label: ['Geist_500Medium', 'System'],
      },
      borderRadius: {
        card: '16px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
