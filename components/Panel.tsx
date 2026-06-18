export default function Panel({ title, children, rightSlot }: {
  title: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="neo-panel">
      <div className="neo-panel-head flex items-center justify-between">
        <span>{title}</span>
        {rightSlot}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
