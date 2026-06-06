import type { EmotionState } from './types';

export type CompanionThemeType = 'aurora' | 'moonlight' | 'ocean' | 'lavender' | 'sunset' | 'forest' | 'cosmic';

export interface EmotionPalette {
  gradient: string;
  coreColors: string[];
  text: string;
  subtext: string;
  cardBg: string;
  border: string;
}

export type ThemePalettes = Record<EmotionState, EmotionPalette>;

// Helper to keep the file somewhat readable without exploding
const createTheme = (base: ThemePalettes): ThemePalettes => base;

const aurora = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #F9F3E3 0%, #F1E5F5 50%, #E8D7F8 100%)', // Soft gold to lavender
    coreColors: ['#E6C280', '#BFA6D8'],
    text: '#5A4A35',
    subtext: '#8B7B69',
    cardBg: 'rgba(250, 246, 252, 0.45)', // Tinted glass
    border: 'rgba(230, 215, 240, 0.6)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #E6F0F2 0%, #DCE9E9 50%, #D1E5E5 100%)', // Mist blue to teal
    coreColors: ['#9CB4B8', '#7BA8A8'],
    text: '#3A5255',
    subtext: '#6A8083',
    cardBg: 'rgba(235, 242, 242, 0.45)',
    border: 'rgba(180, 205, 205, 0.5)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #E8EAEF 0%, #E2E4EB 50%, #D8DCE6 100%)', // Silver to indigo
    coreColors: ['#B0B4C0', '#8890B0'],
    text: '#404555',
    subtext: '#6D7285',
    cardBg: 'rgba(235, 238, 245, 0.45)',
    border: 'rgba(190, 195, 215, 0.6)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #FBEACC 0%, #F7DBC2 50%, #F2CBB8 100%)', // Warm peach/gold
    coreColors: ['#E5AA70', '#DF8C65'],
    text: '#5E4230',
    subtext: '#8A6855',
    cardBg: 'rgba(250, 240, 230, 0.45)',
    border: 'rgba(230, 190, 170, 0.6)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #EBE1D8 0%, #E3D1D1 50%, #DBC1C1 100%)', // Muted amber to desaturated crimson
    coreColors: ['#C5A88B', '#B88282'],
    text: '#5A4242',
    subtext: '#8A6E6E',
    cardBg: 'rgba(240, 230, 230, 0.35)',
    border: 'rgba(210, 180, 180, 0.5)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #F0F2F5 0%, #EBEFF2 50%, #E6ECEF 100%)',
    coreColors: ['#C0C5CE', '#AAB2BD'],
    text: '#404752',
    subtext: '#6C7582',
    cardBg: 'rgba(242, 245, 248, 0.45)',
    border: 'rgba(200, 210, 220, 0.6)',
  }
});

const moonlight = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #2A2438 50%, #3B2A45 100%)',
    coreColors: ['#D4A5FF', '#FFB7B2'],
    text: '#F2E8FA',
    subtext: '#BDB4CC',
    cardBg: 'rgba(25, 20, 40, 0.55)',
    border: 'rgba(100, 80, 140, 0.4)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #0F172A 0%, #17243B 50%, #1E314D 100%)',
    coreColors: ['#7CD0FF', '#4B88CC'],
    text: '#E0F0FF',
    subtext: '#A0B8D0',
    cardBg: 'rgba(15, 25, 45, 0.55)',
    border: 'rgba(60, 100, 150, 0.4)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #121216 0%, #1A1A24 50%, #232332 100%)',
    coreColors: ['#B8B8E6', '#8A8AB3'],
    text: '#EAEAF2',
    subtext: '#9898B3',
    cardBg: 'rgba(20, 20, 30, 0.55)',
    border: 'rgba(70, 70, 100, 0.4)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #25101A 0%, #331525 50%, #42182D 100%)',
    coreColors: ['#FF9E80', '#E57373'],
    text: '#FFF0EE',
    subtext: '#D9B8B5',
    cardBg: 'rgba(35, 15, 25, 0.55)',
    border: 'rgba(120, 50, 80, 0.4)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #1E1A1A 0%, #2D1F1F 50%, #3B2525 100%)',
    coreColors: ['#D98880', '#A93226'],
    text: '#F5E6E6',
    subtext: '#BD9A9A',
    cardBg: 'rgba(30, 20, 20, 0.55)',
    border: 'rgba(100, 50, 50, 0.4)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #181A1F 0%, #22252A 50%, #2C3036 100%)',
    coreColors: ['#AAB2BD', '#656D78'],
    text: '#E8EAED',
    subtext: '#9AA0A6',
    cardBg: 'rgba(25, 28, 33, 0.55)',
    border: 'rgba(80, 85, 95, 0.4)',
  }
});

