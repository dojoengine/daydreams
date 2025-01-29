import React, { useRef, useEffect } from 'react';

interface MessageType {
    type: "INPUT" | "OUTPUT" | "SYSTEM" | "ERROR" | "OTHER" | "WELCOME" | "INFO";
    message?: string;
    error?: string;
    timestamp?: number;
}

interface MessagesListProps {
    messages: MessageType[];
}

export function MessagesList({ messages }: MessagesListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getMessageClasses = (msg: MessageType) => {
        let containerClass = "flex w-full mb-4 px-4";
        let bubbleClass = `
            px-4 py-2 rounded-lg max-w-[80%] font-medium 
            relative overflow-hidden
            bg-card text-foreground
            before:absolute before:inset-[1px] before:rounded-lg before:z-0
            [&>*]:relative [&>*]:z-10
        `;

        switch (msg.type) {
            case "INPUT":
                containerClass += " justify-end";
                bubbleClass += ` 
                    text-[#FF307B]
                    shadow-[0_0_30px_rgba(255,48,123,0.3)]
                    border border-[#FF307B]/30
                `;
                break;

            case "OUTPUT":
                containerClass += " justify-start";
                bubbleClass += ` 
                    text-[#00FFC3]
                    shadow-[0_0_30px_rgba(0,255,195,0.3)]
                    border border-[#00FFC3]/30
                `;
                break;

            case "SYSTEM":
                containerClass += " justify-center";
                bubbleClass += ` 
                    text-[#1CEB92]
                    shadow-[0_0_30px_rgba(28,235,146,0.3)]
                    border border-[#1CEB92]/30
                `;
                break;

            case "ERROR":
                containerClass += " justify-start";
                bubbleClass += ` 
                    text-[#FF585D]
                    shadow-[0_0_30px_rgba(255,88,93,0.3)]
                    border border-[#FF585D]/30
                `;
                break;

            default:
                containerClass += " justify-start";
                bubbleClass += ` 
                    text-[#9F00C5]
                    shadow-[0_0_30px_rgba(159,0,197,0.3)]
                    border border-[#9F00C5]/30
                `;
        }

        bubbleClass += ` 
            hover:brightness-105
            transition-all duration-300
        `;

        return { containerClass, bubbleClass };
    };

    return (
        <div className="flex flex-col w-full">
            {messages.map((msg, i) => {
                const { containerClass, bubbleClass } = getMessageClasses(msg);
                const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : null;

                return (
                    <div key={i} className={containerClass}>
                        <div className={bubbleClass}>
                            {msg.type !== "INPUT" && msg.type !== "OUTPUT" && (
                                <div className="text-xs font-semibold mb-2 opacity-70">
                                    {msg.type}
                                </div>
                            )}

                            <div className={`
                                break-words overflow-x-auto
                                ${time ? 'mb-4' : ''}
                            `}>
                                {msg.message}
                            </div>

                            {msg.error && (
                                <div className="text-sm font-medium text-destructive mt-1">
                                    {msg.error}
                                </div>
                            )}

                            {time && (
                                <div className="text-xs opacity-50 absolute bottom-1 right-2">
                                    {time}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
}