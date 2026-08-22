/**
 * Whether a project may be deleted, as a decision rather than a shape.
 *
 * This lived inline inside deleteProject, and the test that claimed to guard it
 * compared the *positions of three substrings* in the source file: the counting
 * query, the refusal message, and `.delete()`. Changing the threshold from
 * `> 0` to `> 999999` left all three present and in order, so a project with a
 * full ledger could be destroyed with all 84 tests green.
 *
 * A rule that matters should be callable, so a test can call it. The refusal is
 * now a function with inputs and an output, and its unit test runs it.
 */

export type LedgerCounts = { expenses: number; payments: number };

/**
 * Deletion is refused while ANY financial record exists.
 *
 * Not a threshold to tune: one expense is a real cost entered against a real
 * client, and archiving is the correct way to put a finished project away. The
 * count comes from the server on every call and is never taken from the client.
 */
export function ledgerBlocksDelete({ expenses, payments }: LedgerCounts): boolean {
  return expenses > 0 || payments > 0;
}

/** The message the engineer sees, naming what is actually in the way. */
export function ledgerRefusal({ expenses, payments }: LedgerCounts): string {
  return `مايتحذفش — فيه ${expenses} بند و${payments} دفعة. أرشفه بدل ما تحذفه.`;
}
