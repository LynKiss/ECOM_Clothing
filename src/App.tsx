import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import ToastViewport from './components/shared/ToastViewport';
import { LanguageProvider } from './i18n/language-context';
import { ThemeProvider } from './theme/theme-context';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
        <ToastViewport />
      </LanguageProvider>
    </ThemeProvider>
  );
}

