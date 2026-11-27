export const includeIf = <T extends object>(condition: boolean, props: T): Partial<T> =>
  condition ? props : {};
