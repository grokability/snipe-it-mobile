import { registerWebModule, NativeModule } from 'expo';

class LocaleMatcherModule extends NativeModule<{}> {
  // The web target has no equivalent of the native locale-matching APIs. Returning
  // null makes i18n/index.js fall back to its own matching.
  getBestMatchingLocale(): string | null {
    return null;
  }
}

export default registerWebModule(LocaleMatcherModule, 'LocaleMatcherModule');
