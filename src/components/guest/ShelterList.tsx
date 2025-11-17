import type { Shelter } from '../../types/index.ts';
import { ShelterCard } from './ShelterCard.tsx';

type ShelterListProps = {
  shelters: Shelter[];
  focusedId?: string;
  onSelect?: (shelterId: string) => void;
};

export const ShelterList = ({ shelters, focusedId, onSelect }: ShelterListProps) => (
  <div className="space-y-3">
    {shelters.map((shelter) => (
      <ShelterCard
        key={shelter.id}
        shelter={shelter}
        isFocused={shelter.id === focusedId}
        onSelect={onSelect}
      />
    ))}
  </div>
);
