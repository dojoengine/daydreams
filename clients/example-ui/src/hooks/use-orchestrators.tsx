import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { generateUserId } from './use-daydreams';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

interface UseOrchestratorsReturn {
  loading: boolean;
  error: string | null;
  createOrchestrator: (name: string) => Promise<void>;
  fetchOrchestrators: () => Promise<void>;
}

export function useOrchestrators(): UseOrchestratorsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOrchestrators, orchestrators, setCurrentOrchestratorId, currentOrchestratorId } = useAppStore();

  const fetchOrchestrators = useCallback(async () => {
    console.log('🔄 Fetching orchestrators...');
    try {
      setLoading(true);
      const userId = generateUserId();
      const response = await fetch(
        `${API_URL}/api/orchestrators?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Received orchestrators:', data);
      setOrchestrators(data);
      
      if (!currentOrchestratorId && data.length > 0) {
        console.log('🎯 Setting default orchestrator:', data[0].id);
        setCurrentOrchestratorId(data[0].id);
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching orchestrators:', err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch orchestrators"
      );
    } finally {
      setLoading(false);
    }
  }, [setOrchestrators, currentOrchestratorId, setCurrentOrchestratorId]);

  useEffect(() => {
    console.log('🚀 useOrchestrators mounted');
    fetchOrchestrators();
  }, [fetchOrchestrators]);

  const createOrchestrator = useCallback(async (name: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/orchestrators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          userId: generateUserId()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newOrchestrator = await response.json();
      setOrchestrators([...orchestrators, newOrchestrator]);
      setCurrentOrchestratorId(newOrchestrator.id);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create orchestrator"
      );
      console.error("Error creating orchestrator:", err);
    } finally {
      setLoading(false);
    }
  }, [orchestrators, setOrchestrators, setCurrentOrchestratorId]);

  return {
    loading,
    error,
    createOrchestrator,
    fetchOrchestrators,
  };
} 