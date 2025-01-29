import { createFileRoute } from '@tanstack/react-router';
import { MyAgentsPage } from '@/components/my-agents-page';

export const Route = createFileRoute('/my-agents/')({
  component: MyAgentsPage
}); 