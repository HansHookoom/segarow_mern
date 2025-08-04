class YouTubeService {
  static PLAYLISTS = {
    videos: process.env.REACT_APP_YT_PLAYLIST_GUID_MAIN,
    lives: process.env.REACT_APP_YT_PLAYLIST_GUID_LIVE
  };

  static CHANNEL_URL = 'https://www.youtube.com/channel/UCXOV1tTxtNeJB8TaHhoQIKQ';

  /**
   * Récupère le flux RSS YouTube via l'API rss2json
   */
  static async fetchRSSFeed(playlistId) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      return data.items || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Extrait l'ID vidéo d'une URL YouTube
   */
  static extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : "";
  }

  /**
   * Extrait le numéro du titre (#XX)
   */
  static extractNumberFromTitle(title) {
    const numberMatch = title.match(/#(\d+)/);
    return numberMatch ? "#" + numberMatch[1] : "";
  }

  /**
   * Récupère les rediffusions de lives
   */
  static async fetchLives(limit = 2) {
    const livesItems = await this.fetchRSSFeed(this.PLAYLISTS.lives);
    
    return livesItems.slice(0, limit).map(item => ({
      videoId: this.extractVideoId(item.link),
      title: item.title,
      link: item.link,
      publishDate: item.pubDate
    }));
  }

  /**
   * Récupère la dernière vidéo normale
   */
  static async fetchLatestVideo() {
    const videosItems = await this.fetchRSSFeed(this.PLAYLISTS.videos);
    
    if (videosItems.length === 0) {
      return null;
    }

    const latestVideo = videosItems[0];
    const videoId = this.extractVideoId(latestVideo.link);
    
    // Extraire le titre principal (avant le premier #)
    const mainTitle = latestVideo.title.split('#')[0].trim();
    const videoNumber = this.extractNumberFromTitle(latestVideo.title);

    return {
      videoId,
      title: latestVideo.title,
      mainTitle,
      videoNumber,
      link: latestVideo.link,
      publishDate: latestVideo.pubDate
    };
  }

  /**
   * Récupère plusieurs vidéos
   */
  static async fetchVideos(limit = 3) {
    const videosItems = await this.fetchRSSFeed(this.PLAYLISTS.videos);
    
    return videosItems.slice(0, limit).map(item => ({
      videoId: this.extractVideoId(item.link),
      title: item.title,
      mainTitle: item.title.split('#')[0].trim(),
      videoNumber: this.extractNumberFromTitle(item.title),
      link: item.link,
      publishDate: item.pubDate
    }));
  }
}

export default YouTubeService;