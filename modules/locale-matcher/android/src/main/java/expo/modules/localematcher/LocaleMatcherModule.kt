package expo.modules.localematcher

import androidx.core.os.LocaleListCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LocaleMatcherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LocaleMatcher")

    Function("getBestMatchingLocale") { supportedLocales: Array<String> ->
      LocaleListCompat.getAdjustedDefault()
        .getFirstMatch(supportedLocales)
        ?.toLanguageTag()
    }
  }
}
