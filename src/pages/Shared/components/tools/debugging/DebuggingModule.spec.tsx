import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MatchRule from './MatchRule';
import ReplaceRule from './ReplaceRule';
import RuleComponent from './RuleComponent';
import DebuggingModuleComponent from './DebuggingModuleComponent';
import AppStateContext from '../../../contexts/appStateContext';
import { STORE_RULES_TOGGLE } from '../../../constants';

vi.mock('../../../../Shared/utils', async () => {
  const actual = await vi.importActual<any>('../../../../Shared/utils');
  return {
    ...actual,
    getTabId: vi.fn().mockResolvedValue(1),
    sendChromeTabsMessage: vi.fn(),
  };
});

describe('DebuggingModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key, cb) => cb({ [STORE_RULES_TOGGLE]: false })),
          set: vi.fn((data, cb) => cb && cb()),
        },
      },
      scripting: {
        executeScript: vi.fn().mockImplementation((opts) => {
          if (typeof opts?.func === 'function') {
            const mockSessionStorage = {
              getItem: vi.fn().mockReturnValue(JSON.stringify({ enabled: false, intercept: [] })),
              setItem: vi.fn(),
            };
            (global as any).sessionStorage = mockSessionStorage;
            opts.func('pbjs', { enabled: true });
          }
          return Promise.resolve([{ result: null }]);
        }),
      },
    } as any;
  });

  describe('Subcomponents', () => {
    it('renders MatchRule component with events and handles add/delete rule and target change', () => {
      const mockRule: any = { when: { adUnitCode: 'slot-1', bidder: 'rubicon' }, then: { cpm: 10 } };
      const mockPrebid: any = {
        events: [
          {
            args: {
              adUnitCodes: ['slot-1', 'slot-2'],
              adUnits: [{ mediaTypes: { banner: {} }, bids: [{ bidder: 'rubicon' }] }],
            },
          },
        ],
      };
      const handleRulesFormChange = vi.fn();

      const { container } = render(<MatchRule groupIndex={1} rule={mockRule} ruleKey="adUnitCode" prebid={mockPrebid} handleRulesFormChange={handleRulesFormChange} path={['intercept', '0', 'when', 'adUnitCode']} />);

      expect(screen.getByText('and')).toBeTruthy();
      expect(screen.getByLabelText('MatchRule Target')).toBeTruthy();

      const deleteBtn = container.querySelector('[data-testid="DeleteForeverIcon"]');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        expect(handleRulesFormChange).toHaveBeenCalled();
      }
    });

    it('adds match rule when AddIcon is clicked', () => {
      const mockRule: any = { when: { adUnitCode: 'slot-1' }, then: { cpm: 10 } };
      const handleRulesFormChange = vi.fn();

      const { container } = render(<MatchRule groupIndex={0} rule={mockRule} ruleKey="adUnitCode" prebid={{ events: [] }} handleRulesFormChange={handleRulesFormChange} path={['intercept', '0', 'when', 'adUnitCode']} />);

      const addBtn = container.querySelector('[data-testid="AddIcon"]');
      if (addBtn) {
        fireEvent.click(addBtn);
        expect(handleRulesFormChange).toHaveBeenCalled();
      }
    });

    it('renders ReplaceRule component and handles rule changes, add, and delete', () => {
      const mockRule: any = { when: { adUnitCode: 'slot-1' }, then: { cpm: 10, mediaType: 'banner' } };
      const handleRulesFormChange = vi.fn();

      const { container } = render(<ReplaceRule groupIndex={1} rule={mockRule} ruleKey="cpm" handleRulesFormChange={handleRulesFormChange} path={['intercept', '0', 'then', 'cpm']} />);

      expect(screen.getByText('and')).toBeTruthy();
      expect(screen.getByLabelText('Replace-Rule Value')).toBeTruthy();

      const valInput = screen.getByDisplayValue('10');
      fireEvent.change(valInput, { target: { value: '15' } });
      expect(handleRulesFormChange).toHaveBeenCalled();

      const select = container.querySelector('select');
      if (select) {
        fireEvent.change(select, { target: { value: 'dealId' } });
        expect(handleRulesFormChange).toHaveBeenCalled();
      }

      const addBtn = container.querySelector('[data-testid="AddIcon"]');
      if (addBtn) {
        fireEvent.click(addBtn);
        expect(handleRulesFormChange).toHaveBeenCalled();
      }

      const deleteForeverBtn = container.querySelector('[data-testid="DeleteForeverIcon"]');
      if (deleteForeverBtn) {
        fireEvent.click(deleteForeverBtn);
        expect(handleRulesFormChange).toHaveBeenCalled();
      }
    });

    it('renders ReplaceRule with mediaType select', () => {
      const mockRule: any = {
        when: { adUnitCode: 'slot-1' },
        then: { mediaType: 'banner', cpm: 5 },
      };
      const handleRulesFormChange = vi.fn();

      render(<ReplaceRule groupIndex={0} rule={mockRule} ruleKey="mediaType" handleRulesFormChange={handleRulesFormChange} path={['intercept', '0', 'then', 'mediaType']} />);

      expect(screen.getByText('Replace-Rule Target')).toBeTruthy();
    });

    it('renders ReplaceRule with native subkey', () => {
      const mockRule: any = {
        when: { adUnitCode: 'slot-1' },
        then: { mediaType: 'native', native: { clickUrl: 'https://test.com' } },
      };
      const handleRulesFormChange = vi.fn();

      render(<ReplaceRule groupIndex={0} rule={mockRule} ruleKey="clickUrl" handleRulesFormChange={handleRulesFormChange} path={['intercept', '0', 'then', 'native', 'clickUrl']} />);

      expect(screen.getByDisplayValue('https://test.com')).toBeTruthy();
    });

    it('renders RuleComponent and handles rule interactions', () => {
      const mockRuleGroup: any = { when: { adUnitCode: 'slot-1' }, then: { cpm: 10 } };
      const handleRulesFormChange = vi.fn();
      const removeRule = vi.fn();

      render(<RuleComponent rule={mockRuleGroup} ruleIndex={0} prebid={{ events: [] }} handleRulesFormChange={handleRulesFormChange} removeRule={removeRule} />);

      expect(screen.getByText('Rule #1')).toBeTruthy();
      expect(screen.getByText('WHEN (Match Request)')).toBeTruthy();
      expect(screen.getByText('THEN (Mock Bid Response)')).toBeTruthy();

      const deleteBtn = screen.getByTitle('Delete rule');
      fireEvent.click(deleteBtn);
      expect(removeRule).toHaveBeenCalled();
    });

    it('renders RuleComponent with native mock response', () => {
      const mockRuleGroup: any = {
        when: { adUnitCode: 'slot-1' },
        then: { mediaType: 'native', native: { title: 'Test Title', body: 'Test Body' } },
      };
      const handleRulesFormChange = vi.fn();
      const removeRule = vi.fn();

      render(<RuleComponent rule={mockRuleGroup} ruleIndex={0} prebid={{ events: [] }} handleRulesFormChange={handleRulesFormChange} removeRule={removeRule} />);

      expect(screen.getByText('Rule #1')).toBeTruthy();
      expect(screen.getByDisplayValue('Test Title')).toBeTruthy();
      expect(screen.getByDisplayValue('Test Body')).toBeTruthy();
    });
  });

  describe('DebuggingModuleComponent', () => {
    const mockContext: any = {
      prebid: { events: [] },
      pbjsNamespace: 'pbjs',
    };

    const renderWithContext = (contextOverrides: any = {}) => {
      return render(
        <AppStateContext.Provider value={{ ...mockContext, ...contextOverrides }}>
          <DebuggingModuleComponent />
        </AppStateContext.Provider>
      );
    };

    it('renders header, master switches, and empty state', () => {
      renderWithContext();
      expect(screen.getByText(/Prebid.js Debugging Module/i)).toBeTruthy();
      expect(screen.getByText(/Enable Rule Interceptor/i)).toBeTruthy();
      expect(screen.getByText(/Verbose Console Logs/i)).toBeTruthy();
      expect(screen.getByText(/Persist Rules in Local Storage/i)).toBeTruthy();
      expect(screen.getByText(/No active debug rules configured/i)).toBeTruthy();
    });

    it('toggles Enable Rule Interceptor switch', async () => {
      renderWithContext();
      const enableSwitch = screen.getByLabelText(/Enable Rule Interceptor/i);
      await act(async () => {
        fireEvent.click(enableSwitch);
      });
      expect(global.chrome.scripting.executeScript).toHaveBeenCalled();
    });

    it('toggles Verbose Console Logs switch', async () => {
      renderWithContext();
      const loggingSwitch = screen.getByLabelText(/Verbose Console Logs/i);
      await act(async () => {
        fireEvent.click(loggingSwitch);
      });
      expect(global.chrome.scripting.executeScript).toHaveBeenCalled();
    });

    it('toggles Persist Rules in Local Storage switch', async () => {
      renderWithContext();
      const persistSwitch = screen.getByLabelText(/Persist Rules in Local Storage/i);
      await act(async () => {
        fireEvent.click(persistSwitch);
      });
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith({ [STORE_RULES_TOGGLE]: true }, expect.any(Function));
    });

    it('adds a custom intercept rule and tests form modification and deletion', async () => {
      renderWithContext();
      const addBtn = screen.getByRole('button', { name: /Add Custom Intercept Rule/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });
      expect(screen.getByText('Rule #1')).toBeTruthy();

      const deleteBtn = screen.getByTitle('Delete rule');
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      expect(screen.getByText(/No active debug rules configured/i)).toBeTruthy();
    });

    it('inserts a preset rule from template menu', async () => {
      renderWithContext();
      const presetBtn = screen.getByRole('button', { name: /Insert Preset Template/i });
      fireEvent.click(presetBtn);

      const highCpmOption = screen.getByText(/High CPM Winner/i);
      await act(async () => {
        fireEvent.click(highCpmOption);
      });

      expect(screen.getByText('Rule #1')).toBeTruthy();
      expect(screen.getByText(/Added preset rule:/i)).toBeTruthy();
    });

    it('exports rules to JSON and copies to clipboard', async () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      renderWithContext();

      const exportBtn = screen.getByTestId('FileDownloadIcon').closest('button')!;
      fireEvent.click(exportBtn);
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(screen.getByText('Debug rules exported as JSON!')).toBeTruthy();

      const copyBtn = screen.getByTestId('ContentCopyIcon').closest('button')!;
      fireEvent.click(copyBtn);
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText('Rules JSON copied to clipboard!')).toBeTruthy();
    });

    it('handles import file flow with valid and invalid JSON', async () => {
      const { container } = renderWithContext();
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      const createFileReader = (resultText: string) => {
        class MockFileReader {
          onload: ((e: any) => void) | null = null;
          readAsText() {
            if (this.onload) {
              this.onload({ target: { result: resultText } });
            }
          }
        }
        (window as any).FileReader = MockFileReader;
      };

      createFileReader(JSON.stringify({ enabled: true, intercept: [{ when: {}, then: { cpm: 5 } }] }));
      const file = new File(['{}'], 'rules.json', { type: 'application/json' });
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      expect(screen.getByText(/Successfully imported 1 rule/i)).toBeTruthy();

      createFileReader(JSON.stringify([{ when: { bidder: 'rubicon' }, then: { cpm: 12 } }]));
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      expect(screen.getByText(/Successfully imported 1 rule/i)).toBeTruthy();

      createFileReader(JSON.stringify({ someUnrecognizedKey: 123 }));
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      expect(screen.getByText('Invalid rules JSON format!')).toBeTruthy();

      createFileReader('not valid json');
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      expect(screen.getByText('Failed to parse JSON file!')).toBeTruthy();
    });

    it('persists rules to localStorage when storeRules is enabled', async () => {
      global.chrome.storage.local.get = vi.fn((key, cb) => cb({ [STORE_RULES_TOGGLE]: true }));

      renderWithContext();

      const addBtn = screen.getByRole('button', { name: /Add Custom Intercept Rule/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      expect(global.chrome.scripting.executeScript).toHaveBeenCalled();
    });

    it('handles error gracefully when initial state read fails', async () => {
      (global.chrome.scripting.executeScript as any).mockRejectedValueOnce(new Error('Tab closed'));

      renderWithContext();
    });

    it('loads initial state from storage on mount', async () => {
      const savedConfig = { enabled: true, intercept: [{ when: { adUnitCode: 'slot-1' }, then: { cpm: 25 } }] };
      (global.chrome.scripting.executeScript as any).mockResolvedValueOnce([{ result: JSON.stringify(savedConfig) }]);

      renderWithContext();

      await waitFor(() => {
        expect(screen.getByText('Rule #1')).toBeTruthy();
      });
    });
  });
});
