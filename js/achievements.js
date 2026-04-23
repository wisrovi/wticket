const ACHIEVEMENTS = [
  { id: 'first_ticket', name: 'Primer Paso', description: 'Creaste tu primer ticket', icon: '🎫', check: (user) => user.ticketCount >= 1 },
  { id: 'five_tickets', name: 'Activo', description: 'Creaste 5 tickets', icon: '📝', check: (user) => user.ticketCount >= 5 },
  { id: 'ten_tickets', name: 'Veterano', description: 'Creaste 10 tickets', icon: '🏆', check: (user) => user.ticketCount >= 10 },
  { id: 'first_resolved', name: 'Cliente Satisfecho', description: 'Tu ticket fue resuelto', icon: '✅', check: (user) => user.resolvedCount >= 1 },
  { id: 'five_resolved', name: 'Muy Satisfecho', description: '5 tickets resueltos', icon: '⭐', check: (user) => user.resolvedCount >= 5 },
  { id: 'old_user', name: 'Veterano', description: 'Usuario antiguo', icon: '👴', check: (user) => user.daysSinceCreated >= 30 },
  { id: 'early_bird', name: 'Early Bird', description: 'Usuario del primer mes', icon: '🐣', check: (user) => user.createdAt < 1735689600000 }
];

export function calculateLevel(user) {
  // 10 pts per ticket, 50 pts per resolved ticket
  const points = (user.ticketCount * 10) + (user.resolvedCount * 50);
  const level = Math.floor(Math.sqrt(points / 20)) + 1;
  const nextLevelPoints = Math.pow(level, 2) * 20;
  const currentLevelPoints = Math.pow(level - 1, 2) * 20;
  const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  
  return { level, points, progress, nextLevelPoints };
}

export function getAchievements(user) {
  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: achievement.check(user)
  }));
}

export function getUnlockedCount(user) {
  return getAchievements(user).filter(a => a.unlocked).length;
}

export function getTotalCount() {
  return ACHIEVEMENTS.length;
}
