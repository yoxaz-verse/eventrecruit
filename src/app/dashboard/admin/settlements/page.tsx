
import { requireAdminWorkspace } from "@/lib/dashboard-workspace";
import { dashboardPagination } from "@/lib/pagination";
import { DashboardPagination } from "@/components/dashboard-pagination";
import { verifySettlementReceipt, markPayoutPaid } from "@/app/actions/settlements";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";

export default async function AdminSettlements({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ db }, params] = await Promise.all([requireAdminWorkspace(), searchParams]);
  const pagination = dashboardPagination(params.page);
  const { data: settlements, error } = await db
    .from("staffing_settlements")
    .select("id,status,gross_amount,platform_fee_amount,agency_amount,payer_type,payer_reference,received_reference,staffing_roles(title,events(title)),settlement_payouts(id,recipient_type,amount,status,transaction_reference)")
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error) throw new Error("Unable to load settlements.");

  return (
    <>
      <span className="badge">Admin control</span>
      <h1 className="mt-3 text-4xl font-black">Settlement queue</h1>
      <p className="mt-2 text-[var(--muted)]">Verify incoming payments, then record agency and talent payouts individually.</p>

      <div className="mt-7 grid gap-5">
        {settlements?.map((row) => {
          const role = Array.isArray(row.staffing_roles) ? row.staffing_roles[0] : row.staffing_roles;
          return (
            <article className="panel p-6" key={row.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <span className="badge capitalize">{row.status.replaceAll("_", " ")}</span>
                  <h2 className="mt-2 text-xl font-black">{role?.title ?? "Staffing request"}</h2>
                  <p>
                    Gross ₹{Number(row.gross_amount).toLocaleString("en-IN")} · Platform ₹{Number(row.platform_fee_amount).toLocaleString("en-IN")} · Agency ₹{Number(row.agency_amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-sm text-[var(--muted)]">Payer: {row.payer_type}</span>
              </div>
              {row.status === "sent" ? (
                <form action={verifySettlementReceipt} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="settlement_id" value={row.id} />
                  <label className="label">
                    Receipt reference
                    <input className="input" name="reference" defaultValue={row.payer_reference ?? ""} />
                  </label>
                  <button className="button button-primary">Verify receipt</button>
                </form>
              ) : null}
              <div className="mt-5 grid gap-3">
                {row.settlement_payouts?.map((payout) => (
                  <div className="rounded-xl border border-[var(--line)] p-4" key={payout.id}>
                    <p className="capitalize">
                      {payout.recipient_type} payout · ₹{Number(payout.amount).toLocaleString("en-IN")} · {payout.status}
                    </p>
                    {payout.status !== "paid" ? (
                      <form action={markPayoutPaid} className="mt-3 flex flex-wrap items-end gap-3">
                        <input type="hidden" name="payout_id" value={payout.id} />
                        <label className="label">
                          Transaction reference
                          <input className="input" name="reference" />
                        </label>
                        <button className="button button-primary">Mark paid</button>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--muted)]">Reference: {payout.transaction_reference || "Not recorded"}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          );
        })}

        {!settlements?.length ? (
          <EmptyState
            icon={Receipt}
            title="No settlements configured yet"
            description="Verified incoming payments and settlement payout queues will appear here for admin processing."
          />
        ) : null}
      </div>

      <DashboardPagination
        path="/dashboard/admin/settlements"
        page={pagination.page}
        hasNext={(settlements?.length ?? 0) === pagination.pageSize}
        params={params}
      />
    </>
  );
}
