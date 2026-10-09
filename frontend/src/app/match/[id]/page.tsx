import { Suspense } from "react";
import MatchClient from "./MatchClient";

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          <p className="text-sm text-slate-400">Carregando sala de partida...</p>
        </div>
      }
    >
      <MatchClient params={params} />
    </Suspense>
  );
}
