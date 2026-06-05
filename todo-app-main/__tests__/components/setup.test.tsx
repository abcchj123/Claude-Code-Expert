import { render, screen } from '@testing-library/react';
import { TICKET_STATUS } from '@/shared/constants/columns';

function Badge({ label }: { label: string }) {
  return <span role="status">{label}</span>;
}

describe('Jest 환경 구성 확인', () => {
  it('RTL로 컴포넌트를 렌더링할 수 있어야 한다', () => {
    render(<Badge label="BACKLOG" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('@testing-library/jest-dom 매처가 동작해야 한다', () => {
    render(<Badge label="BACKLOG" />);
    expect(screen.getByRole('status')).toHaveTextContent('BACKLOG');
    expect(screen.getByRole('status')).toBeVisible();
  });

  it('@/ 경로 별칭이 src/를 가리켜야 한다', () => {
    expect(TICKET_STATUS.BACKLOG).toBe('BACKLOG');
    expect(TICKET_STATUS.TODO).toBe('TODO');
  });
});
