import { Source } from '@/modules/sources/interfaces/source.interface';
import { SOURCES } from '@/modules/sources/data/source.data';

export function getSources(): Source[] {
  return SOURCES;
}
