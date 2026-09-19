import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  accent = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl transition-all duration-200 bg-[#0D0D0D] border ${
        accent ? 'border-[#C9A227]/60 shadow-lg shadow-[#C9A227]/5' : 'border-[#222222] hover:border-[#C9A227]/40'
      } ${onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-wider text-[#A0A0A0] uppercase">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#808080] font-normal pt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center border transition-colors ${
            accent
              ? 'bg-[#181611] text-[#E0C15A] border-[#C9A227]/50'
              : 'bg-[#141414] text-[#C9A227] border-[#2A261A]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-xs">
          <span className={trend.isPositive ? 'text-[#E0C15A] font-medium' : 'text-[#888888]'}>
            {trend.value}
          </span>
          <span className="text-[11px] text-[#666666]">Período actual</span>
        </div>
      )}
    </div>
  );
};
