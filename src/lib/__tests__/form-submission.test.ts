import { describe, expect, it, vi } from "vitest";

import { captureSubmittedForm } from "@/lib/form-submission";

describe("captureSubmittedForm", () => {
  it("keeps a stable form reference after the submit event currentTarget is cleared", () => {
    const form = { reset: vi.fn() } as unknown as HTMLFormElement;
    const formData = {} as FormData;
    const event = { currentTarget: form as HTMLFormElement | null };

    const submission = captureSubmittedForm(event.currentTarget!, () => formData);
    event.currentTarget = null;

    submission.form.reset();

    expect(submission.form).toBe(form);
    expect(submission.formData).toBe(formData);
    expect(form.reset).toHaveBeenCalledOnce();
  });
});
