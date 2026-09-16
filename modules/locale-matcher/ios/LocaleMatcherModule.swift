import ExpoModulesCore

public class LocaleMatcherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LocaleMatcher")

    Function("getBestMatchingLocale") { (supportedLocales: [String]) -> String? in
      Bundle.preferredLocalizations(from: supportedLocales).first
    }
  }
}
