export const describeSign = (value: number): string => {
  const absolute = Math.abs(value);
  const label = String(absolute);

  if (value < 0) {
    return `minus ${label}`;
  }

  return label;
};