const ocean = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
    coreColors: ['#38BDF8', '#0EA5E9'],
    text: '#0C4A6E',
    subtext: '#0284C7',
    cardBg: 'rgba(240, 249, 255, 0.45)',
    border: 'rgba(186, 230, 253, 0.6)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
    coreColors: ['#7DD3FC', '#38BDF8'],
    text: '#082F49',
    subtext: '#0369A1',
    cardBg: 'rgba(240, 249, 255, 0.45)',
    border: 'rgba(224, 242, 254, 0.6)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    coreColors: ['#94A3B8', '#64748B'],
    text: '#0F172A',
    subtext: '#334155',
    cardBg: 'rgba(248, 250, 252, 0.45)',
    border: 'rgba(226, 232, 240, 0.6)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 50%, #5EEAD4 100%)',
    coreColors: ['#2DD4BF', '#14B8A6'],
    text: '#134E4A',
    subtext: '#0F766E',
    cardBg: 'rgba(240, 253, 250, 0.45)',
    border: 'rgba(204, 251, 241, 0.6)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #E0E7FF 0%, #C7D2FE 50%, #A5B4FC 100%)',
    coreColors: ['#818CF8', '#6366F1'],
    text: '#312E81',
    subtext: '#4338CA',
    cardBg: 'rgba(238, 242, 255, 0.45)',
    border: 'rgba(224, 231, 255, 0.6)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #CBD5E1 100%)',
    coreColors: ['#94A3B8', '#64748B'],
    text: '#1E293B',
    subtext: '#475569',
    cardBg: 'rgba(248, 250, 252, 0.45)',
    border: 'rgba(226, 232, 240, 0.6)',
  }
});

const lavender = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)',
    coreColors: ['#C4B5FD', '#A78BFA'],
    text: '#4C1D95',
    subtext: '#6D28D9',
    cardBg: 'rgba(245, 243, 255, 0.45)',
    border: 'rgba(237, 233, 254, 0.6)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)',
    coreColors: ['#D8B4FE', '#C084FC'],
    text: '#581C87',
    subtext: '#7E22CE',
    cardBg: 'rgba(250, 245, 255, 0.45)',
    border: 'rgba(243, 232, 255, 0.6)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    coreColors: ['#CBD5E1', '#94A3B8'],
    text: '#334155',
    subtext: '#475569',
    cardBg: 'rgba(248, 250, 252, 0.45)',
    border: 'rgba(241, 245, 249, 0.6)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 50%, #F5D0FE 100%)',
    coreColors: ['#E879F9', '#D946EF'],
    text: '#701A75',
    subtext: '#A21CAF',
    cardBg: 'rgba(253, 244, 255, 0.45)',
    border: 'rgba(250, 232, 255, 0.6)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
    coreColors: ['#FDA4AF', '#FB7185'],
    text: '#881337',
    subtext: '#BE123C',
    cardBg: 'rgba(255, 241, 242, 0.45)',
    border: 'rgba(255, 228, 230, 0.6)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    coreColors: ['#94A3B8', '#64748B'],
    text: '#1E293B',
    subtext: '#475569',
    cardBg: 'rgba(248, 250, 252, 0.45)',
    border: 'rgba(226, 232, 240, 0.6)',
  }
});

const sunset = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
    coreColors: ['#FDBA74', '#FB923C'],
    text: '#7C2D12',
    subtext: '#C2410C',
    cardBg: 'rgba(255, 247, 237, 0.45)',
    border: 'rgba(255, 237, 213, 0.6)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 50%, #FEF08A 100%)',
    coreColors: ['#FDE047', '#FACC15'],
    text: '#713F12',
    subtext: '#A16207',
    cardBg: 'rgba(254, 252, 232, 0.45)',
    border: 'rgba(254, 249, 195, 0.6)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #FDF8F6 0%, #F2E8E5 50%, #E3D5D1 100%)',
    coreColors: ['#D0BAB3', '#BFA198'],
    text: '#5D4037',
    subtext: '#795548',
    cardBg: 'rgba(253, 248, 246, 0.45)',
    border: 'rgba(242, 232, 229, 0.6)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
    coreColors: ['#FB7185', '#F43F5E'],
    text: '#881337',
    subtext: '#E11D48',
    cardBg: 'rgba(255, 241, 242, 0.45)',
    border: 'rgba(255, 228, 230, 0.6)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #FEF2F2 0%, #FEE2E2 50%, #FECACA 100%)',
    coreColors: ['#F87171', '#EF4444'],
    text: '#7F1D1D',
    subtext: '#B91C1C',
    cardBg: 'rgba(254, 242, 242, 0.45)',
    border: 'rgba(254, 226, 226, 0.6)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 50%, #E7E5E4 100%)',
    coreColors: ['#A8A29E', '#78716C'],
    text: '#292524',
    subtext: '#57534E',
    cardBg: 'rgba(250, 250, 249, 0.45)',
    border: 'rgba(245, 245, 244, 0.6)',
  }
});

