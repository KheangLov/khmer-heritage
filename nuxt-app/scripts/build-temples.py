#!/usr/bin/env python3
"""Build the historic-temple dataset for the map.

Every Khmer temple we can locate from open data, with its admin path
(Province › District › Commune › Village) and whatever history the sources hold.
Nothing is written that a source does not say.

Sources (cached in scripts/.cache/, re-fetch by deleting the file):
  osm-features.json      OpenStreetMap (ODbL) — places of worship, attractions and
                         `historic=*` features in Cambodia (Overpass API)
  osm-villages.json      OpenStreetMap place=village/hamlet points
  wikidata-sparql.json   Wikidata (CC0) — temples/archaeological sites in Cambodia
  wikidata-entities.json Wikidata entities for every linked item (labels, dates, …)
  wikipedia.json         Khmer + English Wikipedia intro extracts (CC BY-SA)
  communes-full.geojson  HDX COD-AB Cambodia admin boundaries (CC BY-IGO) with Khmer
  villages/<commune>.json  names from cambodia-gazetteer (MIT) — prepared by the
                         aba-website project (scripts/build-admin-data.py there).

Village: no public source has village boundaries, so a temple gets the nearest
OSM village point inside its own commune only when that village's name matches
the official gazetteer list for the commune; otherwise the village is left out.

Outputs:
  public/data/temples/index.json            compact list for the map + filters
  public/data/temples/detail/<prov>.json    history & facts, fetched on demand
  public/data/cambodia-admin/*.geojson      boundaries trimmed to {c, en, km}

Run with shapely available:  python3 -m venv .venv && .venv/bin/pip install shapely
                             .venv/bin/python scripts/build-temples.py
"""
import json
import math
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from shapely.geometry import Point, mapping, shape
from shapely.prepared import prep
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts' / '.cache'
OUT = ROOT / 'public' / 'data'
UA = {'User-Agent': 'KhmerHeritageSite/1.0 (educational; open-data build script)'}

PRASAT = re.compile(r'(prasat|prasath|prasart|ប្រាសាទ|temple ruin|\bprang\b)', re.I)
WAT = re.compile(r'(\bwat\b|វត្ត|pagoda)', re.I)
NOT_TEMPLE = re.compile(r'(baray|បារាយណ៍|hotel|resort|guest ?house|restaurant|shop|market|school|bridge)', re.I)
KHMER = re.compile(r'[ក-៿]')
KM_DIGITS = str.maketrans('0123456789', '០១២៣៤៥៦៧៨៩')
# Disambiguation pages and wiki-markup residue are not history.
JUNK_EXTRACT = re.compile(r'(may refer to|អាចសំដៅទៅលើ|^thumb\||\bthumb\|)', re.I)
WD_TYPES = {'archaeological site', 'temple', 'ruins', 'Buddhist temple', 'Hindu temple', 'temple complex',
            'ancient city', 'Khmer temple', 'Buddhist monastery', 'wat', 'pagoda'}


