import clsx from "clsx";

function getStatusMeta(status: number | null) {
  if (status === null) {
    return { label: "Pending", statusClass: "text-[var(--text-secondary)]" };
  }

  if (status >= 200 && status < 300) {
    return { label: "OK", statusClass: "text-[var(--success)]" };
  }

  if (status >= 300 && status < 400) {
    return { label: "Redirect", statusClass: "text-[var(--accent)]" };
  }

  if (status >= 400 && status < 500) {
    return { label: "Client Error", statusClass: "text-[var(--warning)]" };
  }

  if (status >= 500) {
    return { label: "Server Error", statusClass: "text-[var(--error)]" };
  }

  return { label: "Unknown", statusClass: "text-[var(--text-secondary)]" };
}

export default function ResponseInfo({
  statusCode,
  responseTime,
}: {
  statusCode: number | null;
  responseTime: number | null;
}) {
  const { label, statusClass } = getStatusMeta(statusCode);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={clsx(statusClass)}>
        {statusCode ?? "—"} {label}
      </span>

      {responseTime !== null && (
        <>
          <span className="text-[var(--border-color)]">•</span>
          <span className="text-[var(--text-secondary)]">{responseTime}ms</span>
        </>
      )}
    </div>
  );
}
