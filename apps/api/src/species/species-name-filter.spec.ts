import { speciesNameContains, speciesSearchTerms } from './species-name-filter';

describe('speciesNameContains', () => {
  it('uses insensitive mode on PostgreSQL', () => {
    expect(
      speciesNameContains('postgresql://user:pass@localhost/db', 'monstera'),
    ).toEqual({ contains: 'monstera', mode: 'insensitive' });
  });

  it('uses default contains on SQLite', () => {
    expect(speciesNameContains('file:./dev.db', 'monstera')).toEqual({
      contains: 'monstera',
    });
  });

  it('maps cannibus searches to cannabis too', () => {
    expect(speciesSearchTerms('cannibus')).toEqual(['cannibus', 'cannabis']);
  });
});
