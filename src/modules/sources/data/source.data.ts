import { Source } from '@/modules/sources/interfaces/source.interface';
import { Reader } from '@/modules/sources/enums/reader.enum';
import { Status } from '@/modules/sources/enums/status.enum';
import { Instruction } from '@/modules/sources/interfaces/instruction.interface';
import { SourceKeys } from '@/modules/sources/data/source-keys.data';

const INSTRUCTION_MAIN: Instruction = {
  description: '',
  status: Status.Active,
};

export const SOURCES: Source[] = [
  {
    id: 1,
    name: 'Football UA',
    key: SourceKeys.FootballUa,
    url: 'https://football.ua/',
    reader: Reader.Scrapper,
    period: 3,
    status: Status.Active,
    instructions: [INSTRUCTION_MAIN],
  },
];
