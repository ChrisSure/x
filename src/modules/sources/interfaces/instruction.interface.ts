import { Status } from '@/modules/sources/enums/status.enum';

export interface Instruction {
  description: string;
  status: Status;
}
