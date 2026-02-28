
import React from 'react';

export const COLORS = {
  primary: '#006B3F', // Sierra Leone Green
  secondary: '#004C97', // Sierra Leone Blue
  accent: '#FFD700', // Sierra Leone Gold/Yellow
  danger: '#DC2626',
};

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg', textClassName?: string }> = ({ size = 'md', textClassName }) => {
  const dim = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const defaultTextSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${dim} bg-white rounded-2xl overflow-hidden flex items-center justify-center border-2 border-emerald-600 shadow-xl`}>
        <img 
          src="https://img.freepik.com/premium-vector/blue-car-logo-featuring-check-mark-circle-white-background-subtle-nod-business-selling-cars_538213-68809.jpg?w=826" 
          alt="Auto-Veritas Logo" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className={`${textClassName || `${defaultTextSize} text-slate-900 dark:text-white`} font-black tracking-tighter uppercase whitespace-nowrap`}>
        Auto-Veritas
      </span>
    </div>
  );
};

export const MovingVehicle: React.FC = () => (
  <div className="moving-vehicle text-2xl">
    <i className="fa-solid fa-car-side text-blue-600"></i>
  </div>
);
