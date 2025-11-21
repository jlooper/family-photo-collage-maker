import { useState, useEffect } from 'react';
import './ElfPopup.css';

const festiveQuotes = [
  'Happy Holidays! 🎄',
  'Ho ho ho! 🎅',
  'Season\'s Greetings! ✨',
  'Joy to the world! 🌟',
  'Have a holly jolly holiday! 🎵',
  'May your days be merry and bright! ⭐',
  'Peace, love, and joy! ❄️',
  'Wishing you warmth and cheer! 🔥',
  'Tis the season to be jolly! 🎊',
  'Hope your holidays sparkle! ✨',
  'Deck the halls! 🎶',
  'Keep calm and celebrate! 🎉',
  'Holiday cheer is here! 🎈',
];

export default function ElfPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const [quote] = useState(() => 
    festiveQuotes[Math.floor(Math.random() * festiveQuotes.length)]
  );

  const handleToggle = () => {
    if (!shouldRender) {
      setShouldRender(true);
      // Small delay to trigger slide-up animation
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    } else {
      setIsVisible(!isVisible);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    // Check if we've already shown the popup this session
    const hasShown = sessionStorage.getItem('elfPopupShown');
    
    if (!hasShown && !hasShownInitial) {
      setHasShownInitial(true);
      setShouldRender(true);
      // Trigger slide-up animation after a brief delay
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('elfPopupShown', 'true');
      }, 800);
      
      // Auto-dismiss after 5 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5800);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [hasShownInitial]);

  return (
    <>
      {/* Always visible toggle button */}
      <button
        onClick={handleToggle}
        className="elf-toggle"
        aria-label="Toggle elf"
        title={isVisible ? 'Hide elf' : 'Show elf'}
      >
        <span className="elf-toggle-icon">🎄</span>
      </button>

      {/* Elf popup */}
      {shouldRender && (
        <div className={`elf-container ${isVisible ? 'visible' : ''}`}>
          {/* Speech bubble */}
          <div className="elf-speech-bubble">
            <p>{quote}</p>
          </div>
          
          <div className="elf-canvas" role="img" aria-label="Cartoon of an elf wearing a Christmas suit and a hat with a bell" onClick={handleClose}>
            <div className="shadow"></div>
            <div className="leg"></div>
            <div className="leg"></div>
            <div className="boot"></div>
            <div className="boot"></div>
            <div className="boot-top"></div>
            <div className="boot-top"></div>
            <div className="vest"></div>
            <div className="arm-left"></div>
            <div className="arm-right"></div>
            <div className="body"></div>
            <div className="collar"></div>
            <div className="belt"></div>
            <div className="hand"></div>
            <div className="hand"></div>
            <div className="neck"></div>
            <div className="ear"></div>
            <div className="ear"></div>
            <div className="head">
              <div className="mouth"></div>
              <div className="eye"></div>
              <div className="eye"></div>
              <div className="cheek"></div>
              <div className="cheek"></div>
              <div className="nose"></div>
            </div>
            <div className="hat-top"></div>
            <div className="hat"></div>
            <div className="bell"></div>
          </div>
        </div>
      )}
    </>
  );
}

