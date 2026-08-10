import React from "react";

// The iridescent glowing orb with an animated navy+gold texture. It is the
// hero centrepiece the user "dives into"; the spiral nebula grows out of it.
const Orb = ({ progress = 0 }) => {
  const scale = 1 + progress * 2.4;

  return (
    <div className="orb-parallax">
      <div className="orb-wrap" style={{ transform: `scale(${scale})` }}>
        <div className="orb">
          <div className="orb-aurora" />
          <div className="orb-aurora orb-aurora-2" />
          <div className="orb-gloss" />
        </div>
      </div>
    </div>
  );
};

export default Orb;
