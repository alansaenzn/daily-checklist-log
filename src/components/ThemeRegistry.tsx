"use client";

import * as React from "react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider, StyledEngineProvider, responsiveFontSizes } from "@mui/material/styles";

let theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
    fontWeightBold: 800,
  },
});

// Enable responsive font sizes so Typography scales down on small screens
theme = responsiveFontSizes(theme);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
