export const describeSign = (value: number): string => {
  const label = String(Math.abs(value));
  if (value < 0) {
    return `minus ${label}`;
  }
  return label;
};
