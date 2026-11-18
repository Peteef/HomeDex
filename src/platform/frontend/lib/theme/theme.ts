// Day is the default theme: the @theme tokens in index.css. Every other theme is a
// `:root[data-theme='<name>']` block there that overrides some of them.
export type Theme = 'day' | 'night';

const THEME_ATTRIBUTE = 'data-theme';

export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
};
