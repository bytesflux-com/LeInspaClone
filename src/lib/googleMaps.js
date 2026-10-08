import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let configured = false

// Loads the Google Places library once; use with PlaceAutocompleteElement
// or AutocompleteService during onboarding address entry.
export async function loadPlaces() {
  if (!configured) {
    setOptions({ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, v: 'weekly' })
    configured = true
  }
  return importLibrary('places')
}
