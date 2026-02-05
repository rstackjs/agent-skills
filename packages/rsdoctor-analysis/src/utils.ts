interface Chunk {
  size: number;
}

interface Loader {
  costs: number;
}

export const getMedianChunkSize = (list: Chunk[]): number => {
  const sorted = [...list].sort((a, b) => a.size - b.size);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1].size + sorted[middle].size) / 2;
  }
  return sorted[middle].size;
};

export const getTopThirdLoadersByCosts = (loaders: Loader[]): Loader[] => {
  const sorted = [...loaders].sort((a, b) => b.costs - a.costs);
  const count = Math.ceil(sorted.length / 3);
  return sorted.slice(0, count);
};
