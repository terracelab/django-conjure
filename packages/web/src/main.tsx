import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { queryClient } from "@/lib/query";
import { applyThemeFromEnv } from "@/lib/theme";
import { router } from "@/router";

import "./index.css";

// Override theme colors from .env.local VITE_COLOR_* (once, before render).
applyThemeFromEnv();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors toastOptions={{ style: { fontSize: 13 } }} />
    </QueryClientProvider>
  </React.StrictMode>,
);
