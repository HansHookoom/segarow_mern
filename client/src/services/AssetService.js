// Service pour gérer les assets de manière centralisée
class AssetService {
  // Images statiques dans public/
  static getPublicImage(filename) {
    return `/assets/img/${filename}`;
  }

  // Images des composants dans src/
  static getComponentImage(importedImage) {
    return importedImage;
  }

  // Images avec fallback
  static getImageWithFallback(filename, fallback = null) {
    const imagePath = this.getPublicImage(filename);
    return {
      src: imagePath,
      fallback: fallback || this.getDefaultArticleFallback()
    };
  }

  // SVG par défaut pour les articles
  static getDefaultArticleFallback() {
    return 'data:image/svg+xml,%3Csvg width="400" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23444" stroke="%23666" stroke-width="2"/%3E%3Ctext x="50%25" y="40%25" fill="white" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="24"%3E📰%3C/text%3E%3Ctext x="50%25" y="65%25" fill="%23ccc" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14"%3EImage indisponible%3C/text%3E%3C/svg%3E';
  }

  // SVG par défaut générique
  static getGenericFallback() {
    return 'data:image/svg+xml,%3Csvg width="400" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="white" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="18"%3E🖼️ Image%3C/text%3E%3C/svg%3E';
  }

  // Images pour CSS background
  static getCSSBackground(filename) {
    return `url(${this.getPublicImage(filename)})`;
  }

  // Constantes pour les images courantes
  static IMAGES = {
    LOGO_WHITE: 'Logo_SEGAROW_blanc_1.svg',
    LOGO_BLACK: 'Logo_SEGAROW_noir_1.svg',
    FOOTER_PATTERN: 'Footer.svg',
    PERSONNAGES_SEGA: 'personnages_sega.svg'
  };
}

export default AssetService; 