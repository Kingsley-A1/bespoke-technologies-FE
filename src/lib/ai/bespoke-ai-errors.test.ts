import { describe, expect, it } from "vitest";
import {
  createBespokeAIError,
  getBespokeAIErrorPayload,
  serializeBespokeAIError,
} from "./bespoke-ai-errors";

describe("bespoke-ai-errors", () => {
  it("restores serialized stream errors to the original payload", () => {
    const payload = createBespokeAIError("provider-overloaded");
    const error = new Error(serializeBespokeAIError(payload));

    expect(getBespokeAIErrorPayload(error)).toMatchObject({
      type: "provider-overloaded",
      title: payload.title,
      message: payload.message,
    });
  });

  it("parses structured HTTP error payloads", () => {
    const error = new Error(
      JSON.stringify({
        error: createBespokeAIError("rate-limit", { retryAfterSeconds: 60 }),
      }),
    );

    expect(getBespokeAIErrorPayload(error)).toMatchObject({
      type: "rate-limit",
      retryAfterSeconds: 60,
      canRetry: true,
    });
  });

  it("classifies provider demand spikes as overloaded", () => {
    const error = new Error(
      "This model is currently experiencing high demand. Please try again later.",
    );

    expect(getBespokeAIErrorPayload(error)).toMatchObject({
      type: "provider-overloaded",
      statusCode: 503,
    });
  });
});
