'use client';

import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import { TicketModal } from '@/client/components/ticket/TicketModal';
import { withMeta } from '@/client/utils/ticketMeta';
import { useDragDrop } from '@/client/hooks/useDragDrop';
import { useTickets } from '@/client/hooks/useTickets';
import { Header } from '@/client/components/layout/Header';
import { TICKET_STATUS } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';
import { BacklogSidebar } from './BacklogSidebar';
import { KanbanBoard } from './KanbanBoard';

interface BoardPageProps {
  initialTickets: Ticket[];
}

export function BoardPage({ initialTickets }: BoardPageProps) {
  const { tickets, boardColumns, createTicket, updateTicket, deleteTicket, moveTicket, error } =
    useTickets(initialTickets);

  const [modalMode,     setModalMode]     = useState<'create' | 'edit' | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const { sensors, activeTicket, handleDragStart, handleDragOver, handleDragEnd } = useDragDrop({
    tickets,
    onMove: moveTicket,
  });

  function openCreate() {
    setEditingTicket(null);
    setModalMode('create');
  }

  function openEdit(id: number) {
    const t = tickets.find((x) => x.id === id) ?? null;
    setEditingTicket(t);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingTicket(null);
  }

  async function handleSubmit(data: CreateTicketInput | UpdateTicketInput) {
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createTicket(data as CreateTicketInput);
      } else if (modalMode === 'edit' && editingTicket) {
        await updateTicket(editingTicket.id, data as UpdateTicketInput);
      }
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  }

  const backlogTickets = boardColumns[TICKET_STATUS.BACKLOG] ?? [];
  const boardTickets   = tickets.filter((t) => t.status !== TICKET_STATUS.BACKLOG);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-background)]">
      <Header onNewTicket={() => openCreate()} />

      {error && (
        <div className="bg-[var(--color-priority-high)] px-6 py-2 text-sm text-white">{error}</div>
      )}

      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <BacklogSidebar
            tickets={backlogTickets}
            onTicketEdit={openEdit}
            onTicketDelete={deleteTicket}
            onAddTicket={openCreate}
          />
          <KanbanBoard
            tickets={boardTickets}
            onTicketEdit={openEdit}
            onTicketDelete={deleteTicket}
            onAddTicket={openCreate}
          />
          <DragOverlay>
            {activeTicket && (
              <TicketCard
                ticket={withMeta(activeTicket)}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {modalMode && (
        <TicketModal
          mode={modalMode}
          ticket={editingTicket ?? undefined}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
