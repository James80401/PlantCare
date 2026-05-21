import { IsString, Matches } from 'class-validator';

export class AddFriendDto {
  @IsString()
  @Matches(/^SPROUT-[A-Z2-9]{4}$/i, {
    message: 'Garden code must look like SPROUT-7X4K',
  })
  gardenCode!: string;
}
