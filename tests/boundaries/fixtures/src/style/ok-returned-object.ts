export const service = (): { create: () => void; list: () => void } => {
  const create = (): void => undefined;
  const list = (): void => undefined;
  return {
    create,
    list,
  };
};

export const single = (): { only: number } => ({ only: 1 });

export const pair = (): { a: number; b: number } => ({
  a: 1,
  b: 2,
});
