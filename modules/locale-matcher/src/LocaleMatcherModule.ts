import { NativeModule, requireNativeModule } from 'expo';

declare class LocaleMatcherModule extends NativeModule<{}> {
  /**
   * Returns the entry of `supportedLocales` that best matches the device's language
   * preferences, using the platform's native locale matching, or `null` when the
   * platform reports no match.
   *
   * Tags are returned in the platform's canonical casing, which may differ from the
   * casing passed in.
   */
  getBestMatchingLocale(supportedLocales: string[]): string | null;
}

export default requireNativeModule<LocaleMatcherModule>('LocaleMatcher');
