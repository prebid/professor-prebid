import React from 'react';

interface ProfPrebidLogoProps {
  version?: string;
  size?: number;
  barColor?: string;
  textColor?: string;
}

const ProfPrebidLogo: React.FC<ProfPrebidLogoProps> = ({ version = 'v0.3', barColor = '#FF8C00', textColor = '#1A73E8' }) => {
  const barHeight = 5;
  const gap = 5.25;

  return (
    <svg width={110} height={28} viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg">
      {/* Bars */}
      <g fill={barColor}>
        <rect x="5" y={0 * (barHeight + gap)} width="38" height={barHeight} rx="4" />
        <rect x="15" y={1 * (barHeight + gap)} width="40" height={barHeight} rx="4" />
        <rect x="10" y={2 * (barHeight + gap)} width="30" height={barHeight} rx="4" />
        <rect x="20" y={3 * (barHeight + gap)} width="35" height={barHeight} rx="4" />
        <rect x="5" y={4 * (barHeight + gap)} width="55" height={barHeight} rx="4" />
      </g>

      {/* Text */}
      <text x="70" y="20" fontSize="28" fontFamily="roboto" fontWeight="bold" fill={textColor}>
        Professor
      </text>
      <text x="70" y="50" fontSize="28" fontFamily="roboto" fontWeight="bold" fill={textColor}>
        Prebid
      </text>

      {/* Version */}
      <text x="155" y="50" fontSize="26" fontFamily="roboto" fill={textColor}>
        {version}
      </text>
    </svg>
  );
};

export default ProfPrebidLogo;
