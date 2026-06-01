import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateBuddyDto } from './dto/update-buddy.dto';

describe('UpdateBuddyDto', () => {
  it.each(['visible', 'minimized', 'hidden'])(
    'accepts %s as a floating companion mode',
    async (floatingCompanionMode) => {
      const dto = plainToInstance(UpdateBuddyDto, { floatingCompanionMode });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it('rejects unknown floating companion modes', async () => {
    const dto = plainToInstance(UpdateBuddyDto, { floatingCompanionMode: 'dismissed' });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
