import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyValueEditor, KeyValueRow } from "../KeyValueEditor";

const baseRows: KeyValueRow[] = [
  {
    id: "1",
    key: "API_KEY",
    value: "secret",
    enabled: true,
    secret: true,
  },
  {
    id: "2",
    key: "TIMEOUT",
    value: "5000",
    enabled: true,
  },
];

describe("KeyValueEditor", () => {
  it("renders empty state when no rows are provided", () => {
    render(
      <KeyValueEditor
        rows={[]}
        onChange={jest.fn()}
        emptyState="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders provided rows", () => {
    render(<KeyValueEditor rows={baseRows} onChange={jest.fn()} />);

    expect(screen.getByDisplayValue("API_KEY")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TIMEOUT")).toBeInTheDocument();
  });

  it("adds a new row when add button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<KeyValueEditor rows={[]} onChange={onChange} allowAdd />);

    const addButton = screen.getByRole("button");
    await user.click(addButton);

    const updatedRows = onChange.mock.calls[0][0];
    expect(updatedRows).toHaveLength(1);
    expect(updatedRows[0]).toMatchObject({
      key: "",
      value: "",
      enabled: true,
    });
  });

  it("deletes a row when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<KeyValueEditor rows={baseRows} onChange={onChange} allowDelete />);

    const deleteButtons = screen.getAllByRole("button");
    await user.click(deleteButtons[deleteButtons.length - 1]);

    const updatedRows = onChange.mock.calls[0][0];
    expect(updatedRows).toHaveLength(1);
    expect(updatedRows[0].id).toBe("1");
  });

  it("toggles enabled state when allowToggle is enabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<KeyValueEditor rows={baseRows} onChange={onChange} allowToggle />);

    const checkbox = screen.getAllByRole("checkbox")[0];
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    const updatedRows = onChange.mock.calls[0][0];
    expect(updatedRows[0].enabled).toBe(false);
  });

  it("masks secret values by default", () => {
    render(<KeyValueEditor rows={baseRows} onChange={jest.fn()} />);

    const input = screen.getByDisplayValue("secret");
    expect(input).toHaveAttribute("type", "password");
  });

  it("reveals secret value when eye icon is clicked", async () => {
    const user = userEvent.setup();

    render(<KeyValueEditor rows={baseRows} onChange={jest.fn()} />);

    const toggleButton = screen.getByRole("button", { hidden: true });
    await user.click(toggleButton);

    const input = screen.getByDisplayValue("secret");
    expect(input).toHaveAttribute("type", "text");
  });

  it("disables editing in view mode", () => {
    render(<KeyValueEditor rows={baseRows} onChange={jest.fn()} mode="view" />);

    expect(screen.getByDisplayValue("API_KEY")).toBeDisabled();
    expect(screen.getByDisplayValue("secret")).toBeDisabled();
  });

  it("shows validation errors when validators return errors", () => {
    render(
      <KeyValueEditor
        rows={baseRows}
        onChange={jest.fn()}
        validateKey={() => "Invalid key"}
        validateValue={() => "Invalid value"}
      />,
    );

    // We assert by style change, not text, since errors are visual-only
    const keyInput = screen.getByDisplayValue("API_KEY");
    const valueInput = screen.getByDisplayValue("secret");

    expect(keyInput.className).toMatch(/error/);
    expect(valueInput.className).toMatch(/error/);
  });
});
