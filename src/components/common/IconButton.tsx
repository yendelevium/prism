
const variantStyles = {
    default: 'text-[var(--text-secondary)] hover:text-[var(--accent)]',
    active: 'bg-[var(--bg-panel)] text-[var(--accent)]'
}


export default function IconButton({
  icon: Icon,
  onClick,
  variant = 'default'
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${variantStyles[variant]}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}


type IconButtonVariant = 'default' | 'active'

type IconButtonProps = {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    onClick?: () => void
    variant?: IconButtonVariant
}