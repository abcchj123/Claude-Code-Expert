/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/client/components/ui/Button';

describe('Button', () => {
  // ── children ───────────────────────────────────────────────────────────────
  describe('children', () => {
    it('children이 렌더링된다', () => {
      render(<Button>저장</Button>);
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });

    it('텍스트가 아닌 children도 렌더링된다', () => {
      render(
        <Button>
          <span data-testid="icon">★</span> 저장
        </Button>,
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  // ── 기본값 ─────────────────────────────────────────────────────────────────
  describe('기본값', () => {
    it('variant 기본값은 primary이다', () => {
      render(<Button>버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('size 기본값은 md이다', () => {
      render(<Button>버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-md');
    });

    it('type 기본값은 "button"이다', () => {
      render(<Button>버튼</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });

  // ── variant ────────────────────────────────────────────────────────────────
  describe('variant', () => {
    it('variant="primary" → btn-primary 클래스', () => {
      render(<Button variant="primary">저장</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('variant="secondary" → btn-secondary 클래스', () => {
      render(<Button variant="secondary">취소</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('variant="ghost" → btn-ghost 클래스', () => {
      render(<Button variant="ghost">닫기</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-ghost');
    });

    it('variant="danger" → btn-danger 클래스', () => {
      render(<Button variant="danger">삭제</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });
  });

  // ── size ───────────────────────────────────────────────────────────────────
  describe('size', () => {
    it('size="sm" → btn-sm 클래스', () => {
      render(<Button size="sm">버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-sm');
    });

    it('size="md" → btn-md 클래스', () => {
      render(<Button size="md">버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-md');
    });

    it('size="lg" → btn-lg 클래스', () => {
      render(<Button size="lg">버튼</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-lg');
    });
  });

  // ── onClick ────────────────────────────────────────────────────────────────
  describe('onClick', () => {
    it('클릭 시 onClick이 호출된다', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Button onClick={onClick}>클릭</Button>);
      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // ── isLoading ──────────────────────────────────────────────────────────────
  describe('isLoading', () => {
    it('isLoading=true이면 버튼이 비활성화된다', () => {
      render(<Button isLoading>저장</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('isLoading=true이면 "처리중..." 텍스트가 표시된다', () => {
      render(<Button isLoading>저장</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('처리중...');
    });

    it('isLoading=true이면 클릭해도 onClick이 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <Button isLoading onClick={onClick}>
          저장
        </Button>,
      );
      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('isLoading=true이면 aria-busy="true"가 적용된다', () => {
      render(<Button isLoading>저장</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('isLoading=false이면 aria-busy 속성이 없다', () => {
      render(<Button>저장</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });
  });
});
