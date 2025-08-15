// Custom Platform utility to avoid module resolution issues
export const Platform = {
  OS: typeof window !== 'undefined' ? 'web' : 'native',
  select: <T>(specifics: { web?: T; native?: T; default?: T }): T => {
    const platform = typeof window !== 'undefined' ? 'web' : 'native';
    return specifics[platform] ?? specifics.default ?? specifics.web ?? specifics.native;
  }
};

export const isWeb = typeof window !== 'undefined';
export const isNative = typeof window === 'undefined';