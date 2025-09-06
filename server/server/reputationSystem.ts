// Reputation System for SmoothEDIT Community

export interface ReputationBadge {
  name: string;
  minReputation: number;
  color: string;
  icon: string;
}

export const REPUTATION_BADGES: ReputationBadge[] = [
  { name: "Newcomer", minReputation: 0, color: "bg-gray-500", icon: "👋" },
  { name: "Contributor", minReputation: 50, color: "bg-blue-500", icon: "💡" },
  { name: "Innovator", minReputation: 150, color: "bg-purple-500", icon: "🚀" },
  { name: "Expert", minReputation: 300, color: "bg-green-500", icon: "⭐" },
  { name: "Guru", minReputation: 500, color: "bg-yellow-500", icon: "👑" },
  { name: "Legend", minReputation: 1000, color: "bg-red-500", icon: "🏆" }
];

export const REPUTATION_POINTS = {
  IDEA_SUBMITTED: 10,
  VOTE_RECEIVED: 5,
  HIGHLY_VOTED_IDEA: 25, // Bonus for ideas with 10+ votes
  POPULAR_IDEA: 50 // Bonus for ideas with 25+ votes
};

export function calculateReputation(totalIdeasSubmitted: number, totalVotesReceived: number): number {
  let reputation = 0;
  
  // Base points for submitting ideas
  reputation += totalIdeasSubmitted * REPUTATION_POINTS.IDEA_SUBMITTED;
  
  // Points for receiving votes
  reputation += totalVotesReceived * REPUTATION_POINTS.VOTE_RECEIVED;
  
  // Bonus points for highly voted ideas (estimated based on total votes)
  const estimatedHighlyVotedIdeas = Math.floor(totalVotesReceived / 10);
  reputation += estimatedHighlyVotedIdeas * REPUTATION_POINTS.HIGHLY_VOTED_IDEA;
  
  // Bonus points for popular ideas (estimated based on total votes)
  const estimatedPopularIdeas = Math.floor(totalVotesReceived / 25);
  reputation += estimatedPopularIdeas * REPUTATION_POINTS.POPULAR_IDEA;
  
  return reputation;
}

export function getBadgeForReputation(reputation: number): ReputationBadge {
  // Find the highest badge that the user qualifies for
  for (let i = REPUTATION_BADGES.length - 1; i >= 0; i--) {
    if (reputation >= REPUTATION_BADGES[i].minReputation) {
      return REPUTATION_BADGES[i];
    }
  }
  return REPUTATION_BADGES[0]; // Default to Newcomer
}

export function getNextBadge(reputation: number): ReputationBadge | null {
  const currentBadge = getBadgeForReputation(reputation);
  const currentIndex = REPUTATION_BADGES.findIndex(badge => badge.name === currentBadge.name);
  
  if (currentIndex < REPUTATION_BADGES.length - 1) {
    return REPUTATION_BADGES[currentIndex + 1];
  }
  
  return null; // Already at the highest badge
}

export function getProgressToNextBadge(reputation: number): { current: number; needed: number; percentage: number } | null {
  const nextBadge = getNextBadge(reputation);
  if (!nextBadge) return null;
  
  const currentBadge = getBadgeForReputation(reputation);
  const current = reputation - currentBadge.minReputation;
  const needed = nextBadge.minReputation - currentBadge.minReputation;
  const percentage = Math.round((current / needed) * 100);
  
  return { current, needed, percentage };
}