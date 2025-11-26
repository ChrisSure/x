import { Source } from '@/modules/sources/interfaces/source.interface';
import { UA_SOURCES } from '@/modules/sources/data/source.data';

/**
 * Service for managing and accessing source data
 */
export class SourceModule {
  /**
   * Get all available sources
   * @returns Array of Source objects
   */
  getSources(): Source[] {
    return UA_SOURCES;
  }
}
