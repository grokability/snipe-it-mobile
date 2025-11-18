import Crowdin from '@crowdin/react-native-sdk';
import { crowdinConfig } from '../../crowdin.config';
import i18n from '../i18n';

class CrowdinService {
  private sdk: any;

  constructor() {
    this.sdk = new Crowdin({
      distributionHash: crowdinConfig.distributionHash,
    });
  }

  async initAndDownload(): Promise<void> {
    try {
      // Fetch translations from Crowdin
      await this.sdk.downloadTranslations();

      // Shape of this depends on your Crowdin SDK config,
      // but usually: { [lang]: { [key]: 'value', ... }, ... }
      const translations = await this.sdk.getTranslations();

      Object.keys(translations).forEach((lang) => {
        const data = translations[lang];
        // Merge/update i18next resources for this language
        i18n.addResourceBundle(
          lang,
          'translation',
          data,
          true,  // deep merge
          true   // overwrite existing
        );
      });

      console.log('Crowdin translations applied');
    } catch (e) {
      console.warn('Crowdin init/download failed', e);
    }
  }

  async checkForUpdates(): Promise<void> {
    try {
      const hasUpdates = await this.sdk.checkForUpdates();
      if (hasUpdates) {
        await this.initAndDownload();
      }
    } catch (e) {
      console.warn('Crowdin update check failed', e);
    }
  }
}

export default new CrowdinService();