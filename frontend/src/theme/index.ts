import { createSystem, defineConfig } from "@chakra-ui/react";
import { defaultSystem } from "@chakra-ui/react";

const customTheme = defineConfig({
  cssVarsPrefix: "ui",
  globalCss: {
    ":root, :host": {
      // Tema claro - Paleta azul/índigo refinada
      "--bg-color": "#ffffff",
      "--bg-color-secondary": "var(--ui-colors-blue-300)",
      "--text-color": "#1a202c",
      "--border-color": "#a0aec0",
      "--hover-border-color": "#718096",
      "--focus-border-color": "#5a67d8",
      "--focus-shadow-color": "rgba(90, 103, 216, 0.2)",
      "--error-color": "#e53e3e",
      "--button-bg-color": "var(--ui-colors-blue-300)",
      "--button-hover-bg-color": "var(--ui-colors-blue-300)",
      "--separator": "#e2e8f0",
      "--card-bg-color": "#ebf4ff",
      "--card-border-color": "var(--ui-colors-blue-200)",      
      "--accent-color": "#6366f1",
      "--success-color": "#38a169",
      "--nav-bg-color": "var(--ui-colors-blue-100)"
    },
    ".dark": {
      // Tema oscuro - Tonos más profundos
      "--bg-color": "#121826",
      "--bg-color-secondary": "var(--ui-colors-blue-700)",
      "--text-color": "#f8fafc",
      "--border-color": "rgb(169, 169, 169)",
      "--hover-border-color": "#64748b",
      "--focus-border-color": "#818cf8",
      "--focus-shadow-color": "rgba(129, 140, 248, 0.3)",
      "--error-color": "#f87171",
      "--button-bg-color": "var(--ui-colors-blue-700)",
      "--button-hover-bg-color": "var(--ui-colors-blue-900)",
      "--separator": "#334155",
      "--card-bg-color": "#1e293b",
      "--card-border-color": "var(--ui-colors-blue-800)",      
      "--accent-color": "#818cf8",
      "--success-color": "#34d399",
      "--nav-bg-color": "var(--ui-colors-blue-900)"
    },
    "body": {
      bg: "var(--bg-color)",
      color: "var(--text-color)",
      transition: "background-color 0.3s ease"
    },
    "h1.chakra-heading": {
      color: "var(--text-color)",
      fontSize: "3xl"
    },
    "nav":{
      bgColor: "var(--nav-bg-color)"
    },
    ".separator": {
      borderColor: "var(--separator)",
      opacity: 0.7
    },
    ".card": {
      bg: "var(--card-bg-color)",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      p: "24px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      _dark: {
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      },
      transition: "all 0.3s ease",
      _hover: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }
    },
    ".cart-item" :{
      borderBottom: "1px solid var(--border-color)",
      padding: "8px",
      _last: {
         borderBottom: "none" 
      }
    },
    ".form": {
      maxWidth: "100%",
      padding: "1.5rem",
      margin: "0 auto",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      backgroundColor: "var(--bg-color-secondary)",
      transition: "all 0.3s ease",

      _dark: {
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)"
      },

      "@media screen and (min-width: 320px)": {
        padding: "1.25rem"
      },

      "@media screen and (min-width: 768px)": {
        maxWidth: "600px",
        padding: "2rem",
        "& .field": {
          gridTemplateColumns: "1fr 2fr",
          gap: "1rem"
        }
      },

      "@media screen and (min-width: 1024px)": {
        maxWidth: "700px",
        padding: "2.5rem"
      },

      "& .field-label": {
        fontWeight: "600",
        color: "var(--text-color)",
        fontSize: "0.95rem"
      },

      "& input, & select, & textarea": {
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        border: "2px solid var(--border-color)",
        borderRadius: "8px",
        // padding: "0.75rem",
        transition: "all 0.2s ease",
        
        _hover: {
          borderColor: "var(--hover-border-color)",
          boxShadow: "0 0 0 1px var(--hover-border-color)"
        },
        
        _focus: {
          borderColor: "var(--focus-border-color)",
          boxShadow: "0 0 0 3px var(--focus-shadow-color)",
          outline: "none"
        },
        
        _placeholder: {
          color: "var(--border-color)"
        }
      },

      "& .field-input--error": {
        borderColor: "var(--error-color) !important",
        boxShadow: "0 0 0 1px var(--error-color)"
      },

      "& .field-error": {
        color: "var(--error-color)",
        fontSize: "0.8rem",
        marginTop: "0.25rem"
      },

    //   "& button[type='submit']": {
    //     bg: "var(--button-bg-color)",
    //     color: "white",
    //     _hover: {
    //       bg: "var(--button-hover-bg-color)",
    //       transform: "translateY(-1px)"
    //     },
    //     _active: {
    //       transform: "translateY(0)"
    //     }
    //   }
      },

    "table": {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      
      "& tr": {
        borderBottom: "1px solid",
        borderColor: {
          base: "var(--separator)",
          _dark: "var(--border-color)"
        },
        transition: "background-color 0.2s ease",
        
        _hover: {
          bgColor: "var(--button-hover-bg-color)",
        }
      },
      
      "& thead th": {
        fontWeight: "600",
        background: "var(--bg-color-secondary)",
        py: "1rem",
        position: "sticky",
        top: 0,
        backdropFilter: "blur(8px)",
      },
      
      "& td": {
        py: "1rem",
        verticalAlign: "middle"
      },
    },

    "[class^='chakra-checkbox']": {
      borderColor: {
        base: "var(--separator)",
        _dark: "var(--border-color)"
      },
    },

    "nav a button.chakra-button, .chakra-drawer__body a button": {
      bgColor: "var(--button-bg-color)",
      color: {
        base: "var(--text-color)",
        _dark: "var(--text-color)"
      },
      _hover: {
        bgColor: "var(--button-hover-bg-color)",
      },
    },
      "a.active button.chakra-button": {
        bgColor: "var(--button-hover-bg-color)",
        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
    },    
    ".chakra-card__root": {
      borderColor: "var(--card-border-color) !important",
      borderWidth: "1px",
      borderStyle: "solid",
    }
  }
});

export const customSystem = createSystem(
  defaultSystem._config,
  customTheme,
  { disableLayers: true }
);