def get_json(url, data=None, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            return json.load(urllib.request.urlopen(req, timeout=120))
        except Exception as e:  # noqa: BLE001 — network retries
            print('  retry', i + 1, e)
            time.sleep(6 * (i + 1))
    raise RuntimeError(url)


def cached(name, fetch):
    p = CACHE / name
    if p.exists():
        return json.load(open(p))
    data = fetch()
    json.dump(data, open(p, 'w'), ensure_ascii=False)
    return data


def norm(s):
    s = unicodedata.normalize('NFKC', (s or '').lower())
    s = re.sub(r'\b(prasat|prasath|prasart|temple|ruins?|wat|phnom|the|of)\b|ប្រាសាទ|វត្ត|ភ្នំ|\(.*?\)', ' ', s)
    return re.sub(r'[^\wក-៿]+', '', s)


def km_digits(n):
    return str(n).translate(KM_DIGITS)


def dist_m(a, b):
    (la1, lo1), (la2, lo2) = a, b
    x = math.radians(lo2 - lo1) * math.cos(math.radians((la1 + la2) / 2))
    y = math.radians(la2 - la1)
    return 6371000 * math.hypot(x, y)


# --------------------------------------------------------------------------- sources
def osm_temples():
    feats = json.load(open(CACHE / 'osm-features.json'))
    out = []
    for e in feats:
        t = e.get('tags', {})
        lat = e.get('lat') or e.get('center', {}).get('lat')
        lon = e.get('lon') or e.get('center', {}).get('lon')
        if lat is None:
            continue
        names = ' '.join(t.get(k, '') for k in ('name', 'name:km', 'name:en', 'alt_name', 'old_name'))
        if not names.strip() or NOT_TEMPLE.search(names):
            continue
        civ = t.get('historic:civilization', '').lower()
        hist = t.get('historic')
        if PRASAT.search(names) or civ in ('khmer', 'angkor_period', 'khmer_empire', 'angkor') \
                or (hist in ('archaeological_site', 'ruins') and t.get('religion') in ('hindu', 'buddhist')):
            cat = 'prasat'
        elif t.get('amenity') == 'place_of_worship' and t.get('religion') == 'buddhist' and WAT.search(names) \
                and (hist or t.get('heritage') or t.get('wikidata') or t.get('wikipedia')):
            cat = 'wat'
        else:
            continue
        name = t.get('name', '')
        km = t.get('name:km') or (name if KHMER.search(name) else '')
        en = t.get('name:en') or (name if not KHMER.search(name) else '')
        out.append({
            'osm': f"{e['type']}/{e['id']}", 'lat': lat, 'lng': lon, 'cat': cat,
            'km': km.strip(), 'en': en.strip(), 'wd': t.get('wikidata'),
            'wp': t.get('wikipedia'), 'start': t.get('start_date'), 'desc': t.get('description'),
            'civ': civ, 'heritage': t.get('heritage'), 'religion': t.get('religion'),
        })
    return out


def wikidata_entities(qids):
    def fetch():
        ents = {}
        ids = sorted(qids)
        for i in range(0, len(ids), 50):
            q = {'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(ids[i:i + 50]),
                 'props': 'labels|descriptions|claims|sitelinks', 'languages': 'km|en', 'sitefilter': 'kmwiki|enwiki'}
            ents.update(get_json('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(q))['entities'])
            time.sleep(1)
        # labels of referenced items (builders, deities, heritage designations, types)
        refs = set()
        for e in ents.values():
            for p in ('P88', 'P825', 'P1435', 'P31', 'P140'):
                for c in e.get('claims', {}).get(p, []):
                    v = c['mainsnak'].get('datavalue', {}).get('value')
                    if isinstance(v, dict) and v.get('id'):
                        refs.add(v['id'])
        labels = {}
        refs = sorted(refs)
        for i in range(0, len(refs), 50):
            q = {'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(refs[i:i + 50]),
                 'props': 'labels', 'languages': 'km|en'}
            for k, v in get_json('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(q))['entities'].items():
                labels[k] = {l: v.get('labels', {}).get(l, {}).get('value') for l in ('km', 'en')}
            time.sleep(1)
        return {'entities': ents, 'labels': labels}
    return cached('wikidata-entities.json', fetch)


def wikipedia_extracts(titles):
    """titles: {'km': set(), 'en': set()} → {'km:Title': text, …}"""
    def fetch():
        out = {}
        for lang, ts in titles.items():
            ts = sorted(ts)
            for i in range(0, len(ts), 10):
                q = {'action': 'query', 'format': 'json', 'prop': 'extracts', 'exintro': 1, 'explaintext': 1,
                     'exsentences': 4, 'exlimit': 10, 'redirects': 1, 'titles': '|'.join(ts[i:i + 10])}
                d = get_json(f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode(q))
                back = {r['to']: r['from'] for r in d['query'].get('redirects', [])}
                back.update({n['to']: n['from'] for n in d['query'].get('normalized', [])})
                for p in d['query']['pages'].values():
                    if p.get('extract'):
                        out[f"{lang}:{back.get(p['title'], p['title'])}"] = p['extract'].strip()
                time.sleep(0.5)
        return out
    return cached('wikipedia.json', fetch)


# --------------------------------------------------------------------------- facts
def claim_values(ent, pid):
    return [c['mainsnak'].get('datavalue', {}).get('value') for c in ent.get('claims', {}).get(pid, [])
            if c['mainsnak'].get('datavalue')]


def period_label(time_value):
    """Wikidata time → Khmer label ('គ.ស. ៩៦៧' or 'សតវត្សទី ១២')."""
    m = re.match(r'([+-])(\d+)-', time_value['time'])
    if not m:
        return None
    year = int(m.group(2)) * (-1 if m.group(1) == '-' else 1)
    prec = time_value.get('precision', 9)
    if prec >= 9:
        return f'គ.ស. {km_digits(year)}' if year > 0 else f'{km_digits(-year)} មុនគ.ស.'
    if prec == 8:
        return f'ទសវត្សរ៍ {km_digits(year)}'
    if prec == 7:
        c = (year - 1) // 100 + 1 if year > 0 else year // 100
        return f'សតវត្សទី {km_digits(c)}'
    return None


def osm_period(start, civ):
    if start:
        if re.fullmatch(r'\d{3,4}', start):
            return f'គ.ស. {km_digits(start)}'
        m = re.fullmatch(r'C(\d{1,2})', start, re.I)
        if m:
            return f'សតវត្សទី {km_digits(m.group(1))}'
    if civ in ('angkor_period', 'angkor', 'khmer_empire'):
        return 'សម័យអង្គរ'
    return None


# --------------------------------------------------------------------------- admin
def load_admin():
    comm = json.load(open(CACHE / 'communes-full.geojson'))['features']
    geoms, props = [], []
    for f in comm:
        geoms.append(shape(f['geometry']))
        p = f['properties']
        props.append({'p': p['adm1_pcode'][2:], 'd': p['adm2_pcode'][2:], 'm': p['adm3_pcode'][2:],
                      'm_en': p['name_en'], 'm_km': p.get('name_km') or p['name_en']})
    tree = STRtree(geoms)
    prepared = [prep(g) for g in geoms]
    return tree, prepared, props


def commune_of(pt, tree, prepared, props):
    for i in tree.query(pt):
        if prepared[i].contains(pt):
            return props[i]
    # just outside a polygon (river bank, simplified border): nearest within ~1 km
    i = tree.nearest(pt)
    if i is not None and tree.geometries[i].distance(pt) < 0.01:
        return props[i]
    return None


def village_key(s):
    s = re.sub(r'ភូមិ|\s|​', '', s or '')
    return s.lower()


def main():
    t0 = time.time()
    temples = osm_temples()
    print('osm temples', len(temples))

    # --- Wikidata: SPARQL hits + OSM-linked items
    sparql = json.load(open(CACHE / 'wikidata-sparql.json'))
    wd_hits = {}
    for r in sparql:
        if r['typeLabel']['value'] not in WD_TYPES:
            continue
        q = r['item']['value'].rsplit('/', 1)[1]
        lon, lat = map(float, re.findall(r'-?[\d.]+', r['coord']['value']))
        wd_hits[q] = (lat, lon)
    qids = set(wd_hits) | {t['wd'] for t in temples if t['wd']}
    wd = wikidata_entities(qids)
    ents, labels = wd['entities'], wd['labels']

    # attach Wikidata to OSM by tag, else by proximity + name
    used = {t['wd'] for t in temples if t['wd']}
    for q, (lat, lon) in wd_hits.items():
        if q in used:
            continue
        e = ents.get(q, {})
        wname = norm(e.get('labels', {}).get('en', {}).get('value', '')) or norm(e.get('labels', {}).get('km', {}).get('value', ''))
        best = None
        for t in temples:
            if t['wd']:
                continue
            d = dist_m((lat, lon), (t['lat'], t['lng']))
            if d < 400:
                sim = max(SequenceMatcher(None, wname, norm(t['en'])).ratio(), SequenceMatcher(None, wname, norm(t['km'])).ratio())
                if sim > 0.6 and (best is None or d < best[0]):
                    best = (d, t)
        if best:
            best[1]['wd'] = q
            used.add(q)
        else:
            labs = e.get('labels', {})
            if NOT_TEMPLE.search(' '.join(v.get('value', '') for v in labs.values())):
                continue
            temples.append({'osm': None, 'lat': lat, 'lng': lon, 'cat': 'prasat', 'wd': q, 'wp': None,
                            'km': (labs.get('km') or {}).get('value', ''), 'en': (labs.get('en') or {}).get('value', ''),
                            'start': None, 'desc': None, 'civ': '', 'heritage': None, 'religion': None})
            used.add(q)

    # one feature per Wikidata item (gates/annexes of a temple often share the
    # complex's QID): the feature whose name best matches the item keeps it
    by_wd = defaultdict(list)
    for t in temples:
        if t['wd']:
            by_wd[t['wd']].append(t)
    for q, group in by_wd.items():
        if len(group) < 2:
            continue
        e = ents.get(q, {})
        wname = norm((e.get('labels', {}).get('en') or {}).get('value', '')) or norm((e.get('labels', {}).get('km') or {}).get('value', ''))
        group.sort(key=lambda t: -max(SequenceMatcher(None, wname, norm(t['en'])).ratio(), SequenceMatcher(None, wname, norm(t['km'])).ratio()))
        for t in group[1:]:
            t['wd'] = None

    # de-duplicate: same normalised name within 150 m
    temples.sort(key=lambda t: (t['wd'] is None, t['osm'] is None))
    kept = []
    for t in temples:
        key = norm(t['km']) or norm(t['en'])
        if any(key and key == (norm(k['km']) or norm(k['en'])) and dist_m((t['lat'], t['lng']), (k['lat'], k['lng'])) < 150 for k in kept):
            continue
        kept.append(t)
    temples = kept
    print('after merge/dedupe', len(temples))

    # --- Wikipedia titles
    titles = {'km': set(), 'en': set()}
    for t in temples:
        e = ents.get(t['wd'] or '', {})
        for lang in ('km', 'en'):
            sl = e.get('sitelinks', {}).get(f'{lang}wiki')
            if sl:
                t[f'{lang}wiki'] = sl['title']
                titles[lang].add(sl['title'])
        if t['wp'] and ':' in t['wp']:
            lang, title = t['wp'].split(':', 1)
            if lang in titles and not t.get(f'{lang}wiki'):
                t[f'{lang}wiki'] = title
                titles[lang].add(title)
    extracts = wikipedia_extracts(titles)

    # --- admin path
    tree, prepared, props = load_admin()
    villages = [v for v in json.load(open(CACHE / 'osm-villages.json')) if v.get('name') or v.get('km')]
    vtree = STRtree([Point(v['lon'], v['lat']) for v in villages])
    gaz_cache = {}

    def gazetteer(mcode):
        if mcode not in gaz_cache:
            p = CACHE / 'villages' / f'{mcode}.json'
            gaz_cache[mcode] = json.load(open(p)) if p.exists() else []
        return gaz_cache[mcode]

    index, detail = [], defaultdict(dict)
    in_cambodia = 0
    for n, t in enumerate(temples):
        pt = Point(t['lng'], t['lat'])
        adm = commune_of(pt, tree, prepared, props)
        if not adm:
            continue  # outside Cambodia (bbox spill into neighbours)
        in_cambodia += 1
        # village: nearest OSM village in the same commune whose name is in the gazetteer
        village = None
        for vi in vtree.query(pt.buffer(0.03)):
            v = villages[vi]
            vpt = Point(v['lon'], v['lat'])
            vad = commune_of(vpt, tree, prepared, props)
            if not vad or vad['m'] != adm['m']:
                continue
            names = {village_key(v.get('km')), village_key(v.get('name')), village_key(v.get('en'))} - {''}
            for g in gazetteer(adm['m']):
                if village_key(g['km']) in names or village_key(g['en']) in names:
                    d = dist_m((t['lat'], t['lng']), (v['lat'], v['lon']))
                    if d < 3000 and (village is None or d < village[0]):
                        village = (d, g)
        e = ents.get(t['wd'] or '', {})

        def ref_labels(pid):
            return [labels.get(v['id'], {}) for v in claim_values(e, pid) if isinstance(v, dict) and v.get('id')]

        period = None
        for tv in claim_values(e, 'P571'):
            period = period_label(tv)
            if period:
                break
        period = period or osm_period(t['start'], t['civ'])
        km_name = t['km'] or (e.get('labels', {}).get('km') or {}).get('value', '')
        en_name = t['en'] or (e.get('labels', {}).get('en') or {}).get('value', '')
        hist = {}
        for lang in ('km', 'en'):
            title = t.get(f'{lang}wiki')
            text = extracts.get(f'{lang}:{title}', '') if title else ''
            if len(text) < 60 or JUNK_EXTRACT.search(text):
                continue
            if title:
                hist[lang] = {'text': extracts[f'{lang}:{title}'],
                              'url': f'https://{lang}.wikipedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_'))}
        facts = {k: v for k, v in {
            'period': period,
            'builder': [x for x in ref_labels('P88') if x.get('km') or x.get('en')],
            'deity': [x for x in ref_labels('P825') if x.get('km') or x.get('en')],
            'heritage': [x for x in ref_labels('P1435') if x.get('km') or x.get('en')],
            'descKm': (e.get('descriptions', {}).get('km') or {}).get('value'),
            'descEn': (e.get('descriptions', {}).get('en') or {}).get('value') or t['desc'],
        }.items() if v}
        tid = (t['wd'] or t['osm'].replace('/', '-'))
        row = {
            'id': tid, 'km': km_name, 'en': en_name,
            'lat': round(t['lat'], 5), 'lng': round(t['lng'], 5), 'c': t['cat'],
            'p': adm['p'], 'd': adm['d'], 'm': adm['m'],
        }
        if village:
            row['v'] = village[1]['km'] or village[1]['en']
            row['ve'] = village[1]['en']
        if period:
            row['y'] = period
        if hist:
            row['h'] = 1
        index.append(row)
        detail[adm['p']][tid] = {
            'facts': facts, 'history': hist,
            'osm': f"https://www.openstreetmap.org/{t['osm']}" if t['osm'] else None,
            'wikidata': f"https://www.wikidata.org/wiki/{t['wd']}" if t['wd'] else None,
            'village': {'km': village[1]['km'], 'en': village[1]['en'], 'approx': True} if village else None,
        }

    index.sort(key=lambda r: (r['p'], r['d'], r['m'], r['km'] or r['en']))
    (OUT / 'temples' / 'detail').mkdir(parents=True, exist_ok=True)
    json.dump(index, open(OUT / 'temples' / 'index.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    for p, d in detail.items():
        json.dump(d, open(OUT / 'temples' / 'detail' / f'{p}.json', 'w'), ensure_ascii=False, separators=(',', ':'))

    # --- trimmed admin boundaries for the client
    def trim(fc_path, keys, out_path):
        fc = json.load(open(fc_path))
        for f in fc['features']:
            pr = f['properties']
            f['properties'] = {k: v(pr) for k, v in keys.items()}
            geom = shape(f['geometry'])
            f['geometry'] = json.loads(json.dumps(mapping(geom)), parse_float=lambda x: round(float(x), 4))
        json.dump(fc, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    adm_dir = OUT / 'cambodia-admin'
    trim(adm_dir / 'provinces.geojson', {'c': lambda p: p.get('adm1_pcode', p.get('c', ''))[-2:] if 'adm1_pcode' in p else p['c'],
                                         'en': lambda p: p.get('name_en') or p.get('en'), 'km': lambda p: p.get('name_km') or p.get('km')},
         adm_dir / 'provinces.geojson')
    trim(adm_dir / 'districts.geojson', {'c': lambda p: p['adm2_pcode'][2:] if 'adm2_pcode' in p else p['c'],
                                         'en': lambda p: p.get('name_en') or p.get('en'), 'km': lambda p: p.get('name_km') or p.get('km')},
         adm_dir / 'districts.geojson')
    for f in (adm_dir / 'communes').glob('*.geojson'):
        trim(f, {'c': lambda p: p['adm3_pcode'][2:] if 'adm3_pcode' in p else p['c'],
                 'en': lambda p: p.get('name_en') or p.get('en'), 'km': lambda p: p.get('name_km') or p.get('km')}, f)

    with_v = sum(1 for r in index if r.get('v'))
    print(f'in Cambodia: {in_cambodia}  index: {len(index)}  with history: {sum(1 for r in index if r.get("h"))}  '
          f'with period: {sum(1 for r in index if r.get("y"))}  with village: {with_v}  '
          f'khmer names: {sum(1 for r in index if r["km"])}  ({time.time() - t0:.0f}s)')


if __name__ == '__main__':
    main()
