import AssetService from './AssetService';

// Service pour gérer les logos des consoles
class ConsoleLogosService {
  // Configuration centralisée de toutes les plateformes
  static PLATFORMS = {
    // PC & Web
    'PC': 'pc.png',
    'Web': 'web.png',
    'Steam': 'steam.png',
    'Steam Deck': 'steam-deck.png',
    'Multi-plateforme': 'multi-platform.png',
    
    // Nintendo - Consoles de salon
    'Nintendo Switch': 'nintendo-switch.png',
    'Wii U': 'wii-u.png',
    'Wii': 'wii.png',
    'GameCube': 'gamecube.png',
    'Nintendo 64': 'nintendo-64.png',
    'Super Nintendo (SNES)': 'snes.png',
    'Nintendo Entertainment System (NES)': 'nes.png',
    
    // Nintendo - Consoles portables
    'Nintendo 3DS': 'nintendo-3ds.png',
    'Nintendo DS': 'nintendo-ds.png',
    'Game Boy Advance': 'gba.png',
    'Game Boy Color': 'gbc.png',
    'Game Boy': 'gameboy.png',
    
    // PlayStation
    'PlayStation 5': 'ps5.png',
    'PlayStation 4': 'ps4.png',
    'PlayStation 3': 'ps3.png',
    'PlayStation 2': 'ps2.png',
    'PlayStation': 'ps1.png',
    'PlayStation Portable (PSP)': 'psp.png',
    'PlayStation Vita': 'ps-vita.png',
    
    // Xbox
    'Xbox Series X/S': 'xbox-series.png',
    'Xbox One': 'xbox-one.png',
    'Xbox 360': 'xbox-360.png',
    'Xbox': 'xbox.png',
    
    // Sega
    'Sega Dreamcast': 'dreamcast.png',
    'Sega Saturn': 'saturn.png',
    'Sega Genesis/Mega Drive': 'genesis.png',
    'Sega Master System': 'master-system.png',
    'Sega Game Gear': 'game-gear.png',
    
    // Autres
    'Atari 2600': 'atari-2600.png',
    'Neo Geo': 'neo-geo.png',
    'Arcade': 'arcade.png',
    'Mobile (iOS/Android)': 'mobile.png'
  };

  // Obtenir le chemin du logo d'une plateforme
  getLogoPath(platform) {
    const filename = ConsoleLogosService.PLATFORMS[platform] || 'default.png';
    return AssetService.getPublicImage(`logos-consoles/${filename}`);
  }

  // Vérifier si un logo existe pour une plateforme
  hasLogo(platform) {
    return platform in ConsoleLogosService.PLATFORMS;
  }

  // Obtenir le nom de fichier d'une plateforme
  getFilename(platform) {
    return ConsoleLogosService.PLATFORMS[platform] || 'default.png';
  }

  // Obtenir une image avec fallback (utilise le système AssetService)
  getImageWithFallback(platform) {
    const filename = this.getFilename(platform);
    return AssetService.getImageWithFallback(
      `logos-consoles/${filename}`,
      AssetService.getGenericFallback()
    );
  }

  // Obtenir la liste de toutes les plateformes supportées
  getAllPlatforms() {
    return Object.keys(ConsoleLogosService.PLATFORMS);
  }

  // Obtenir les plateformes par catégorie (utile pour le debugging)
  getPlatformsByCategory() {
    return {
      'PC & Web': ['PC', 'Web', 'Steam', 'Steam Deck', 'Multi-plateforme'],
      'Nintendo - Salon': ['Nintendo Switch', 'Wii U', 'Wii', 'GameCube', 'Nintendo 64', 'Super Nintendo (SNES)', 'Nintendo Entertainment System (NES)'],
      'Nintendo - Portable': ['Nintendo 3DS', 'Nintendo DS', 'Game Boy Advance', 'Game Boy Color', 'Game Boy'],
      'PlayStation': ['PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation', 'PlayStation Portable (PSP)', 'PlayStation Vita'],
      'Xbox': ['Xbox Series X/S', 'Xbox One', 'Xbox 360', 'Xbox'],
      'Sega': ['Sega Dreamcast', 'Sega Saturn', 'Sega Genesis/Mega Drive', 'Sega Master System', 'Sega Game Gear'],
      'Autres': ['Atari 2600', 'Neo Geo', 'Arcade', 'Mobile (iOS/Android)']
    };
  }
}

export default new ConsoleLogosService(); 