import React, { useEffect, useState, useRef } from 'react';

const AnimatedText = ({ 
  children, 
  deps = []
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(children);
  const [slideDirection, setSlideDirection] = useState('in');
  const prevDepsRef = useRef(deps);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Ne pas animer lors du montage initial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevDepsRef.current = deps;
      setDisplayedContent(children);
      return;
    }

    // Vérifier si les dépendances ont vraiment changé
    const hasChanged = deps.some((dep, index) => dep !== prevDepsRef.current[index]);
    
    if (hasChanged) {
      // Commencer l'animation de sortie
      setIsAnimating(true);
      setSlideDirection('out');
      
      const timeout = setTimeout(() => {
        // Changer le contenu pendant l'animation
        setDisplayedContent(children);
        setSlideDirection('in');
        
        const timeout2 = setTimeout(() => {
          setIsAnimating(false);
        }, 400); // Durée de l'animation d'entrée
        
        return () => clearTimeout(timeout2);
      }, 400); // Durée de l'animation de sortie
      
      prevDepsRef.current = deps;
      return () => clearTimeout(timeout);
    } else {
      // Si pas de changement de dépendances, juste mettre à jour le contenu
      setDisplayedContent(children);
    }
  }, deps);

  // Mettre à jour le contenu affiché si les enfants changent sans changement de dépendances
  useEffect(() => {
    if (!isInitialMount.current) {
      setDisplayedContent(children);
    }
  }, [children]);

  return (
    <span
      style={{
        display: 'inline-block',
        transform: isAnimating 
          ? slideDirection === 'out' 
            ? 'translateX(-20px)' 
            : 'translateX(20px)'
          : 'translateX(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isAnimating && slideDirection === 'out' ? 0.3 : 1,
      }}
    >
      {displayedContent}
    </span>
  );
};

export default AnimatedText; 