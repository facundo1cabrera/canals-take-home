import { injectable } from 'tsyringe';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Mock geocoding: deterministic lat/lng from postalCode.
 * Same postalCode always returns the same coordinates.
 */
@injectable()
export class GeocodingService {
  geocode(postalCode: string): GeocodingResult {
    const normalized = postalCode.replace(/\s/g, '').toLowerCase();
    let latSeed = 0;
    let lngSeed = 1;
    for (let i = 0; i < normalized.length; i++) {
      latSeed = (latSeed * 31 + normalized.charCodeAt(i)) % 1e7;
      lngSeed = (lngSeed * 37 + normalized.charCodeAt(i)) % 1e7;
    }
    const latitude = 30 + (Math.abs(latSeed) % 1500) / 100;
    const longitude = -120 + (Math.abs(lngSeed) % 5000) / 100;
    return { latitude, longitude };
  }
}
