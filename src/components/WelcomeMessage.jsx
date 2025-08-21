// src/components/WelcomeMessage.jsx

import React, { useState, useEffect } from 'react';

// This array can stay outside the component since it doesn't change.
const gusAliases = [
    "Die Harder", "Matt", "Bighead Burton", "Fingers", "Homeskillet", "Big Baby Burton",
    "Burt the Billowy Bear", "Curtis", "Blackstar", "Chocolate Columbo", "Magic Head",
    "Spellmaster", "SuperSmeller/ SuperSniffer", "Slicks", "Peter Panic",
    "Gus T.T. Showbiz (The Extra T is for Extra Talent)", "Ovaltine Jenkins",
    "Schoonie “U-Turn” Singleton", "Vernest Lambert Watkins", "Bud (from “The Cosby Show”)",
    "Nick Nack", "Bruton Gaster", "Lavender Gooms", "Lemongrass Gogulope",
    "Squirts MacIntosh", "Weepy Boy Santos", "Stewart Lee", "Mc ('tongue clicking sounds') Took",
    "François", "Galileo Humpkins", "Gus “Silly Pants” Jackson", "Fearless Guster",
    "Shmuel Cohen", "Methuselah Honeysuckle", "Shutterfly Simmons", "Paddy Simcox",
    "Chesterfield McMilla", "Felicia Fancybottom", "Tan",
    "Ernesto Agapito Garces con y a de Abelar", "Longbranch Pennywhistle", "Scrooge Jones",
    "D’Andre Pride", "Hummingbird Saltalamacchia", "Wally Ali", "Art Vandelay",
    "Dequan “Smallpox” Randolph", "Trapezius Milkington", "Sterling Cooper",
    "Burton “Oil Can” Guster", "Hollabackatcha", "Jazz Hands", "Gus Brown", "John Slade",
    "Detective Miles", "Greg", "Doughnut Holschtein", "Ron Davis", "Bob Adams",
    "Harry Munroe", "Rich Fingerland", "Black Magic", "Cheswick", "Shawn",
    "Magic Eight Ball Head", "Shaggy Buddy Snap", "Ghee Buttersnaps aka “The Heater”",
    "The Vault of Secrets", "Clementine Woolysocks", "Pinky Guscatero", "Guts",
    "Ol’ Ironside", "Old Iron Stomach", "John Jacob Jingley-Schmidt", "Santonio Holmes",
    "Deon Richmond", "Gurton Buster", "Chaz Bono", "Chocolate Einstein", "MC ClapYoHandz",
    "Sher-Black-Lock", "Whittlebury", "G-Force", "Mellowrush", "Crankshaft", "Sammy",
    "Joey Bishop", "Slick Fingers", "Imhotep", "Control Alt Delete", "The Jackal",
    "Adewale Akinnuoye-Agbaje", "Donut Holestein", "Yasmine Bleeth", "Lodge Blackman",
    "Jet Blackness", "Mission Face", "Radio Star (Video will kill him)", "Gus Jay Gubta",
    "“Reginald G-String AKA Crowd Pleaser”", "Fingers", "Cinderella"
];

function WelcomeMessage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [alias, setAlias] = useState('');

  useEffect(() => {
    const selectNewAlias = () => {
      const randomAlias = gusAliases[Math.floor(Math.random() * gusAliases.length)];
      setAlias(randomAlias);
    };
    
    selectNewAlias(); 
    
    const hourlyTimerId = setInterval(selectNewAlias, 3600000);

    const clockTimerId = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      clearInterval(hourlyTimerId);
      clearInterval(clockTimerId);
    };
  }, []);

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = currentDate.toLocaleDateString('en-GB', dateOptions);
  const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '1.1rem',
      color: '#333'
    }}>
      {/* The greeting is now split into two spans for individual styling */}
      <span>
        <span style={{ fontWeight: '400' }}>Hello there, </span>
        <span style={{ fontWeight: '600' }}>Mr. {alias}</span>
      </span>
      <span>{formattedDate}&nbsp;&nbsp;|&nbsp;&nbsp;{formattedTime}</span>
    </div>
  );
}

export default WelcomeMessage;