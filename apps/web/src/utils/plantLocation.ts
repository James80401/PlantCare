/** True when the plant is likely exposed to rain (outdoor / semi-outdoor spots). */
export function isRainExposedLocation(location?: string | null): boolean {
  if (!location?.trim()) return false;
  return /outdoor|garden|patio|balcony|greenhouse|porch|deck|terrace|yard/i.test(location);
}
