import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import ToastViewport from './components/shared/ToastViewport';
import { LanguageProvider } from './i18n/language-context';

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <ToastViewport />
    </LanguageProvider>
  );
}
