export interface WeeklyReflectionData {
  id: string;
  dateRange: string;
  companionName: string;
  orbGradient: string;
  letter: {
    greeting: string;
    paragraphs: string[];
    signOff: string;
  };
  weather: {
    day: string;
    state: 'Heavy Fog' | 'Rain' | 'Clearing Skies' | 'Golden Hour' | 'Calm Ocean' | 'Quiet Night' | 'Sunrise';
    icon: string;
  }[];
  moodCalendar: {
    date: string;
    dayOfWeek: string;
    mood: string;
    color: string;
    summary: string;
  }[];
  dnaEvolution: {
    trait: string;
    direction: 'up' | 'down' | 'stable';
    label: string;
  }[];
  patterns: string[];
  triggers: {
    givers: string[];
    drainers: string[];
  };
  featuredMemory: {
    day: string;
    quote: string;
  };
  observation: string;
  direction: string;
}

export const mockWeeklyData: WeeklyReflectionData = {
  id: 'wk-42',
  dateRange: 'October 12 - 18',
  companionName: 'Mira',
  orbGradient: 'radial-gradient(circle at 30% 30%, #FFD89B, #19547b)',
  letter: {
    greeting: "Dear Anvesh,",
    paragraphs: [
      "This week felt like a turning point.",
      "You began the week carrying uncertainty, but by the weekend your reflections became noticeably lighter.",
      "You seem to be learning how to trust yourself even when things remain unclear.",
      "Don't overlook that progress."
    ],
    signOff: "— Mira"
  },
  weather: [
    { day: 'Mon', state: 'Rain', icon: '🌧' },
    { day: 'Tue', state: 'Rain', icon: '🌧' },
    { day: 'Wed', state: 'Clearing Skies', icon: '⛅' },
    { day: 'Thu', state: 'Golden Hour', icon: '☀' },
    { day: 'Fri', state: 'Golden Hour', icon: '☀' },
    { day: 'Sat', state: 'Sunrise', icon: '🌤' },
    { day: 'Sun', state: 'Quiet Night', icon: '🌙' }
  ],
  moodCalendar: [
    { date: 'Oct 12', dayOfWeek: 'Mon', mood: 'Stressed', color: '#FF758C', summary: 'Heavy workload and tight deadlines.' },
    { date: 'Oct 13', dayOfWeek: 'Tue', mood: 'Overwhelmed', color: '#FF7EB3', summary: 'Feeling the pressure of expectations.' },
    { date: 'Oct 14', dayOfWeek: 'Wed', mood: 'Reflective', color: '#E2B0FF', summary: 'Taking a step back to breathe.' },
    { date: 'Oct 15', dayOfWeek: 'Thu', mood: 'Hopeful', color: '#FFD89B', summary: 'A good conversation changed my perspective.' },
    { date: 'Oct 16', dayOfWeek: 'Fri', mood: 'Excited', color: '#FF9A9E', summary: 'Finished the major project.' },
    { date: 'Oct 17', dayOfWeek: 'Sat', mood: 'Calm', color: '#A8E6CF', summary: 'A quiet morning with coffee.' },
    { date: 'Oct 18', dayOfWeek: 'Sun', mood: 'Neutral', color: '#E0EAFC', summary: 'Resting and resetting for next week.' }
  ],
  dnaEvolution: [
    { trait: 'Resilience', direction: 'up', label: 'Resilience ↑' },
    { trait: 'Stress', direction: 'down', label: 'Stress ↓' },
    { trait: 'Self-awareness', direction: 'up', label: 'Self-awareness ↑' },
    { trait: 'Consistency', direction: 'up', label: 'Consistency ↑' }
  ],
  patterns: [
    "Work appeared in 5 reflections.",
    "Your mood improved after social interactions.",
    "Most stress occurred during mornings.",
    "Reflection depth increased throughout the week."
  ],
  triggers: {
    givers: ['Family', 'Progress', 'Creativity'],
    drainers: ['Deadlines', 'Overthinking', 'Uncertainty']
  },
  featuredMemory: {
    day: 'Thursday',
    quote: "I finally felt like things were starting to come together."
  },
  observation: "You were noticeably kinder to yourself this week than last week. That change appeared repeatedly throughout your reflections.",
  direction: "Try protecting your mornings. Your most positive reflections tended to begin on calmer mornings."
};
