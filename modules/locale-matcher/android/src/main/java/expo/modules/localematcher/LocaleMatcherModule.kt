package expo.modules.localematcher

import android.icu.util.ULocale
import androidx.core.os.LocaleListCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LocaleMatcherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LocaleMatcher")

    Function("getBestMatchingLocale") { supportedLocales: Array<String> ->
      findBestMatch(supportedLocales)
    }
  }

  // LocaleList.getFirstMatch is not the counterpart to iOS's preferredLocalizations(from:):
  // it returns one of the *user's* locales rather than one of the supported ones, so it
  // cannot pick a translation file. Maximize both sides with ICU instead, which fills in
  // implied scripts (zh-Hant -> zh-Hant-TW, zh-CN -> zh-Hans-CN) so Traditional matches
  // Traditional rather than whichever zh-* happens to come first.
  private fun findBestMatch(supportedLocales: Array<String>): String? {
    val maximized = supportedLocales.map { it to ULocale.addLikelySubtags(ULocale.forLanguageTag(it)) }
    val preferred = LocaleListCompat.getAdjustedDefault()

    for (index in 0 until preferred.size()) {
      val desiredTag = preferred[index]?.toLanguageTag() ?: continue
      val desired = ULocale.addLikelySubtags(ULocale.forLanguageTag(desiredTag))

      supportedLocales.firstOrNull { it.equals(desiredTag, ignoreCase = true) }?.let { return it }

      maximized.firstOrNull { (_, candidate) ->
        candidate.language == desired.language &&
          candidate.script == desired.script &&
          candidate.country == desired.country
      }?.let { return it.first }

      maximized.firstOrNull { (_, candidate) ->
        candidate.language == desired.language && candidate.script == desired.script
      }?.let { return it.first }

      maximized.firstOrNull { (_, candidate) -> candidate.language == desired.language }
        ?.let { return it.first }
    }

    return null
  }
}
