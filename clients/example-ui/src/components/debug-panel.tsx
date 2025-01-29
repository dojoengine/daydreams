import { CollapsibleJson } from './collapsible-json';

interface DebugPanelProps {
    state: Record<string, any>;
}

export function DebugPanel({ state }: DebugPanelProps) {
    return (
        <div className="p-4 space-y-4 bg-background/95 border-l border-border/50 w-[400px]">
            {/* État Zustand */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Zustand State</h3>
                    <span className="text-xs text-muted-foreground">
                        {Object.keys(state).length} properties
                    </span>
                </div>
                <div className="overflow-auto rounded border border-border/50 bg-background/50 p-2">
                    <CollapsibleJson data={state} />
                </div>
            </div>
        </div>
    );
} 