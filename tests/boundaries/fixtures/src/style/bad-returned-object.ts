export const service = (): { create: () => void; list: () => void } => {
  const create = (): void => undefined;
  const list = (): void => undefined;
  return { create, list };
};
