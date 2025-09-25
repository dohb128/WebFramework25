/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#005BAC",   // 브랜드 블루
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#28A745",   // 그린
          foreground: "#FFFFFF",
        },
        background: "#F9F9F9",
        card: "#FFFFFF",
        muted: "#ECECF0",
        accent: "#E9EBEF",
        foreground: "oklch(0.145 0 0)", // 약 #232327
        "text-muted": "#717182",
        success: "#28A745",
        warning: "#FFC107",
        error: "#DC3545",
        info: "#17A2B8",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "21px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "27px" }],
        xl: ["20px", { lineHeight: "30px" }],
        "2xl": ["24px", { lineHeight: "36px" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
    },
  },
  plugins: [],
};
