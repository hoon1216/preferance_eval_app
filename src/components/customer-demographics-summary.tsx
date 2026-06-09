import {
  countByAgeGroup,
  countByGender,
  sortedDemographicEntries,
  type CustomerDemographic,
} from "@/lib/customer-demographics";

function DemographicColumn({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = sortedDemographicEntries(counts);

  return (
    <div className="min-w-[72px]">
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">—</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {entries.map(([label, count]) => (
            <li key={label} className="text-sm text-zinc-600">
              {label}{" "}
              <span className="font-medium text-zinc-900">{count}명</span>
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
    <div className="flex flex-wrap items-start gap-8">
      <div className="min-w-[72px]">
        <p className="text-sm font-medium text-zinc-700">총인원</p>
        <p className="mt-2 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-900">{customers.length}명</span>
        </p>
      </div>
      <DemographicColumn title="성별" counts={countByGender(customers)} />
      <DemographicColumn title="연령대" counts={countByAgeGroup(customers)} />
    </div>
  );
}
