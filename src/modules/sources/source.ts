import { Source } from '@/modules/sources/interfaces/source.interface';
import { UA_SOURCES } from '@/modules/sources/data/source.data';

export function getSources(): Source[] {
  return UA_SOURCES;
}
