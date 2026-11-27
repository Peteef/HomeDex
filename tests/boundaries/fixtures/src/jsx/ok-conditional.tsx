interface Props {
  open: boolean;
  description?: string;
  items: string[];
  failed: boolean;
}

const Failure = ({ failure }: { failure: string | null }) => <p>{failure}</p>;

export const Conditional = ({ open, description, items, failed }: Props) => {
  const badge = items.length > 3 ? <span>many</span> : null;

  return (
    <div>
      {open && <p>open</p>}
      {description !== undefined && <p>{description}</p>}
      {items.length > 0 && <ul>{items}</ul>}
      {open ? <p>open</p> : <p>closed</p>}
      {open ? 'open' : 'closed'}
      <Failure failure={failed ? 'Failed' : null} />
      {badge}
    </div>
  );
};
