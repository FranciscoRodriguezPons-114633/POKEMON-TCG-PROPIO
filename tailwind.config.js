module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        pocket: {
          bg: '#F2F6FA',
          surface: '#FFFFFFCC',
          surfaceSolid: '#FFFFFF',
          text: '#1E293B',
          textLight: '#64748B',
          accent: '#F5B700',
          accentHover: '#FFD966',
          danger: '#EF4444',
          success: '#10B981',
          info: '#38BDF8',
          sidebar: '#0F172A'
        }
      },
      fontFamily: {
        pocket: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'foil-shine': 'repeating-linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)'
      },
      borderRadius: {
        pocket: '28px',
        'pocket-sm': '16px',
        'pocket-xs': '12px'
      },
      boxShadow: {
        soft: '0 8px 20px -6px rgba(0, 0, 0, 0.08)',
        hover: '0 20px 25px -12px rgba(0, 0, 0, 0.15)',
        card: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
        'glow-sm': '0 0 10px rgba(255,215,0,0.3)',
        'glow-md': '0 0 20px rgba(255,215,0,0.5)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.8)'
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        xl: '16px',
        '2xl': '24px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
