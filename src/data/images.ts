export type ImageItem = {
  id: string;
  uri: string;
};

export const IMAGE_DATA: ImageItem[] = Array.from(
  { length: 20 },
  (_, index) => {
    const id = String(index + 1);
    return {
      id,
      uri: `https://picsum.photos/seed/myapp-${id}/400/500`,
    };
  },
);

export function getFullImageUri(uri: string): string {
  return uri.replace('/400/500', '/1200/1500');
}
