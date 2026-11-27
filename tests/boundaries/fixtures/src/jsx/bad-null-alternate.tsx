export const NullAlternate = ({ open, hint }: { open: boolean; hint: boolean }) => (
  <div>
    {open ? <p>open</p> : null}
    {open || hint ? (
      <p>
        hint
      </p>
    ) : null}
  </div>
);
