/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      // Typography refinements
      fontSize: {
        // Refined font sizes with optimized line-heights and letter-spacing
        'display': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'xs': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],     // 11px
        'sm': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.005em' }],    // 13px
        'base': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0' }],        // 15px
        'lg': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],     // 24px
        '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],    // 36px
      },
      // Extended letter-spacing for fine control
      letterSpacing: {
        'tighter': '-0.025em',
        'tight': '-0.02em',
        'snug': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.025em',
        'widest': '0.05em',
      },
      // Extended line-height for typography
      lineHeight: {
        'tight': '1.1',
        'snug': '1.25',
        'normal': '1.4',
        'relaxed': '1.5',
        'loose': '1.75',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Supabase Scale (Approximate)
        scale: {
          1: "#000000",
          2: "#151515", // Background
          3: "#1C1C1C", // Card
          4: "#262626", // Secondary
          5: "#2E2E2E", // Border
          6: "#383838",
          7: "#424242",
          8: "#5C5C5C",
          9: "#8B8B8B", // Muted
          10: "#B5B5B5",
          11: "#D6D6D6",
          12: "#EDEDED", // Foreground
        }
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        // Elevation system for premium depth
        'elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'elevation-2': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'elevation-3': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        // Glow effect for highlighted elements
        'glow-primary': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-success': '0 0 20px hsl(142 76% 36% / 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
