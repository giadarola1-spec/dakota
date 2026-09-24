import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'classic' | 'plus';
}

export const DakotaLogo: React.FC<LogoProps> = ({ className = "w-6 h-6", variant = 'classic' }) => {
  const topColor = variant === 'plus' ? '#16a34a' : '#BF0A30'; // Green for Plus, Red for Classic
  const leftColor = '#FFFFFF';
  const rightColor = '#002868';

  return (
    <svg className={className} viewBox="0 0 349.899 349.898" xmlns="http://www.w3.org/2000/svg">
      {/* Top circle: Green (Plus) or Red (Classic) */}
      <path
        fill={topColor}
        d="M175.522,12.235c-42.6,0-77.256,34.649-77.256,77.25c0,42.6,34.656,77.255,77.256,77.255 c42.591,0,77.257-34.656,77.257-77.255C252.779,46.895,218.113,12.235,175.522,12.235z"
      />
      {/* Bottom-left circle: White */}
      <path
        fill={leftColor}
        stroke="#e2e8f0"
        strokeWidth="4"
        d="M77.255,337.663c42.599,0,77.255-34.641,77.255-77.251c0-42.594-34.656-77.25-77.255-77.25 C34.653,183.162,0,217.818,0,260.412C0,303.012,34.653,337.663,77.255,337.663z"
      />
      {/* Bottom-right circle: Blue */}
      <path
        fill={rightColor}
        d="M272.648,183.151c-42.603,0-77.256,34.65-77.256,77.256c0,42.604,34.653,77.25,77.256,77.25 c42.6,0,77.251-34.646,77.251-77.25C349.909,217.818,315.248,183.151,272.648,183.151z"
      />
    </svg>
  );
};

export const DakotaPlusLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <DakotaLogo className={className} variant="plus" />
);
