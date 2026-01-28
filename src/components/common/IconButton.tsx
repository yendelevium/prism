

export default function IconButton({
  icon: Icon,
  onClick,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-[var(--text-secondary)]
                 hover:text-[var(--accent)]
                 hover:bg-[var(--bg-panel)]
                 transition-colors"
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}