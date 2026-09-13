import { WorkflowActionForm } from "@/components/workflow-action-form";
import { SubmitButton } from "@/components/submit-button";
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
                  <WorkflowActionForm action={updateApplicationStatus}>
                    <input name="application_id" type="hidden" value={applicant.applicationId} />
                    <input name="status" type="hidden" value="shortlisted" />
                    <SubmitButton className="button button-secondary" pendingText="Shortlisting…">Shortlist</SubmitButton>
                  </WorkflowActionForm>
                  <WorkflowActionForm action={updateApplicationStatus}>
                    <input name="application_id" type="hidden" value={applicant.applicationId} />
                    <input name="status" type="hidden" value="accepted" />
                    <SubmitButton className="button button-primary" pendingText="Accepting…">Accept</SubmitButton>
                  </WorkflowActionForm>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
