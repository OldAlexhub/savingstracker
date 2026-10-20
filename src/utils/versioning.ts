export function isAndroidUpdateRequired(currentVersionCode: number, minSupportedVersionCode: number): boolean {
  return Number.isFinite(currentVersionCode)
    && Number.isFinite(minSupportedVersionCode)
    && currentVersionCode < minSupportedVersionCode;
}
