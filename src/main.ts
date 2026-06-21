import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';

import it from './i18n/it.json';
import en from './i18n/en.json';
import fr from './i18n/fr.json';
import de from './i18n/de.json';

import type { SupportedLocale } from '@/types/pdf';

const savedLocale = (localStorage.getItem('pdf-reader:locale') ?? 'it') as SupportedLocale;

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { it, en, fr, de },
});

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.mount('#app');
