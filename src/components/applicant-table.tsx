import { StatusBadge } from "@/components/status-badge";
import { updateApplicationStatus } from "@/app/actions/workflow";
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
            <th>Action</th>
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
                <div className="flex gap-2">
                  <form action={updateApplicationStatus}>
                    <input name="application_id" type="hidden" value={applicant.applicationId} />
                    <input name="status" type="hidden" value="shortlisted" />
                    <button className="button button-secondary" type="submit">Shortlist</button>
                  </form>
                  <form action={updateApplicationStatus}>
                    <input name="application_id" type="hidden" value={applicant.applicationId} />
                    <input name="status" type="hidden" value="accepted" />
                    <button className="button button-primary" type="submit">Accept</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
