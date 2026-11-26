import { Dialog, LoadFailed, LoadingStatus } from '#platform/frontend';
import { useText } from '../../locales/index.ts';
import { PlantDetails } from './PlantDetails.tsx';
import type { DetailedPlant, PlantDetailsProps } from './PlantDetails.tsx';

export type PlantDetailsDialogProps = Omit<PlantDetailsProps, 'plant'> & {
  title: string;
  plant: DetailedPlant | undefined;
  failed: boolean;
  onRetry: () => void;
  onClose: () => void;
};

export const PlantDetailsDialog = ({
  title,
  plant,
  failed,
  onRetry,
  onClose,
  ...actions
}: PlantDetailsDialogProps) => {
  const text = useText('components.plantDetails');

  const renderContent = () => {
    if (plant !== undefined) {
      return <PlantDetails plant={plant} {...actions} />;
    }

    return failed ? <LoadFailed message={text.loadFailed} onRetry={onRetry} /> : <LoadingStatus />;
  };

  return (
    <Dialog open title={title} onClose={onClose}>
      {renderContent()}
    </Dialog>
  );
};
