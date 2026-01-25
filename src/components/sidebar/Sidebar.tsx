"use client";

export default function Sidebar() {
  const handleNavClick = (item: string) => {
    console.log("[UI]", "SIDEBAR_NAV_CLICK", { item });
  };

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 space-y-4">
      <h1
        className="text-lg font-semibold cursor-pointer"
        onClick={() => handleNavClick("Home")}
      >
        API Studio
      </h1>

      <nav className="space-y-2 text-sm">
        {["Collections", "Environments", "History", "Settings"].map(item => (
          <div
            key={item}
            onClick={() => handleNavClick(item)}
            className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}

