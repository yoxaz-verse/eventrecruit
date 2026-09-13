import { StatusBadge } from "@/components/status-badge";
import { applicants } from "@/lib/mock-data";

export function ApplicantTable() {
  return (
    <div className="panel overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Score</th>
            <th>Languages</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr key={applicant.id}>
              <td>
                <strong>{applicant.name}</strong>
                <p className="text-sm text-[var(--muted)]">{applicant.role}</p>
              </td>
              <td>
                <strong>{applicant.rating.toFixed(1)}</strong>
                <p className="text-sm text-[var(--muted)]">
                  {applicant.reliability}% reliable · {applicant.completed} jobs
                </p>
              </td>
              <td>{applicant.languages.join(", ")}</td>
              <td>
                <StatusBadge status={applicant.status} />
              </td>
              <td>
                <span className="text-sm text-[var(--muted)]">Illustrative profile</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
