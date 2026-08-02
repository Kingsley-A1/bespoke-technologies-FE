import { describe, expect, it, vi } from "vitest";
import { createLearnerAuthRepository } from "./learner-auth-repository";

describe("learner auth repository", () => {
  it("invalidates all outstanding challenges for exactly one peppered learner identity", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 1, rows: [] });
    const repository = createLearnerAuthRepository({ query });

    await repository.invalidateOutstandingChallenges("identity-hash", "2026-08-02T10:00:00.000Z");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("identity_hash = $1"), ["identity-hash", "2026-08-02T10:00:00.000Z"]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("consumed_at IS NULL"), ["identity-hash", "2026-08-02T10:00:00.000Z"]);
  });

  it("makes a challenge outcome conditional so a consumed or invalidated code cannot win a retry race", async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 0, rows: [] });
    const repository = createLearnerAuthRepository({ query });

    await expect(repository.saveChallengeOutcome({ id: "challenge-1", failedAttempts: 1 })).resolves.toBe(false);

    expect(query).toHaveBeenCalledWith(expect.stringContaining("invalidated_at IS NULL AND consumed_at IS NULL"), expect.arrayContaining(["challenge-1", 1]));
  });

  it("upserts a verified learner independently of any Admin user table", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "learner-1", email: "learner@example.com" }] });
    const repository = createLearnerAuthRepository({ query });

    await expect(repository.verifyLearner("learner@example.com", "2026-08-02T10:00:00.000Z")).resolves.toEqual({ id: "learner-1", email: "learner@example.com" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO learn_learners"), ["learner@example.com", "2026-08-02T10:00:00.000Z"]);
  });
});
