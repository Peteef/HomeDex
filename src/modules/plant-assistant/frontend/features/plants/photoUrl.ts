const PLANTS_URL = '/api/m/plant-assistant/plants';

interface PhotographedPlant {
  id: number;
  photoId: number | null;
}

// The photo's id in the URL changes with every new photo, so the browser may cache it for good.
export const photoUrl = ({ id, photoId }: PhotographedPlant): string | null =>
  photoId === null ? null : `${PLANTS_URL}/${String(id)}/photo?v=${String(photoId)}`;
