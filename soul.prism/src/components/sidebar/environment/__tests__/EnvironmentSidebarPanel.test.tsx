import { render, screen, fireEvent } from "@testing-library/react"
import EnvSidebarClient from "../EnvironmentSidebarPanel"
import userEvent from "@testing-library/user-event"

const baseEnvironments = [
    {
      id: '1',
      name: 'Production',
      workspace_id: 'ws_01',
      created_at: new Date().toISOString(),
      variables: [
        { id: 'v1', key: 'API_URL', value: 'https://api.trace.com', enabled: true },
        { id: 'v2', key: 'DB_KEY', value: 'secret_hash_123', enabled: true, secret: true }
      ]
    },
    {
      id: '2',
      name: 'Development',
      workspace_id: 'ws_01',
      created_at: new Date().toISOString(),
      variables: [
        { id: 'v3', key: 'API_URL', value: 'https://staging.trace.com', enabled: true }
      ]
    },
]

jest.mock('lucide-react', () => ({
  Settings2: () => <span data-testid="settings-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
}));

jest.mock('../../../editors/KeyValueEditor', () => ({
  KeyValueEditor: ({ onChange }: any) => (
    <button
      data-testid="mock-kv-editor"
      onClick={() =>
        onChange([
          {
            id: 'v1',
            key: 'API_KEY',
            value: '123',
            enabled: true,
          },
        ])
      }
    >
      Mock Editor
    </button>
  ),
}));


describe('EnvSidebarClient', () => {

    beforeEach(() => {
        jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('new-env-id');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


  it('renders nothing when given nothing', () => {
    render(
        <EnvSidebarClient initialEnvironments={[]} />
    )

    expect(screen.getByText('No environments set')).toBeInTheDocument()
    }
  )

  it('displays new environment creation popup when + is clicked', async () => {
    
    const user = userEvent.setup();

    render(
        <EnvSidebarClient initialEnvironments={[]} />
    )

    const createButton = screen.getByRole('button', {name: /add/i});

    await user.click(createButton);

    expect(screen.getByText('Env Editor')).toBeInTheDocument()

  })

  
  it('opens modal when environment is clicked', () => {
    render(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />
    );

    fireEvent.click(screen.getByText('Development'));

    expect(
      screen.getByDisplayValue('Development')
    ).toBeInTheDocument();
  });

  it('deletes an environment', () => {
    render(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />
    );

    const deleteButtons =
      screen.getAllByTestId('trash-icon');

    fireEvent.click(deleteButtons[1]);

    expect(
      screen.queryByText('Development')
    ).not.toBeInTheDocument();
  });

  it('updates variables and saves changes', () => {
    render(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />
    );

    fireEvent.click(screen.getByText('Development'));

    // Simulate variable update via mocked editor
    fireEvent.click(
      screen.getByTestId('mock-kv-editor')
    );

    fireEvent.click(screen.getByText('Save'));

    // Re-open environment and verify variable count updated
    fireEvent.click(screen.getByText('Development'));

    expect(
      screen.getByText('1 Variables')
    ).toBeInTheDocument();
  });

  it('cancels editing without saving', () => {
    render(
      <EnvSidebarClient initialEnvironments={baseEnvironments} />
    );

    fireEvent.click(screen.getByText('Development'));

    fireEvent.change(
      screen.getByDisplayValue('Development'),
      { target: { value: 'Dev Changed' } }
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(
      screen.queryByDisplayValue('Dev Changed')
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('Development')
    ).toBeInTheDocument();
  });
}
)