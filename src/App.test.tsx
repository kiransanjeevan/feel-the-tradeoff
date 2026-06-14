// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';

afterEach(cleanup);

// Smoke / integration tests: prove the React tree mounts and the core
// interactions wire through to the metrics core without runtime errors.
// (Charts render at 0×0 in jsdom — these tests check behavior, not pixels.)
describe('App smoke test', () => {
  it('mounts and renders the core UI', () => {
    render(<App />);
    expect(screen.getByText('Retrieval Metrics Lab')).toBeTruthy();
    expect(screen.getAllByText('Precision').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Recall').length).toBeGreaterThan(0);
    expect(screen.getByText('True Pos')).toBeTruthy();
    expect(screen.getByText('jump to cost-optimal')).toBeTruthy();
  });

  it('predict-then-reveal reveals the explanation on answer', () => {
    render(<App />);
    fireEvent.click(screen.getByText('It goes up'));
    expect(screen.getByText(/Usually right/)).toBeTruthy();
  });

  it('moving the threshold slider applies without crashing', () => {
    render(<App />);
    const slider = screen.getByLabelText('Score threshold') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0.95' } });
    expect(slider.value).toBe('0.95');
    // tree still intact after recompute
    expect(screen.getByText('True Pos')).toBeTruthy();
  });

  it('jump-to-cost-optimal moves the slider off its default', () => {
    render(<App />);
    const slider = screen.getByLabelText('Score threshold') as HTMLInputElement;
    fireEvent.click(screen.getByText('jump to cost-optimal'));
    // PM Compass has symmetric costs; optimal threshold is not 0.50 by default
    expect(slider.value).not.toBe('0.5');
  });

  it('switching scenarios updates the blurb', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Scenario'), { target: { value: 'medical-triage' } });
    expect(screen.getByText(/Flagging scans for disease/)).toBeTruthy();
  });

  it('F-beta buttons toggle the active optimization target', () => {
    render(<App />);
    fireEvent.click(screen.getByText('F2'));
    // the "jump to F2-best" button label should now reference F2
    expect(screen.getByText(/jump to F2-best/)).toBeTruthy();
  });

  it('CSV tab loads sample rows into the metrics', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Upload CSV'));
    fireEvent.click(screen.getByText('Try a sample'));
    expect(screen.getByText(/Loaded 10 rows/)).toBeTruthy();
  });

  it('embeddings tab renders the editor without loading the model', () => {
    // Importantly does NOT click "Embed & score" — that would download the
    // model in CI. We only verify the editor mounts.
    render(<App />);
    fireEvent.click(screen.getByText('Live embeddings'));
    expect(screen.getByText('Embed & score')).toBeTruthy();
    expect(screen.getByDisplayValue('How do I reset my password?')).toBeTruthy();
  });
});
