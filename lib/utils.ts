export const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return '';

  const messageDate = new Date(timestamp);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  // Adjust for the start of the week (assuming Sunday is the first day)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

  if (messageDate >= startOfToday) {
    // Format as time, e.g., 15:55
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } else if (messageDate >= startOfYesterday) {
    return 'Yesterday';
  } else if (messageDate >= startOfWeek) {
    // Format as day of the week, e.g., Monday
    return messageDate.toLocaleDateString([], { weekday: 'long' });
  } else {
    // Format as date, e.g., 08/10/25
    return messageDate.toLocaleDateString([], { year: '2-digit', month: '2-digit', day: '2-digit' });
  }
};
