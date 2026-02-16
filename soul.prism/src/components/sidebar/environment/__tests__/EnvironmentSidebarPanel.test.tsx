import { render, screen, fireEvent } from "@testing-library/react";
import EnvSidebarClient from "../EnvironmentSidebarPanel";
import userEvent from "@testing-library/user-event";
import { EnvironmentProvider } from "@/components/context/EnvironmentContext";

const baseEnvironments = [
  {
    id: "1",
    name: "Production",
    workspace_id: "ws_01",
    created_at: new Date().toISOString(),
    variables: [
      {
        id: "v1",
        key: "API_URL",
        value: "https://api.trace.com",
        enabled: true,
      },
      {
        id: "v2",
        key: "DB_KEY",
        value: "secret_hash_123",
        enabled: true,
        secret: true,
      },
    ],
  },
  {
    id: "2",
    name: "Development",
    workspace_id: "ws_01",
    created_at: new Date().toISOString(),
    variables: [
      {
        id: "v3",
        key: "API_URL",
        value: "https://staging.trace.com",
        enabled: true,
      },
    ],
  },
];

export function renderWithProviders(ui: React.ReactElement) {
  return render(<EnvironmentProvider>{ui}</EnvironmentProvider>);
}

jest.mock("lucide-react", () => ({
  Settings2: () => <span data-testid="settings-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Star: () => <span data-testid="star-icon" />,
}));

jest.mock("../../../editors/KeyValueEditor", () => ({
  __esModule: true,

  KeyValueEditor: ({ onChange }: any) => (
    <button
      data-testid="mock-kv-editor"
      onClick={() =>
        onChange([
          {
            id: "v1",
            key: "API_KEY",
            value: "123",
            enabled: true,
          },
        ])
      }
    >
      Mock Editor
    </button>
  ),

  KeyValueRow: {},
}));

jest.mock("@/stores/useSelectionStore", () => ({
  useSelectionStore: jest.fn(),
}));

import { useSelectionStore } from "@/stores/useSelectionStore";
const mockedUseSelectionStore = jest.mocked(useSelectionStore);

const mockWorkspace = {
  id: "ws_01",
  name: "Workspace 1",
  users: [],
  created_at: "2026-02-09 05:10:51.145",
  created_by: "user_1",
};

beforeEach(() => {
  mockedUseSelectionStore.mockImplementation((selector: any) =>
    selector({
      workspace: mockWorkspace,
    }),
  );
});

describe("EnvSidebarClient", () => {
  beforeEach(() => {
    jest.spyOn(global.crypto, "randomUUID").mockReturnValue("new-env-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing when given nothing", () => {
    renderWithProviders(<EnvSidebarClient initialEnvironments={[]} />);

    expect(screen.getByText("No environments set")).toBeInTheDocument();
  });

  it("displays new environment creation popup when + is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<EnvSidebarClient initialEnvironments={[]} />);

    const createButton = screen.getByRole("button", { name: /add/i });

    await user.click(createButton);

    expect(screen.getByText("Env Editor")).toBeInTheDocument();
  });

  it("opens modal when environment is clicked", () => {
    renderWithProviders(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />,
    );

    fireEvent.click(screen.getByText("Development"));

    expect(screen.getByDisplayValue("Development")).toBeInTheDocument();
  });

  it("deletes an environment", () => {
    renderWithProviders(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />,
    );

    const deleteButtons = screen.getAllByTestId("trash-icon");

    fireEvent.click(deleteButtons[1]);

    expect(screen.queryByText("Development")).not.toBeInTheDocument();
  });

  it("updates variables and saves changes", () => {
    renderWithProviders(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />,
    );

    fireEvent.click(screen.getByText("Development"));

    // Simulate variable update via mocked editor
    fireEvent.click(screen.getByTestId("mock-kv-editor"));

    fireEvent.click(screen.getByText("Save"));

    // Re-open environment and verify variable count updated
    fireEvent.click(screen.getByText("Development"));

    expect(screen.getByText("1 Variables")).toBeInTheDocument();
  });

  it("cancels editing without saving", () => {
    renderWithProviders(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />,
    );

    fireEvent.click(screen.getByText("Development"));

    fireEvent.change(screen.getByDisplayValue("Development"), {
      target: { value: "Dev Changed" },
    });

    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByDisplayValue("Dev Changed")).not.toBeInTheDocument();

    expect(screen.getByText("Development")).toBeInTheDocument();
  });
});
