import type { Ticket } from '@/shared/types';
import { BoardContainer } from './BoardContainer';

interface BoardPageProps {
  initialTickets: Ticket[];
}

export function BoardPage({ initialTickets }: BoardPageProps) {
  return <BoardContainer initialData={initialTickets} />;
}
