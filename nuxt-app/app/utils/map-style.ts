import type { StyleSpecification, ExpressionSpecification } from 'maplibre-gl'
import cambodia from '~/data/cambodia.json'
import type * as GeoJSON from 'geojson'

// "Khmer night" vector basemap for MapLibre GL — the site's moss/gold palette.
// Sources (all free, no API key):
//   vector tiles  OpenFreeMap (OpenMapTiles schema, © OpenStreetMap contributors)
//   elevation     AWS/Mapzen Terrain Tiles (terrarium) → hillshade + 3D terrain
//   imagery       Esri World Imagery (satellite toggle)
// Khmer labels: MapLibre ≥ 6 draws text named in `font-faces` a grapheme
// cluster at a time through the browser's own text engine, so Khmer vowels and
// subscripts (ជើង) shape correctly. The Khmer range of every font stack is
// mapped to the site's Battambang subset in /fonts/.

const KHMER_RANGE = ['U+1780-17FF', 'U+19E0-19FF', 'U+200C-200D', 'U+25CC']
const C = {
  bg: '#0B1310', land: '#0F1A14', wood: '#12241A', grass: '#101F17', park: '#132A1C',
  water: '#0C2527', river: '#1B4744', gold: '#D4AF37', goldSoft: '#8A6A45',
  road1: '#7A6233', road2: '#5B4A2B', road3: '#3F3524', road4: '#2D281F',
  label: '#E8D9B0', labelDim: '#A89468', halo: '#0B1310', waterLabel: '#5E9A93',
}
// Cambodia outline: Natural Earth 1:50m (public domain), app/data/cambodia.json.
const KHM = cambodia.geometry as unknown as GeoJSON.MultiPolygon
// Places inside Cambodia are labelled with their local (Khmer) name; places in
// neighbouring countries fall back to Latin so Thai/Lao script never renders
// as missing-glyph boxes.
const NAME: ExpressionSpecification = ['case',
  ['within', { type: 'Feature', properties: {}, geometry: KHM } as never],
  ['coalesce', ['get', 'name:nonlatin'], ['get', 'name']],
  ['coalesce', ['get', 'name:latin'], ['get', 'name']],
]
// The world with Cambodia cut out — dims the neighbours.
const OUTSIDE: GeoJSON.Feature = {
  type: 'Feature', properties: {},
  geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], ...KHM.coordinates.map((poly) => [...poly[0]!].reverse())] },
}
const lin = (pairs: Array<[number, number]>): ExpressionSpecification =>
  ['interpolate', ['exponential', 1.4], ['zoom'], ...pairs.flat()] as ExpressionSpecification

export const SATELLITE_LAYER = 'satellite'
export const VECTOR_FILL_LAYERS = ['landcover-wood', 'landcover-grass', 'landuse-residential', 'park', 'water', 'building']

