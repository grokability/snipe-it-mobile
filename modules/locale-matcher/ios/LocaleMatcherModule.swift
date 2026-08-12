import ExpoModulesCore

public class LocaleMatcherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LocaleMatcher")

    // Picks the best entry from `supportedLocales` for the user's current language
    // preferences, using the same CLDR/ICU language-distance matching the OS applies
    // to its own resources. This is why `zh-Hant` resolves to `zh-TW` rather than the
    // first `zh-*` in the list, which naive prefix matching gets wrong.
    //
    // `preferredLocalizations(from:)` accepts an arbitrary array and does not require
    // matching `.lproj` folders, so it works for translations that live in JSON.
    // Apple's TN2418 explicitly warns against hand-rolling this matching.
    Function("getBestMatchingLocale") { (supportedLocales: [String]) -> String? in
      Bundle.preferredLocalizations(from: supportedLocales).first
    }
  }
}
