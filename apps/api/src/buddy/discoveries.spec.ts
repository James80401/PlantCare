import { DISCOVERIES, pickDiscovery } from './constants/discoveries';

describe('journey discoveries', () => {
  it('exposes encounter metadata and outcomes for every discovery', () => {
    for (const discovery of DISCOVERIES) {
      expect(discovery.title).toBeTruthy();
      expect(discovery.encounterName).toBeTruthy();
      expect(discovery.encounterRole).toBeTruthy();
      expect(discovery.rewardFocus).toBeTruthy();
      expect(discovery.outcomeA).toBeTruthy();
      expect(discovery.outcomeB).toBeTruthy();
    }
  });

  it('personalizes discovery copy with the buddy name', () => {
    const discovery = pickDiscovery('seed_garden', 'Sprig');

    expect(discovery.story).not.toContain('{name}');
    expect(discovery.choiceA).not.toContain('{name}');
    expect(discovery.choiceB).not.toContain('{name}');
    expect(discovery.outcomeA).not.toContain('{name}');
    expect(discovery.outcomeB).not.toContain('{name}');
  });
});
