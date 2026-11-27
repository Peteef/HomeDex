export const StringCondition = ({ name }: { name: string | undefined }) => (
  <div>{name && <p>{name}</p>}</div>
);
