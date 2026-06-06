/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardHeader } from './BoardHeader';

describe('BoardHeader', () => {
  it('Tika title is rendered', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tika' })).toBeInTheDocument();
  });

  it('"새 업무" button is rendered', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: '새 업무' })).toBeInTheDocument();
  });

  it('calls onCreateClick when "새 업무" is clicked', async () => {
    const user = userEvent.setup();
    const onCreateClick = jest.fn();

    render(<BoardHeader onCreateClick={onCreateClick} />);
    await user.click(screen.getByRole('button', { name: '새 업무' }));

    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('renders a disabled search input with placeholder', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);
    const search = screen.getByPlaceholderText('검색');

    expect(search).toBeDisabled();
  });
});
