import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import {
  EXPENSE_CATEGORIES,
  money,
  monthKey,
  monthParts,
  prettyKey,
} from "@/lib/erp";
import {
  ErpButton,
  ErpLabel,
  ErpMetric,
  ErpPanel,
  erpField,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/expenses")({
  component: ErpExpenses,
});

type Expense = {
  id: string;
  expense_date: string;
  title: string;
  category: string;
  amount: number | string;
  payment_method: string;
  recurring_monthly: boolean;
  recurring_until: string | null;
  notes: string;
  created_at: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ErpExpenses() {
  const site = useSite();
  const queryClient = useQueryClient();

  const [expenseDate, setExpenseDate] = useState(today());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>(
    "miscellaneous",
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [recurring, setRecurring] = useState(false);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [notes, setNotes] = useState("");

  const expensesQuery = useQuery({
    queryKey: ["erp-expenses"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("erp_expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const createExpense = useMutation({
    mutationFn: async () => {
      if (title.trim().length < 2) throw new Error("Enter an expense title.");
      if (amount === "" || Number(amount) < 0) {
        throw new Error("Enter a valid expense amount.");
      }

      const { error } = await (supabase as any).from("erp_expenses").insert({
        expense_date: expenseDate,
        title: title.trim(),
        category,
        amount: Number(amount),
        payment_method: paymentMethod,
        recurring_monthly: recurring,
        recurring_until: recurring && recurringUntil ? recurringUntil : null,
        notes: notes.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense added.");
      setTitle("");
      setAmount("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["erp-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not add expense."),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("erp_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["erp-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete expense."),
  });

  const currentMonthTotal = useMemo(() => {
    const current = monthParts(monthKey());
    return (expensesQuery.data ?? []).reduce((sum, expense) => {
      const date = new Date(`${expense.expense_date}T00:00:00`);
      const sameMonth =
        date.getFullYear() === current.year &&
        date.getMonth() + 1 === current.month;

      const recurringActive =
        expense.recurring_monthly &&
        new Date(`${expense.expense_date}T00:00:00`) <=
          new Date(current.year, current.month, 0) &&
        (!expense.recurring_until ||
          new Date(`${expense.recurring_until}T00:00:00`) >=
            new Date(current.year, current.month - 1, 1));

      return sameMonth || recurringActive
        ? sum + Number(expense.amount || 0)
        : sum;
    }, 0);
  }, [expensesQuery.data]);

  const recurringCount = (expensesQuery.data ?? []).filter(
    (expense) => expense.recurring_monthly,
  ).length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <ErpLabel>ERP / MONEY OUT</ErpLabel>
        <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
          EXPENSES
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Record operating costs once. Monthly recurring entries flow into future reports automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <ErpMetric
          label="This month"
          value={money(currentMonthTotal, site.currencySymbol)}
          emphasis
        />
        <ErpMetric label="Recurring entries" value={recurringCount} />
        <ErpMetric
          label="Ledger entries"
          value={(expensesQuery.data ?? []).length}
          note="All-time ERP expense records"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <ErpPanel>
          <ErpLabel>New expense</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            ADD COST
          </h2>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createExpense.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <ErpLabel className="mb-2">Date</ErpLabel>
                <input
                  type="date"
                  className={erpField}
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </label>
              <label>
                <ErpLabel className="mb-2">Amount</ErpLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={erpField}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </label>
            </div>

            <label className="block">
              <ErpLabel className="mb-2">Title</ErpLabel>
              <input
                className={erpField}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meta ads, software, transport…"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <ErpLabel className="mb-2">Category</ErpLabel>
                <select
                  className={erpField}
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as (typeof EXPENSE_CATEGORIES)[number],
                    )
                  }
                >
                  {EXPENSE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {prettyKey(item)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <ErpLabel className="mb-2">Paid via</ErpLabel>
                <select
                  className={erpField}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 px-4 py-4">
              <div>
                <ErpLabel>Recurring monthly</ErpLabel>
                <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
                  Count this cost once in every active month.
                </p>
              </div>
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
            </label>

            {recurring && (
              <label className="block">
                <ErpLabel className="mb-2">Recurring until</ErpLabel>
                <input
                  type="date"
                  className={erpField}
                  value={recurringUntil}
                  onChange={(e) => setRecurringUntil(e.target.value)}
                />
                <p className="mt-2 text-[8px] leading-relaxed text-muted-foreground">
                  Leave blank for no end date.
                </p>
              </label>
            )}

            <label className="block">
              <ErpLabel className="mb-2">Note</ErpLabel>
              <textarea
                className={erpField}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional context"
              />
            </label>

            <ErpButton
              type="submit"
              tone="primary"
              disabled={createExpense.isPending}
              className="w-full"
            >
              {createExpense.isPending ? "Adding…" : "Add expense"}
            </ErpButton>
          </form>
        </ErpPanel>

        <ErpPanel>
          <div className="flex items-end justify-between gap-4">
            <div>
              <ErpLabel>Operating ledger</ErpLabel>
              <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
                COST HISTORY
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(expensesQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No expenses recorded yet.
              </p>
            ) : (
              (expensesQuery.data ?? []).map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-[22px] border border-border/45 bg-white/[0.015] p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
                        {expense.expense_date} · {prettyKey(expense.category)}
                      </p>
                      <h3 className="mt-2 text-xs tracking-[0.08em] text-foreground">
                        {expense.title}
                      </h3>
                      <p className="mt-2 text-[9px] text-muted-foreground">
                        {prettyKey(expense.payment_method)}
                        {expense.recurring_monthly
                          ? ` · Monthly${expense.recurring_until ? ` until ${expense.recurring_until}` : ""}`
                          : ""}
                      </p>
                      {expense.notes && (
                        <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs tracking-[0.08em] text-chrome">
                        {money(expense.amount, site.currencySymbol)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm(
                            `Delete expense "${expense.title}"?`,
                          );
                          if (ok) deleteExpense.mutate(expense.id);
                        }}
                        disabled={deleteExpense.isPending}
                        className="mt-4 inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </ErpPanel>
      </div>
    </div>
  );
}
