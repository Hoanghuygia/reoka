// Tokens copied from the :root of design/ui/template-d-ket-hop.html.
module.exports = {
  darkMode: ["selector", '[zaui-theme="dark"]'],
  purge: {
    enabled: true,
    content: ["./src/**/*.{js,jsx,ts,tsx,vue}"],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lexend", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      colors: {
        teal: { DEFAULT: "#087F8C", dark: "#056570" },
        navy: "#17324D",
        mint: { DEFAULT: "#DDF4EF", 2: "#C5EAE2" },
        page: "#F2F9F7",
        muted: "#587184",
        faint: "#8DA1AF",
        line: "#DCEBE7",
        due: { DEFAULT: "#9E4A0C", bg: "#FFEFD9" },
        ok: { DEFAULT: "#1B6F46", bg: "#DDF3E6" },
        danger: { DEFAULT: "#B83232", bg: "#FCEDED" },
      },
      borderRadius: {
        card: "16px",
        group: "18px",
      },
    },
  },
};
