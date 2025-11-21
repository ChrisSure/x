import { Reader } from '@/modules/sources/enums/reader.enum';
import { Status } from '@/modules/sources/enums/status.enum';
import { Instruction } from '@/modules/sources/interfaces/instruction.interface';

export interface Source {
  id: number;
  name: string;
  key: string;
  url: string;
  reader: Reader;
  period: number;
  status: Status;
  instructions?: Instruction[];
}
