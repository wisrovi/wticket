const ACHIEVEMENTS = [
  { id: 'first_ticket', name: 'Primer Paso', description: 'Creaste tu primer ticket', icon: '🎫', check: (user) => user.ticketCount >= 1 },
  { id: 'five_tickets', name: 'Activo', description: 'Creaste 5 tickets', icon: '📝', check: (user) => user.ticketCount >= 5 },
  { id: 'ten_tickets', name: 'Veterano', description: 'Creaste 10 tickets', icon: '🏆', check: (user) => user.ticketCount >= 10 },
  { id: 'first_resolved', name: 'Cliente Satisfecho', description: 'Tu ticket fue resuelto', icon: '✅', check: (user) => user.resolvedCount >= 1 },
  { id: 'five_resolved', name: 'Muy Satisfecho', description: '5 tickets resueltos', icon: '⭐', check: (user) => user.resolvedCount >= 5 },
  { id: 'old_user', name: 'Veterano', description: 'Usuario antiguo', icon: '👴', check: (user) => user.daysSinceCreated >= 30 },
  { id: 'early_bird', name: 'Early Bird', description: 'Usuario del primer mes', icon: '🐣', check: (user) => user.createdAt < 1735689600000 }
];

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
