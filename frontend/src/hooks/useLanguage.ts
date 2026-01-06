import { useTranslation } from 'react-i18next';

export const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'ur', label: 'اردو' },
    { code: 'or', label: 'ଓଡ଼ିଆ' },
    { code: 'as', label: 'অসমীয়া' },
    { code: 'mni', label: 'মৈতৈলোন্' },
    { code: 'ne', label: 'नेपाली' },
    { code: 'gom', label: 'कोंकणी' },
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
