import {
  countByAgeGroup,
  countByGender,
  sortedDemographicEntries,
  type CustomerDemographic,
} from "@/lib/customer-demographics";

function DemographicList({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = sortedDemographicEntries(counts);

  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-1 text-sm text-zinc-500">—</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {entries.map(([label, count]) => (
            <li key={label} className="text-sm text-zinc-600">
              {label} <span className="font-medium text-zinc-900">{count}명</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CustomerDemographicsSummary({
  customers,
}: {
  customers: CustomerDemographic[];
}) {
  if (customers.length === 0) {
    return <p className="text-sm text-zinc-500">등록된 참여 고객이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        총 <span className="font-semibold text-zinc-900">{customers.length}명</span>
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <DemographicList title="성별" counts={countByGender(customers)} />
        <DemographicList title="연령대" counts={countByAgeGroup(customers)} />
      </div>
    </div>
  );
}
