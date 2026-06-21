import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import it from '@/i18n/it.json';

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'it',
    messages: { it },
  });
}

export function testGlobalPlugins() {
  return [createPinia(), createTestI18n()];
}
