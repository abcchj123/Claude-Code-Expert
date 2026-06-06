import { ticketService } from '@/server/services/ticketService';
import { BoardContainer } from '@/client/components/board/BoardContainer';

export default async function Page() {
  const initialData = await ticketService.getBoard();
  return <BoardContainer initialData={initialData} />;
}
