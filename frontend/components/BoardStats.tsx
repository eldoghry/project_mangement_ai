"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import { getListColumnTheme } from "@/lib/listColumnTheme";

export function BoardStats() {
  const lists = useBoardStore((s) => s.lists);

  const stats = useMemo(() => {
    const total = lists.reduce((n, l) => n + l.tasks.length, 0);
    const byId = Object.fromEntries(lists.map((l) => [l.id, l.tasks.length]));

    const done = byId["done"] ?? 0;
    const backlog = byId["backlog"] ?? 0;
    const todo = byId["todo"] ?? 0;
    const inProgress = byId["in-progress"] ?? 0;
    const review = byId["review"] ?? 0;

    const pipeline = todo + inProgress + review;
    const completionPct =
      total === 0 ? null : Math.round((done / total) * 100);

    let busiest: { id: string; title: string; count: number } | null = null;
    for (const l of lists) {
      const c = l.tasks.length;
      if (!busiest || c > busiest.count)
        busiest = { id: l.id, title: l.title, count: c };
    }

    const emptyColumns = lists.filter((l) => l.tasks.length === 0).length;
    const withDescription = lists.reduce(
      (n, l) => n + l.tasks.filter((t) => t.description.trim()).length,
      0,
    );

    return {
      total,
      lists,
      done,
      backlog,
      pipeline,
      completionPct,
      busiest,
      emptyColumns,
      withDescription,
    };
  }, [lists]);

  const doneInsight = getListColumnTheme("done").insightAccent;
  const backlogInsight = getListColumnTheme("backlog").insightAccent;
  const pipelineInsight = getListColumnTheme("in-progress").insightAccent;
  const reviewInsight = getListColumnTheme("review").insightAccent;

  return (
    <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:max-w-[min(100%,520px)] sm:items-end">
      <div className="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums text-[#0F172A]">
          {stats.total}
        </span>
        <span className="text-sm text-[#64748B]">tasks total</span>
      </div>

      <div className="flex flex-wrap justify-end gap-1.5">
        {stats.lists.map((list) => {
          const t = getListColumnTheme(list.id);
          return (
            <span
              key={list.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-[#0F172A] ${t.statsPill}`}
              title={`${list.title}: ${list.tasks.length} tasks`}
            >
              <span className="max-w-[7rem] truncate font-medium">{list.title}</span>
              <span className={`tabular-nums font-semibold ${t.statsPillCount}`}>
                {list.tasks.length}
              </span>
            </span>
          );
        })}
      </div>

      <ul className="space-y-1 text-right text-xs text-[#64748B]">
        {stats.total === 0 ? (
          <li>Add tasks to see pipeline and completion stats.</li>
        ) : (
          <>
            {stats.completionPct !== null && (
              <li>
                <span className={`font-semibold ${doneInsight}`}>
                  {stats.completionPct}%
                </span>{" "}
                complete (
                <span className={`font-semibold ${doneInsight}`}>{stats.done}</span>{" "}
                in Done)
              </li>
            )}
            <li>
              <span className={`font-semibold ${pipelineInsight}`}>
                {stats.pipeline}
              </span>{" "}
              in pipeline (Todo + In progress + Review)
            </li>
            <li>
              <span className={`font-semibold ${backlogInsight}`}>{stats.backlog}</span>{" "}
              in backlog
            </li>
            {stats.busiest && stats.busiest.count > 0 && (
              <li>
                Busiest column:{" "}
                <span
                  className={`font-semibold ${getListColumnTheme(stats.busiest.id).insightAccent}`}
                >
                  {stats.busiest.title}
                </span>{" "}
                (
                <span
                  className={`font-semibold ${getListColumnTheme(stats.busiest.id).insightAccent}`}
                >
                  {stats.busiest.count}
                </span>
                )
              </li>
            )}
            {stats.emptyColumns > 0 && (
              <li>
                {stats.emptyColumns} empty column{stats.emptyColumns === 1 ? "" : "s"}
              </li>
            )}
            <li>
              <span className={`font-semibold ${reviewInsight}`}>
                {stats.withDescription}
              </span>{" "}
              task{stats.withDescription === 1 ? "" : "s"} with a description
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
