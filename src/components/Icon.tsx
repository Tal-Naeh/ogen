import {
  Baby, Briefcase, CreditCard, Ellipsis, Fuel, HeartPulse, House, Landmark, Layers, PiggyBank, Repeat,
  School, Shield, ShoppingBag, ShoppingCart, Sofa, Sparkles, Ticket, TrendingUp, TriangleAlert,
  UtensilsCrossed, Wifi, Zap, type LucideIcon,
} from "lucide-react";
import type { Category } from "../data/types";

const icons: Record<string, LucideIcon> = {
  briefcase: Briefcase, landmark: Landmark, home: House, zap: Zap, wifi: Wifi, shield: Shield,
  school: School, repeat: Repeat, layers: Layers, cart: ShoppingCart, utensils: UtensilsCrossed,
  fuel: Fuel, bag: ShoppingBag, heart: HeartPulse, baby: Baby, ticket: Ticket, sofa: Sofa,
  dots: Ellipsis, piggy: PiggyBank, card: CreditCard, trending: TrendingUp, sparkles: Sparkles,
  alert: TriangleAlert,
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const C = icons[name] ?? Ellipsis;
  return <C size={size} strokeWidth={1.9} className={className} aria-hidden />;
}

/** Rounded icon chip tinted per category (decorative identity, label always beside it). */
export function CategoryChip({ category, size = 40 }: { category: Category; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        color: category.tint,
        background: `color-mix(in oklab, ${category.tint} 14%, transparent)`,
      }}
    >
      <Icon name={category.icon} size={Math.round(size * 0.47)} />
    </span>
  );
}