const forest = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
    coreColors: ['#86EFAC', '#4ADE80'],
    text: '#14532D',
    subtext: '#166534',
    cardBg: 'rgba(240, 253, 244, 0.45)',
    border: 'rgba(220, 252, 231, 0.6)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #F4FBF7 0%, #E5F6EB 50%, #C7ECD5 100%)',
    coreColors: ['#99DDB5', '#70C592'],
    text: '#1C4A31',
    subtext: '#2A6645',
    cardBg: 'rgba(244, 251, 247, 0.45)',
    border: 'rgba(229, 246, 235, 0.6)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #F4F6F3 0%, #E5E8E2 50%, #CFD5CB 100%)',
    coreColors: ['#A5B09E', '#84937B'],
    text: '#3A4235',
    subtext: '#525B4C',
    cardBg: 'rgba(244, 246, 243, 0.45)',
    border: 'rgba(229, 232, 226, 0.6)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #ECFCCB 0%, #D9F99D 50%, #BEF264 100%)',
    coreColors: ['#A3E635', '#84CC16'],
    text: '#365314',
    subtext: '#4D7C0F',
    cardBg: 'rgba(236, 252, 203, 0.45)',
    border: 'rgba(217, 249, 157, 0.6)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #FDF4E7 0%, #FAE2C4 50%, #F5C691 100%)',
    coreColors: ['#E6A055', '#D3802C'],
    text: '#663B14',
    subtext: '#8C5420',
    cardBg: 'rgba(253, 244, 231, 0.45)',
    border: 'rgba(250, 226, 196, 0.6)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #F8FAF7 0%, #EFF2ED 50%, #E1E6DD 100%)',
    coreColors: ['#B8C2B3', '#96A390'],
    text: '#384034',
    subtext: '#50594B',
    cardBg: 'rgba(248, 250, 247, 0.45)',
    border: 'rgba(239, 242, 237, 0.6)',
  }
});

const cosmic = createTheme({
  hopeful: {
    gradient: 'linear-gradient(135deg, #0F0B1A 0%, #1D1333 50%, #301E4D 100%)',
    coreColors: ['#A78BFA', '#C4B5FD'],
    text: '#F5F3FF',
    subtext: '#DDD6FE',
    cardBg: 'rgba(15, 11, 26, 0.55)',
    border: 'rgba(80, 50, 130, 0.4)',
  },
  calm: {
    gradient: 'linear-gradient(135deg, #0A1128 0%, #122045 50%, #1A2F61 100%)',
    coreColors: ['#60A5FA', '#93C5FD'],
    text: '#EFF6FF',
    subtext: '#BFDBFE',
    cardBg: 'rgba(10, 17, 40, 0.55)',
    border: 'rgba(50, 90, 180, 0.4)',
  },
  reflective: {
    gradient: 'linear-gradient(135deg, #101014 0%, #1A1A22 50%, #242430 100%)',
    coreColors: ['#94A3B8', '#CBD5E1'],
    text: '#F8FAFC',
    subtext: '#E2E8F0',
    cardBg: 'rgba(16, 16, 20, 0.55)',
    border: 'rgba(70, 70, 90, 0.4)',
  },
  excited: {
    gradient: 'linear-gradient(135deg, #240C20 0%, #3B1234 50%, #59194E 100%)',
    coreColors: ['#F472B6', '#F9A8D4'],
    text: '#FDF2F8',
    subtext: '#FBCFE8',
    cardBg: 'rgba(36, 12, 32, 0.55)',
    border: 'rgba(150, 40, 120, 0.4)',
  },
  stressed: {
    gradient: 'radial-gradient(circle at top right, #241113 0%, #3A1B1F 50%, #57282F 100%)',
    coreColors: ['#FB7185', '#FDA4AF'],
    text: '#FFF1F2',
    subtext: '#FECDD3',
    cardBg: 'rgba(36, 17, 19, 0.55)',
    border: 'rgba(140, 50, 60, 0.4)',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #13141A 0%, #1C1E26 50%, #262933 100%)',
    coreColors: ['#64748B', '#94A3B8'],
    text: '#F1F5F9',
    subtext: '#CBD5E1',
    cardBg: 'rgba(19, 20, 26, 0.55)',
    border: 'rgba(60, 65, 80, 0.4)',
  }
});

export const COMPANION_THEMES: Record<CompanionThemeType, ThemePalettes> = {
  aurora,
  moonlight,
  ocean,
  lavender,
  sunset,
  forest,
  cosmic,
};

// For backward compatibility until we switch to ThemeProvider
export const themes = aurora;
