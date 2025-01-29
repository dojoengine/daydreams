import { useState } from 'react';

interface CollapsibleJsonProps {
    data: any;
    level?: number;
    isRoot?: boolean;
}

// Fonctions à exclure du state
const EXCLUDED_KEYS = new Set([
    'addMessage', 'toggleShowDebug', 'toggleTheme', 'clearMessages', 
    'setIsLoading', 'setOrchestrators', 'setCurrentOrchestratorId', 
    'setCurrentChatId', 'addOrchestrator', 'toggleDebug',
    'getMessagesForCurrentOrchestrator'
]);

export function CollapsibleJson({ data, level = 0, isRoot = true }: CollapsibleJsonProps) {
    const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

    const toggleCollapse = (key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const renderValue = () => {
        if (data === null) return <span className="text-red-500">null</span>;
        if (data === undefined) return <span className="text-gray-500">undefined</span>;

        const type = Array.isArray(data) ? 'array' : typeof data;

        switch (type) {
            case 'string':
                return <span className="text-green-500">"{data}"</span>;
            case 'number':
                return <span className="text-blue-500">{data}</span>;
            case 'boolean':
                return <span className="text-purple-500">{data.toString()}</span>;
            case 'object':
            case 'array': {
                const entries = Object.entries(data)
                    .filter(([key]) => !EXCLUDED_KEYS.has(key));

                const isArray = Array.isArray(data);
                const prefix = isArray ? '[' : '{';
                const suffix = isArray ? ']' : '}';

                if (entries.length === 0) {
                    return <span>{prefix}{suffix}</span>;
                }

                return (
                    <div className={isRoot ? '' : 'inline'}>
                        <span>{prefix}</span>
                        <div className={`${isRoot ? '' : 'ml-4'}`}>
                            {entries.map(([key, value], index) => {
                                const isCollapsible = typeof value === 'object' && value !== null;
                                const isKeyCollapsed = collapsedKeys.has(key);

                                return (
                                    <div key={key} className="whitespace-nowrap">
                                        <span 
                                            onClick={(e) => isCollapsible && toggleCollapse(key, e)}
                                            className={`${isCollapsible ? 'cursor-pointer hover:text-primary' : ''} inline-flex items-center gap-1`}
                                        >
                                            {isCollapsible && (
                                                <span className="text-xs select-none">
                                                    {isKeyCollapsed ? '▶' : '▼'}
                                                </span>
                                            )}
                                            <span className="text-yellow-500">
                                                {isArray ? '' : `"${key}"`}
                                            </span>
                                            {!isArray && <span>: </span>}
                                        </span>
                                        {!isKeyCollapsed && (
                                            <CollapsibleJson 
                                                data={value} 
                                                level={level + 1} 
                                                isRoot={false} 
                                            />
                                        )}
                                        {index < entries.length - 1 && ','}
                                    </div>
                                );
                            })}
                        </div>
                        <span>{suffix}</span>
                    </div>
                );
            }
            default:
                return String(data);
        }
    };

    return (
        <div className={`font-mono ${isRoot ? 'text-sm' : 'inline'}`}>
            {renderValue()}
        </div>
    );
} 