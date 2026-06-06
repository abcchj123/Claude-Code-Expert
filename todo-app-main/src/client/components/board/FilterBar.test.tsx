/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    activeFilter: 'all' as const,
    thisWeekCount: 3,
    overdueCount: 2,
    onFilterChange: jest.fn(),
  };

  it('renders "이번주 업무" button', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /이번주 업무/ })).toBeInTheDocument();
  });

  it('renders "일정초과" button', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /일정초과/ })).toBeInTheDocument();
  });

  it('shows counts for each filter', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /일정초과/ })).toHaveTextContent('2');
  });

  it('calls onFilterChange with clicked filter', async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();

    render(<FilterBar {...defaultProps} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole('button', { name: /이번주 업무/ }));

    expect(onFilterChange).toHaveBeenCalledWith('thisWeek');
  });

  it('toggles active filter back to all when clicked again', async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();

    render(
      <FilterBar
        {...defaultProps}
        activeFilter="overdue"
        onFilterChange={onFilterChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /일정초과/ }));

    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('applies active style to the active filter', () => {
    render(<FilterBar {...defaultProps} activeFilter="thisWeek" />);
    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveClass('active');
  });
});
