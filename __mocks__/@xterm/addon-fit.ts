/**
 * Mock for @xterm/addon-fit module
 * Used for testing terminal fit addon without browser dependencies
 */

export class FitAddon {
  private _terminal: { resize: (cols: number, rows: number) => void; element?: HTMLElement } | null = null;

  activate(terminal: { resize: (cols: number, rows: number) => void; element?: HTMLElement }): void {
    this._terminal = terminal;
  }

  dispose(): void {
    this._terminal = null;
  }

  fit(): void {
    if (!this._terminal) return;

    // Mock fit - just emit a resize event
    const proposeDimensions = this.proposeDimensions();
    if (proposeDimensions) {
      this._terminal.resize(proposeDimensions.cols, proposeDimensions.rows);
    }
  }

  proposeDimensions(): { cols: number; rows: number } | undefined {
    if (!this._terminal || !this._terminal.element) {
      return undefined;
    }

    // Return mock dimensions
    return {
      cols: 80,
      rows: 24,
    };
  }
}

export default FitAddon;
