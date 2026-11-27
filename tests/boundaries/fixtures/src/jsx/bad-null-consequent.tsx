export const NullConsequent = ({ amount, searching }: { amount: number | null; searching: boolean }) => (
  <div>
    {amount === null ? null : (
      <span>
        {amount}
      </span>
    )}
    {searching ? null : <p>add</p>}
  </div>
);
