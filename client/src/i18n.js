import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationFR from './locales/fr/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
      format: function(value, format, lng) {
        if (value instanceof Date) {
          if (format === 'datetime') {
            return value.toLocaleDateString(lng, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
          // fallback
          return value.toLocaleDateString(lng);
        }
        return value;
      },
    },
  });

export default i18n; 