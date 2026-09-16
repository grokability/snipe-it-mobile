import { requireNativeModule } from "expo";

// getBestMatchingLocale(supportedLocales: string[]) returns the best match for the
// device's language preferences, or null if the platform reports none. Tags come back
// in the platform's canonical casing, which may differ from what was passed in.
export default requireNativeModule("LocaleMatcher");
