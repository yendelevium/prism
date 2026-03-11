const variantStyles = {
  default: "text-[var(--text-secondary)] hover:text-[var(--accent)]",
  active: "bg-[var(--bg-panel)] text-[var(--accent)]",
};

export default function IconButton({
  icon: Icon,
  onClick,
  variant = "default",
  "data-testid": testId,
}: IconButtonProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${variantStyles[variant]}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}

export type IconButtonVariant = "default" | "active";

export type IconButtonProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  variant?: IconButtonVariant;
  "data-testid"?: string;
};
