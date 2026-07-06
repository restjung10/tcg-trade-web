import { STATUS_LABEL, STATUS_BADGE_CLASS, type PostStatusValue } from "@/lib/ui";

export function StatusBadge({ status }: { status: PostStatusValue }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
