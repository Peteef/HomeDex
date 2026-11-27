export const valueIf = <T>(condition: boolean, value: T): T | undefined =>
  condition ? value : undefined;
