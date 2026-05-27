import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './providers/AuthProvider.tsx'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient.ts';
import { MessagingSocketProvider } from './providers/MessagingSocketProvider.tsx';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { ThemeProvider } from './providers/ThemeProvider.tsx';
import { I18nProvider } from './providers/I18nProvider.tsx';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ToastProvider } from './components/ui/toast.tsx';
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            <ToastProvider>
              <AuthProvider>
                <MessagingSocketProvider>
                  <App />
                  <Analytics />
                  <SpeedInsights />
                </MessagingSocketProvider>
              </AuthProvider>
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </StrictMode>
  </QueryClientProvider>
)
