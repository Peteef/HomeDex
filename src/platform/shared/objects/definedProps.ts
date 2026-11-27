type DefinedProps<T extends object> = { [K in keyof T]?: Exclude<T[K], undefined> };

const isDefinedEntry = ([, value]: [string, unknown]): boolean => value !== undefined;

export const definedProps = <T extends object>(props: T): DefinedProps<T> =>
  Object.fromEntries(Object.entries(props).filter(isDefinedEntry)) as DefinedProps<T>;
