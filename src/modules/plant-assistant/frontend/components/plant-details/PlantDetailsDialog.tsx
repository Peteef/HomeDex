import { Dialog, LoadFailed, LoadingStatus } from '#platform/frontend';
import type { ReactNode } from 'react';
import { useText } from '../../locales/index.ts';
import { PlantDetails } from './PlantDetails.tsx';
import type { DetailedPlant, PlantDetailsProps } from './PlantDetails.tsx';

export type PlantDetailsDialogProps = Omit<PlantDetailsProps, 'plant'> & {
  title: string;
  plant: DetailedPlant | undefined;
  // Shown under the details once they have loaded.
  actions: ReactNode;
  failed: boolean;
  onRetry: () => void;
  onClose: () => void;
};

export const PlantDetailsDialog = ({
  title,
  plant,
  actions,
  failed,
  onRetry,
  onClose,
  renderTag,
}: PlantDetailsDialogProps) => {
  const text = useText('components.plantDetails');

  const renderContent = () => {
    if (plant !== undefined) {
      return (
        <>
          <PlantDetails plant={plant} renderTag={renderTag} />
          {actions}
        </>
      );
    }

    return failed ? <LoadFailed message={text.loadFailed} onRetry={onRetry} /> : <LoadingStatus />;
  };

  return (
    <Dialog open title={title} onClose={onClose}>
      {renderContent()}
    </Dialog>
  );
};
