import { Languages, Moon, Sun } from 'lucide-react';
import { usePreferences } from '../../context/preferences';

export default function PreferenceControls({ className = '' }) {
  const { theme, setTheme, language, setLanguage, t } = usePreferences();
  const nextLanguage = language === 'vi' ? 'en' : 'vi';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100"
        aria-label={t(theme === 'dark' ? 'Light mode' : 'Dark mode')}
        title={t(theme === 'dark' ? 'Light mode' : 'Dark mode')}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button
        type="button"
        onClick={() => setLanguage(nextLanguage)}
        className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 text-gray-600 transition hover:bg-gray-100"
        aria-label={language === 'vi' ? 'Switch language to English' : 'Chuyển ngôn ngữ sang tiếng Việt'}
        title={language === 'vi' ? 'Switch language to English' : 'Chuyển ngôn ngữ sang tiếng Việt'}
      >
        <Languages size={16} />
        <span className="text-[10px] font-bold">{language.toUpperCase()}</span>
      </button>
    </div>
  );
}
