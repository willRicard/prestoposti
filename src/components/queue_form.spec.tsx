import { test, expect, mock, beforeEach, afterEach } from "bun:test";
import { cleanup, render, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QueueForm from "./queue_form.tsx";
import {
  MIN_PARTY_SIZE,
  DEFAULT_PARTY_SIZE,
  SEAT_CAPACITY,
  type QueueItemData,
} from "../lib/constants.ts";

const onSubmit = mock(() => {});

beforeEach(() => {
  render(<QueueForm onSubmit={onSubmit} />);
});
afterEach(cleanup);

test("queue form validates", async () => {
  const user = userEvent.setup();

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
  expect(onSubmit.mock.calls[0] as QueueItemData[]).toEqual([
    {
      name: "John Doe",
      partySize: DEFAULT_PARTY_SIZE,
    },
  ]);
});

test("party size input", async () => {
  const user = userEvent.setup();

  const numberInput =
    await screen.findByLabelText<HTMLInputElement>("Party Size");
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE);

  // Increment with keyboard
  fireEvent.keyDown(numberInput, { key: "ArrowUp" });
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE + 1);

  const btnDecrement = screen.getByText("-");
  const btnIncrement = screen.getByText("+");

  // Increment with button
  fireEvent.click(btnIncrement);
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE + 2);

  // Decrement with keyboard
  fireEvent.keyDown(numberInput, { key: "ArrowDown" });
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE + 1);

  // Decrement with button
  fireEvent.click(btnDecrement);
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE);

  // Clear input should reset value
  user.clear(numberInput);
  fireEvent.blur(numberInput);
  expect(parseInt(numberInput.value)).toEqual(DEFAULT_PARTY_SIZE);

  // Direct input
  fireEvent.change(numberInput, {
    target: { value: MIN_PARTY_SIZE.toString() },
  });
  expect(numberInput.value).toEqual(MIN_PARTY_SIZE.toString());
  expect(parseInt(numberInput.value)).toEqual(MIN_PARTY_SIZE);

  // upper bound
  fireEvent.change(numberInput, {
    target: { value: (SEAT_CAPACITY + 1).toString() },
  });
  fireEvent.blur(numberInput);
  expect(parseInt(numberInput.value)).toEqual(SEAT_CAPACITY);

  // lower bound
  fireEvent.change(numberInput, {
    target: { value: (MIN_PARTY_SIZE - 1).toString() },
  });
  fireEvent.blur(numberInput);
  expect(parseInt(numberInput.value)).toEqual(MIN_PARTY_SIZE);

  // Min value
  fireEvent.click(btnDecrement);
  expect(parseInt(numberInput.value)).toEqual(MIN_PARTY_SIZE);

  // Max value
  fireEvent.change(numberInput, {
    target: { value: SEAT_CAPACITY.toString() },
  });
  fireEvent.blur(numberInput);
  expect(parseInt(numberInput.value)).toEqual(SEAT_CAPACITY);
  fireEvent.click(btnIncrement);
  expect(parseInt(numberInput.value)).toEqual(SEAT_CAPACITY);
});
