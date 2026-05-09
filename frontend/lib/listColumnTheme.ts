/** Light tints per fixed list id — shared by column cards and header stats pills. */
export type ListColumnTheme = {
  shell: string;
  header: string;
  countBadge: string;
  addButton: string;
  dropOver: string;
  statsPill: string;
  statsPillCount: string;
  /** Highlight numbers/text in insights when this column is referenced */
  insightAccent: string;
};

const DEFAULT_THEME: ListColumnTheme = {
  shell:
    "border-[#D1D5DB] bg-[#F9FAFB] shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
  header: "border-b border-[#E5E7EB] bg-[#F3F4F6]",
  countBadge: "bg-[#E5E7EB] text-[#4B5563]",
  addButton: "text-[#6B7280] hover:bg-[#E5E7EB]",
  dropOver: "bg-white/70",
  statsPill: "border-[#D1D5DB] bg-[#F3F4F6]",
  statsPillCount: "text-[#6B7280]",
  insightAccent: "text-[#374151]",
};

export const LIST_COLUMN_THEME: Record<string, ListColumnTheme> = {
  backlog: {
    shell:
      "border-[#BFDBFE] bg-[#EFF6FF] shadow-[0_4px_12px_rgba(59,130,246,0.08)]",
    header: "border-b border-[#BFDBFE] bg-[#DBEAFE]",
    countBadge: "bg-[#BFDBFE]/70 text-[#1E40AF]",
    addButton: "text-[#2563EB] hover:bg-[#BFDBFE]/50",
    dropOver: "bg-[#93C5FD]/25",
    statsPill: "border-[#BFDBFE] bg-[#DBEAFE]",
    statsPillCount: "text-[#1D4ED8]",
    insightAccent: "text-[#1E40AF]",
  },
  todo: {
    shell:
      "border-[#C7D2FE] bg-[#EEF2FF] shadow-[0_4px_12px_rgba(99,102,241,0.1)]",
    header: "border-b border-[#C7D2FE] bg-[#E0E7FF]",
    countBadge: "bg-[#C7D2FE]/60 text-[#4338CA]",
    addButton: "text-[#4F46E5] hover:bg-[#C7D2FE]/40",
    dropOver: "bg-[#A5B4FC]/25",
    statsPill: "border-[#C7D2FE] bg-[#E0E7FF]",
    statsPillCount: "text-[#4338CA]",
    insightAccent: "text-[#4338CA]",
  },
  "in-progress": {
    shell:
      "border-[#FDE68A] bg-[#FFFBEB] shadow-[0_4px_12px_rgba(245,158,11,0.1)]",
    header: "border-b border-[#FDE68A] bg-[#FEF3C7]",
    countBadge: "bg-[#FDE68A]/70 text-[#B45309]",
    addButton: "text-[#D97706] hover:bg-[#FDE68A]/50",
    dropOver: "bg-[#FCD34D]/20",
    statsPill: "border-[#FDE68A] bg-[#FEF3C7]",
    statsPillCount: "text-[#B45309]",
    insightAccent: "text-[#B45309]",
  },
  review: {
    shell:
      "border-[#DDD6FE] bg-[#F5F3FF] shadow-[0_4px_12px_rgba(139,92,246,0.1)]",
    header: "border-b border-[#DDD6FE] bg-[#EDE9FE]",
    countBadge: "bg-[#DDD6FE]/70 text-[#6D28D9]",
    addButton: "text-[#7C3AED] hover:bg-[#DDD6FE]/45",
    dropOver: "bg-[#C4B5FD]/25",
    statsPill: "border-[#DDD6FE] bg-[#EDE9FE]",
    statsPillCount: "text-[#6D28D9]",
    insightAccent: "text-[#6D28D9]",
  },
  done: {
    shell:
      "border-[#A7F3D0] bg-[#ECFDF5] shadow-[0_4px_12px_rgba(16,185,129,0.1)]",
    header: "border-b border-[#A7F3D0] bg-[#D1FAE5]",
    countBadge: "bg-[#A7F3D0]/70 text-[#047857]",
    addButton: "text-[#059669] hover:bg-[#A7F3D0]/45",
    dropOver: "bg-[#6EE7B7]/20",
    statsPill: "border-[#A7F3D0] bg-[#D1FAE5]",
    statsPillCount: "text-[#047857]",
    insightAccent: "text-[#047857]",
  },
};

export function getListColumnTheme(listId: string): ListColumnTheme {
  return LIST_COLUMN_THEME[listId] ?? DEFAULT_THEME;
}
