Pod::Spec.new do |s|
  s.name           = 'LocaleMatcher'
  s.version        = '1.0.0'
  s.summary        = 'Resolves the best-matching app locale via native OS locale matching'
  s.description    = 'Exposes Bundle.preferredLocalizations(from:) so JavaScript can pick a translation file using the platform CLDR locale resolution.'
  s.author         = 'Grokability'
  s.homepage       = 'https://github.com/grokability/snipe-it-mobile'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
