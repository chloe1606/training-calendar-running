export function formatDistance(value: number): string {
  return value.toLocaleString('en-GB', {
    minimumSignificantDigits: 3, maximumSignificantDigits: 3, useGrouping: false,
  });
}
