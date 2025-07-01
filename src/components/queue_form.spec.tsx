import { test, expect, mock } from "bun:test";
import { render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QueueForm from "./queue_form.tsx";

const onSubmit = mock(() => {});

test("queue form validates", async () => {
  const user = userEvent.setup();

  render(<QueueForm onSubmit={onSubmit} />);

  // Don't validate until after edits
  expect(screen.queryByText("Required")).toBeNull();

  // Validate form when input leaves focus
  fireEvent.blur(screen.getByLabelText("Name *"));
  await screen.findByText("Required");

  // submit button
  expect(screen.getByText<HTMLButtonElement>("Join").disabled).toBeTrue();
  fireEvent.click(screen.getByText("Join"));
  expect(onSubmit).not.toHaveBeenCalled();

  // Valid input
  await user.type(screen.getByLabelText("Name *"), "John Doe");
  const helperText = screen.queryByText("Required");
  expect(helperText).toBeNull();

  // Submit
  expect(screen.getByText<HTMLButtonElement>("Join").disabled).toBeFalse();
  await user.click(screen.getByText("Join"));
  expect(onSubmit).toHaveBeenCalledTimes(1);
});
