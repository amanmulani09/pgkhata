import { useTranslation } from 'react-i18next';

export const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ta', label: 'தமிழ்' },
];

export const useLanguage = () => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return {
        languages,
        changeLanguage,
        currentLanguage,
        t,
        i18n
    };
};
