import React from 'react';
import {
  Layers,
  Utensils,
  ShoppingBag,
  Shirt,
  Sparkles,
  Smartphone,
  Wrench,
  Package,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  all: Layers,
  'food-snacks': Utensils,
  groceries: ShoppingBag,
  clothing: Shirt,
  'personal-care': Sparkles,
  electronics: Smartphone,
  services: Wrench,
};

interface CategoryIconProps {
  slug?: string | null;
  className?: string;
  size?: number;
}

export function CategoryIcon({ slug, className = 'w-4 h-4', size }: CategoryIconProps) {
  const IconComponent = (slug && ICON_MAP[slug]) || Package;
  return <IconComponent className={className} size={size} strokeWidth={1.75} />;
}

