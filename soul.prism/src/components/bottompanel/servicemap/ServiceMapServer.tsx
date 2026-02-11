import ServiceMapPanel from './ServicemapPanel';
import type { Span } from '../gantt/types';

async function fetchSpans(): Promise<Span[]> {
  try {
    const response = await fetch('http://localhost:3000/api/traces/spans', {
      cache: 'no-store' // Always get fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch spans');
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching spans:', error);
    return [];
  }
}

export default async function ServiceMapServer() {
  const spans = await fetchSpans();
  return <ServiceMapPanel spans={spans} />;
}