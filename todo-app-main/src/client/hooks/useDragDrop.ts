'use client';

import { useState } from 'react';
import {
  type DragEndEvent,
  type DragStartEvent,
  type SensorDescriptor,
  type SensorOptions,
  type UniqueIdentifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { TICKET_STATUS, type TicketStatus } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import type { MoveTicketInput } from '@/shared/validations/ticket';

interface UseDragDropOptions {
  tickets: Ticket[];
  onMove:  (id: number, input: MoveTicketInput) => Promise<void>;
}

export function useDragDrop({ tickets, onMove }: UseDragDropOptions): {
  sensors:         SensorDescriptor<SensorOptions>[];
  activeTicket:    Ticket | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver:  () => void;
  handleDragEnd:   (event: DragEndEvent) => void;
} {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function findTicket(id: UniqueIdentifier) {
    return tickets.find((ticket) => String(ticket.id) === String(id));
  }

  function handleDragStart({ active }: DragStartEvent) {
    const ticket = findTicket(active.id);
    setActiveTicket(ticket ?? null);
  }

  function handleDragOver() {
    // Visual feedback handled by @dnd-kit internally via isOver on droppable
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTicket(null);
    if (!over) return;

    const dragged = findTicket(active.id);
    if (!dragged) return;

    // over.id is either a column id (TicketStatus) or a ticket id (number)
    const overId = over.id;
    const isColumn = (Object.values(TICKET_STATUS) as string[]).includes(String(overId));

    let targetStatus: TicketStatus;
    let targetPosition: number;

    if (isColumn) {
      targetStatus = overId as TicketStatus;
      const colTickets = tickets
        .filter((t) => t.status === targetStatus && t.id !== dragged.id)
        .sort((a, b) => a.position - b.position);
      targetPosition = colTickets.length + 1;
    } else {
      const overTicket = findTicket(overId);
      if (!overTicket || overTicket.id === dragged.id) return;
      targetStatus   = overTicket.status as TicketStatus;
      targetPosition = overTicket.position;
    }

    if (dragged.status === targetStatus && dragged.position === targetPosition) return;

    onMove(dragged.id, { status: targetStatus, position: targetPosition }).catch(() => {});
  }

  return { sensors, activeTicket, handleDragStart, handleDragOver, handleDragEnd };
}
