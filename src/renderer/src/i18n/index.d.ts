import i18n from 'i18next';
import { type AppLocale } from '../../../shared/locale';
export declare const LOCALE_STORAGE_KEY = "bionapp-locale";
export declare function getStoredLocale(): AppLocale;
export declare function setAppLocale(locale: AppLocale): Promise<void>;
export default i18n;
