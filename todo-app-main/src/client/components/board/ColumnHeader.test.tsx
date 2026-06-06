/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ColumnHeader } from './ColumnHeader';

describe('ColumnHeader', () => {
  it('title prop 텍스트가 렌더링된다', () => {
    render(<ColumnHeader title="TODO" count={3} />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('count prop 숫자가 뱃지로 렌더링된다', () => {
    render(<ColumnHeader title="TODO" count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('count=0 → "0"이 표시된다', () => {
    render(<ColumnHeader title="TODO" count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('heading level 2로 렌더링된다', () => {
    render(<ColumnHeader title="In Progress" count={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'In Progress' })).toBeInTheDocument();
  });
});
