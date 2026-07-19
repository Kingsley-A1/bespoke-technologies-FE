import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientStory } from "./client-story";

describe("ClientStory", () => {
  it("renders nothing until real client stories are published", () => {
    const { container } = render(<ClientStory />);
    expect(container).toBeEmptyDOMElement();
  });
});