export function khmerNightStyle(origin: string): StyleSpecification {
  const face = (w: 400 | 700) => [{ url: `${origin}/fonts/battambang-khmer-${w}.woff2`, 'unicode-range': KHMER_RANGE }]
  const text = (size: ExpressionSpecification | number, color: string, font = 'Noto Sans Regular') => ({
    layout: { 'text-field': NAME, 'text-font': [font], 'text-size': size, 'text-max-width': 9 },
    paint: { 'text-color': color, 'text-halo-color': C.halo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 },
  })
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    'font-faces': { 'Noto Sans Regular': face(400), 'Noto Sans Bold': face(700), 'Noto Sans Italic': face(400) },
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> · <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>' },
      hillshade: { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 12, attribution: 'Terrain Tiles (Mapzen/AWS)' },
      'terrain-dem': { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 13 },
      khm: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: KHM } },
      outside: { type: 'geojson', data: OUTSIDE },
      esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': C.land } },
      { id: 'landcover-wood', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]], paint: { 'fill-color': C.wood, 'fill-opacity': 0.9 } },
      { id: 'landcover-grass', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'farmland', 'wetland', 'scrub']]], paint: { 'fill-color': C.grass, 'fill-opacity': 0.8 } },
      { id: 'landuse-residential', type: 'fill', source: 'omt', 'source-layer': 'landuse', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood']]], paint: { 'fill-color': '#17211A', 'fill-opacity': 0.8 } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': C.park, 'fill-opacity': 0.55, 'fill-outline-color': '#1F3A28' } },
      { id: 'hillshade', type: 'hillshade', source: 'hillshade', paint: { 'hillshade-shadow-color': '#040705', 'hillshade-highlight-color': '#4A4128', 'hillshade-accent-color': '#1A2A1F', 'hillshade-exaggeration': 0.55 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': C.water } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', filter: ['==', ['get', 'class'], 'river'], paint: { 'line-color': C.river, 'line-width': lin([[6, 0.6], [12, 2.6], [16, 6]]) } },
      { id: 'waterway-minor', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 11, filter: ['!=', ['get', 'class'], 'river'], paint: { 'line-color': C.river, 'line-width': lin([[11, 0.4], [16, 2]]), 'line-opacity': 0.7 } },
      { id: SATELLITE_LAYER, type: 'raster', source: 'esri', layout: { visibility: 'none' }, paint: { 'raster-saturation': -0.15, 'raster-brightness-max': 0.85 } },
      { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': '#1B231D', 'fill-outline-color': '#2A332B' } },
      { id: 'boundary-province', type: 'line', source: 'omt', 'source-layer': 'boundary', minzoom: 6, filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': C.goldSoft, 'line-opacity': 0.35, 'line-width': 0.8, 'line-dasharray': [3, 2] } },
      { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': C.road4, 'line-width': lin([[12, 0.5], [17, 5]]) } },
      { id: 'road-secondary', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': C.road3, 'line-width': lin([[9, 0.4], [16, 6]]) } },
      { id: 'road-primary', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6, filter: ['==', ['get', 'class'], 'primary'], layout: { 'line-cap': 'round' }, paint: { 'line-color': C.road2, 'line-width': lin([[6, 0.4], [16, 8]]) } },
      { id: 'road-trunk', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 4, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk']]], layout: { 'line-cap': 'round' }, paint: { 'line-color': C.road1, 'line-width': lin([[4, 0.5], [16, 10]]) } },
      { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['==', ['get', 'class'], 'rail'], paint: { 'line-color': '#4A4030', 'line-width': 1, 'line-dasharray': [2, 2] } },
      { id: 'boundary-country', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': C.gold, 'line-opacity': 0.7, 'line-width': lin([[3, 0.8], [10, 2.2]]), 'line-dasharray': [4, 2] } },
      { id: 'outside-dim', type: 'fill', source: 'outside', paint: { 'fill-color': '#050907', 'fill-opacity': 0.42 } },
      { id: 'khm-glow', type: 'line', source: 'khm', paint: { 'line-color': C.gold, 'line-width': lin([[4, 6], [10, 14]]), 'line-opacity': 0.12, 'line-blur': 6 } },
      { id: 'khm-line', type: 'line', source: 'khm', paint: { 'line-color': C.gold, 'line-width': lin([[4, 1.2], [10, 2.4]]), 'line-opacity': 0.85 } },
      { id: 'label-water', type: 'symbol', source: 'omt', 'source-layer': 'water_name', ...text(lin([[6, 11], [12, 14]]), C.waterLabel, 'Noto Sans Italic') },
      { id: 'label-road', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 13, layout: { ...text(11, C.labelDim).layout, 'symbol-placement': 'line' }, paint: text(11, C.labelDim).paint },
      { id: 'label-village', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11, filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'suburb']]], ...text(lin([[11, 11], [15, 14]]), C.labelDim) },
      { id: 'label-town', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 8, filter: ['==', ['get', 'class'], 'town'], ...text(lin([[8, 11], [14, 16]]), '#C9B78D') },
      { id: 'label-city', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 5, filter: ['==', ['get', 'class'], 'city'], ...text(lin([[5, 12], [12, 19]]), C.label, 'Noto Sans Bold') },
      { id: 'label-country', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 9, filter: ['==', ['get', 'class'], 'country'], layout: { ...text(lin([[3, 12], [8, 18]]), C.gold, 'Noto Sans Bold').layout, 'text-letter-spacing': 0.08 }, paint: text(12, C.gold).paint },
    ],
  } as StyleSpecification
}
