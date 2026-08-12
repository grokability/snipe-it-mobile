import { NativeModule, requireNativeModule } from 'expo';

declare class LocaleMatcherModule extends NativeModule<{}> {
  getBestMatchingLocale(supportedLocales: string[]): string | null;
}

export default requireNativeModule<LocaleMatcherModule>('LocaleMatcher');
