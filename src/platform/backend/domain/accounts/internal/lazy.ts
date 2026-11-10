// Computes the value on the first call and returns the same value afterwards.
export function lazy<T>(compute: () => T): () => T {
  let cached: { value: T } | undefined;
  return () => (cached ??= { value: compute() }).value;
}
