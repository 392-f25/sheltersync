import type { Shelter } from '../../types/index.ts';
import { InteractiveMap } from './InteractiveMap.tsx';

type MapPreviewProps = {
  shelters: Shelter[];
  highlightedId?: string;
  onSelect?: (shelterId: string) => void;
};

export const MapPreview = ({ shelters, highlightedId, onSelect }: MapPreviewProps) => (
  <InteractiveMap shelters={shelters} highlightedId={highlightedId} onSelect={onSelect} />
);
