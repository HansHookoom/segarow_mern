import React from 'react';
import HeroSection from '../../components/sections/HeroSection/HeroSection';
import ArticlesSection from '../../components/sections/ArticlesSection/ArticlesSection';
import VideosSection from '../../components/sections/VideosSection/VideosSection';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className="home-page">
      <HeroSection />
      
      <main>
        <ArticlesSection />
        <VideosSection />
      </main>
    </div>
  );
};

export default Home;