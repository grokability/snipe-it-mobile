package expo.modules.localematcher

import androidx.core.os.LocaleListCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LocaleMatcherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LocaleMatcher")

    // Android counterpart to iOS's Bundle.preferredLocalizations(from:). getFirstMatch
    // walks the user's locale preferences and returns the first entry of
    // `supportedLocales` that matches, using the platform's own locale resolution
    // rather than string comparison.
    Function("getBestMatchingLocale") { supportedLocales: Array<String> ->
      LocaleListCompat.getAdjustedDefault()
        .getFirstMatch(supportedLocales)
        ?.toLanguageTag()
    }
  }
}
