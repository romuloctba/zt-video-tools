import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage, type LanguageCode } from '@/shared/i18n';

/**
 * LanguageSwitcher - Toggle between available languages
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as LanguageCode;

  const handleChange = (lang: LanguageCode) => {
    changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1">
      {Object.values(LANGUAGES).map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code as LanguageCode)}
          className={`
            px-2 py-1 text-xs font-medium rounded transition-colors
            ${currentLang === lang.code
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
            }
          `}
          title={lang.name}
        >
          {lang.flag} {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
