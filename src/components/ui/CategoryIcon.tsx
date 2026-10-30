import React from 'react';
import {
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Home,
  Car,
  Film,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Repeat,
  Plane,
  Briefcase,
  TrendingUp,
  Coins,
  LineChart,
  Gift,
  ArrowRightLeft,
  Target,
  Wallet,
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
  Tag,
  PieChart,
  ShieldCheck,
  Zap,
  Coffee,
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
    case 'shoppingcart':
    case 'groceries':
    case 'grocery':
      return <ShoppingCart {...iconProps} />;
    case 'shoppingbag':
    case 'shopping':
    case 'bag':
      return <ShoppingBag {...iconProps} />;
    case 'utensils':
    case 'food':
    case 'dining':
    case 'coffee':
    case 'food & drinks':
      return <Utensils {...iconProps} />;
    case 'receipt':
    case 'bills':
    case 'utilities':
    case 'bills & utilities':
      return <Receipt {...iconProps} />;
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
    case 'health & medical':
      return <HeartPulse {...iconProps} />;
    case 'graduationcap':
    case 'education':
      return <GraduationCap {...iconProps} />;
    case 'sparkles':
    case 'personal care':
      return <Sparkles {...iconProps} />;
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
    case 'salary & wages':
      return <Briefcase {...iconProps} />;
    case 'trendingup':
    case 'freelance':
    case 'bonus':
    case 'freelance & bonus':
      return <TrendingUp {...iconProps} />;
    case 'coins':
    case 'invest':
    case 'dividends':
    case 'dividends & yield':
      return <Coins {...iconProps} />;
    case 'linechart':
    case 'investments':
      return <LineChart {...iconProps} />;
    case 'gift':
    case 'gifts':
    case 'gifts / allowance':
    case 'allowance':
      return <Gift {...iconProps} />;
    case 'arrowrightleft':
    case 'transfer':
    case 'transfer & payment':
      return <ArrowRightLeft {...iconProps} />;
    case 'target':
    case 'goal':
    case 'goal contribution':
    case 'goals':
      return <Target {...iconProps} />;
    case 'wallet':
      return <Wallet {...iconProps} />;
    case 'creditcard':
    case 'card':
    case 'card payment':
      return <CreditCard {...iconProps} />;
    case 'smartphone':
    case 'mobile':
    case 'mobile banking':
      return <Smartphone {...iconProps} />;
    case 'landmark':
    case 'bank':
    case 'bank transfer':
      return <Landmark {...iconProps} />;
    case 'banknote':
    case 'cash':
      return <Banknote {...iconProps} />;
    case 'tag':
    case 'tags':
      return <Tag {...iconProps} />;
    case 'piechart':
    case 'report':
    case 'analytics':
      return <PieChart {...iconProps} />;
    case 'shieldcheck':
    case 'shield':
    case 'emergency':
      return <ShieldCheck {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'cafe':
      return <Coffee {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
};
