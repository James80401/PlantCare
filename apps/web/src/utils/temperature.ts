export type TemperatureUnit = 'C' | 'F';

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit = 'C'): string {
  if (unit === 'F') {
    return `${Math.round(celsiusToFahrenheit(celsius))}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTemperatureRange(
  minC: number,
  maxC: number,
  unit: TemperatureUnit = 'C',
): string {
  if (unit === 'F') {
    return `${Math.round(celsiusToFahrenheit(minC))}–${Math.round(celsiusToFahrenheit(maxC))}°F`;
  }
  return `${Math.round(minC)}–${Math.round(maxC)}°C`;
}
