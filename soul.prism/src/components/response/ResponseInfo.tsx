
export default function ResponseInfo({
    statusCode,
    responseTime
}: {
    statusCode: number,
    responseTime: number,
}) {

    return (
        <div className="flex gap-2 md:flex-row">
          <span className="text-[var(--success)] gap-2">{statusCode} OK</span>
          •
          <span className="text-[var(--success)] gap-2">{responseTime}ms</span>
        </div>
    )
}