"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useBoardStore } from "@/store/boardStore";
import { ListColumn } from "@/components/ListColumn";

function resolveListIdFromOver(
  overId: string,
  overData: Record<string, unknown> | undefined,
  listIds: string[],
): string | null {
  const data = overData as
    | { type?: string; listId?: string; sortable?: { containerId?: string } }
    | undefined;
  if (data?.type === "column" && data.listId) return data.listId;
  if (data?.sortable?.containerId) return data.sortable.containerId;
  if (overId.startsWith("drop-")) {
    const id = overId.slice("drop-".length);
    if (listIds.includes(id)) return id;
  }
  return null;
}

export function Board() {
  const lists = useBoardStore((s) => s.lists);
  const moveTaskOnDragEnd = useBoardStore((s) => s.moveTaskOnDragEnd);
  const listIds = lists.map((l) => l.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeData = active.data.current as
      | { listId?: string; sortable?: { containerId?: string } }
      | undefined;
    const activeListId =
      activeData?.sortable?.containerId ?? activeData?.listId ?? null;
    if (!activeListId) return;

    const overListId = resolveListIdFromOver(overId, over.data.current, listIds);
    if (!overListId) return;

    let effectiveOverId = overId;
    if (overId.startsWith("drop-")) {
      effectiveOverId = overListId;
    }

    moveTaskOnDragEnd({
      activeId,
      overId: effectiveOverId,
      activeListId,
      overListId,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <div className="kanban-scroll flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-2">
          {lists.map((list) => (
            <ListColumn key={list.id} list={list} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
