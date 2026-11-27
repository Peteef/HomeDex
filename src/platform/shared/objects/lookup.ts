export const lookup = <K extends PropertyKey, V>(
  record: Readonly<Record<K, V>>,
  key: K | undefined,
): V | undefined => (key === undefined ? undefined : record[key]);
