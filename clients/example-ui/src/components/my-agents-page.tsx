import { useState, useEffect, ChangeEvent } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useOrchestrators } from "@/hooks/use-orchestrators";


export function MyAgentsPage() {
  const [newOrchestratorName, setNewOrchestratorName] = useState("");
  const { orchestrators, currentOrchestratorId, setCurrentOrchestratorId } = useAppStore();
  const { createOrchestrator, fetchOrchestrators } = useOrchestrators();

  useEffect(() => {
    fetchOrchestrators();
  }, [fetchOrchestrators]);

  const handleSelectOrchestrator = (orchId: string) => {
    setCurrentOrchestratorId(orchId);
  };

  const handleCreateOrchestrator = async () => {
    if (!newOrchestratorName.trim()) return;
    await createOrchestrator(newOrchestratorName);
    setNewOrchestratorName("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewOrchestratorName(e.target.value);
  };

  return (
    <>
      <div className="p-4">
        <div className="grid gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">My Orchestrators</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orchestrators.map(orch => (
                <div
                  key={orch.id}
                  onClick={() => handleSelectOrchestrator(orch.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors
                    ${currentOrchestratorId === orch.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-card hover:border-primary'}`}
                >
                  <h3 className="font-semibold">{orch.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentOrchestratorId === orch.id ? '(Selected)' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Create New Orchestrator</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOrchestratorName}
                onChange={handleInputChange}
                placeholder="Orchestrator name..."
                className="flex-1 px-4 py-2 rounded-lg border"
              />
              <button
                onClick={handleCreateOrchestrator}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 