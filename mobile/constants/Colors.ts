const tintColorLight = '#3B82F6';
const tintColorDark = '#3B82F6';

export default {
  light: {
    text: '#0F172A', // text-slate-900
    textSecondary: '#64748B', // text-slate-500
    background: '#F8FAFC', // bg-slate-50
    surface: '#FFFFFF', // bg-white
    border: '#E2E8F0', // border-slate-200
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    danger: '#EF4444',
  },
  dark: {
    text: '#F8FAFC', // text-slate-50
    textSecondary: '#94A3B8', // text-slate-400
    background: '#0F172A', // bg-slate-900
    surface: '#1E293B', // bg-slate-800
    border: '#334155', // border-slate-700
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    danger: '#EF4444',
  },
};
