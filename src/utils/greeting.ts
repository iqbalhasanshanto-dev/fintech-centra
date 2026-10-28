/**
 * Header greeting rule based on local device time:
 * - 05:00 to 11:59: "Good Morning"
 * - 12:00 to 16:59: "Good Afternoon"
 * - 17:00 to 04:59: "Good Evening"
 * Note: There is no "Good Night".
 */
export function getGreeting(date: Date = new Date()): string {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return 'Good Morning';
  }
  if (hours >= 12 && hours < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}
