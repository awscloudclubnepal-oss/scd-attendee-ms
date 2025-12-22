import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
  @ApiProperty({ 
    type: [Number], 
    description: 'Array of attendee IDs to delete',
    example: [1, 2, 3]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
