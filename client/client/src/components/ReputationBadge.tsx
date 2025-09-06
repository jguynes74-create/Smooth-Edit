import { Badge } from "@/components/ui/badge";

interface ReputationBadge {
  name: string;
  minReputation: number;
  color: string;
  icon: string;
}

const REPUTATION_BADGES: ReputationBadge[] = [
  { name: "Newcomer", minReputation: 0, color: "bg-gray-500", icon: "👋" },
  { name: "Contributor", minReputation: 50, color: "bg-blue-500", icon: "💡" },
  { name: "Innovator", minReputation: 150, color: "bg-purple-500", icon: "🚀" },
  { name: "Expert", minReputation: 300, color: "bg-green-500", icon: "⭐" },
  { name: "Guru", minReputation: 500, color: "bg-yellow-500", icon: "👑" },
  { name: "Legend", minReputation: 1000, color: "bg-red-500", icon: "🏆" }
];

function getBadgeForReputation(reputation: number): ReputationBadge {
  for (let i = REPUTATION_BADGES.length - 1; i >= 0; i--) {
    if (reputation >= REPUTATION_BADGES[i].minReputation) {
      return REPUTATION_BADGES[i];
    }
  }
  return REPUTATION_BADGES[0];
}

interface ReputationBadgeProps {
  reputation: number;
  showReputation?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ReputationBadge({ reputation, showReputation = true, size = "md" }: ReputationBadgeProps) {
  const badge = getBadgeForReputation(reputation);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge 
      className={`${badge.color} text-white ${sizeClasses[size]} flex items-center gap-1`}
      data-testid={`badge-${badge.name.toLowerCase()}`}
    >
      <span>{badge.icon}</span>
      <span>{badge.name}</span>
      {showReputation && <span className="ml-1 opacity-80">({reputation})</span>}
    </Badge>
  );
}