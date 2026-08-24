import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Home,
  Car,
  Film,
  HeartPulse,
  Repeat,
  Plane,
  Briefcase,
  TrendingUp,
  Coins,
  ArrowRightLeft,
  ShieldCheck,
  Zap,
  Coffee,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  size,
}) => {
  const iconProps = { className, size };

  switch (name?.toLowerCase()) {
    case 'utensils':
    case 'food':
    case 'dining':
    case 'coffee':
      return <Utensils {...iconProps} />;
    case 'shoppingbag':
    case 'shopping':
    case 'bag':
      return <ShoppingBag {...iconProps} />;
    case 'home':
    case 'housing':
    case 'rent':
      return <Home {...iconProps} />;
    case 'car':
    case 'transport':
    case 'fuel':
      return <Car {...iconProps} />;
    case 'film':
    case 'entertainment':
    case 'movie':
      return <Film {...iconProps} />;
    case 'heartpulse':
    case 'health':
    case 'wellness':
      return <HeartPulse {...iconProps} />;
    case 'repeat':
    case 'subs':
    case 'subscriptions':
      return <Repeat {...iconProps} />;
    case 'plane':
    case 'travel':
    case 'vacation':
      return <Plane {...iconProps} />;
    case 'briefcase':
    case 'salary':
    case 'work':
      return <Briefcase {...iconProps} />;
    case 'trendingup':
    case 'freelance':
    case 'bonus':
      return <TrendingUp {...iconProps} />;
    case 'coins':
    case 'invest':
    case 'dividends':
      return <Coins {...iconProps} />;
    case 'arrowrightleft':
    case 'transfer':
      return <ArrowRightLeft {...iconProps} />;
    case 'shieldcheck':
    case 'shield':
    case 'emergency':
      return <ShieldCheck {...iconProps} />;
    case 'zap':
    case 'bills':
    case 'utilities':
      return <Zap {...iconProps} />;
    case 'cafe':
      return <Coffee {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
};
