let mapsPromise;

function loadGoogleMaps() {
  if (globalThis.google?.maps) return Promise.resolve(globalThis.google.maps);
  if (mapsPromise) return mapsPromise;

  const key = globalThis.PERSONALOS_CONFIG?.googleMapsApiKey;
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured.'));
  }

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__personalosCurrentGoogleMapsReady';
    globalThis[callbackName] = () => {
      delete globalThis[callbackName];
      resolve(globalThis.google.maps);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      delete globalThis[callbackName];
      mapsPromise = undefined;
      reject(new Error('Google Maps JavaScript API could not be loaded.'));
    };
    document.head.append(script);
  });

  return mapsPromise;
}

function latLng(position) {
  return { lat: position.lat, lng: position.lon };
}

async function titleForPoint(point, resolver) {
  if (!point.entity_ref) return point.point_id;
  try {
    const described = await resolver.describe(point.entity_ref);
    return described.title;
  } catch {
    return `${point.entity_ref.entity_type}:${point.entity_ref.id}`;
  }
}

function infoContent(title) {
  const node = document.createElement('div');
  node.textContent = title;
  return node;
}

function drawResolvedSegment(maps, map, segment, bounds) {
  const path = (segment.path || []).map(latLng);
  path.forEach(position => bounds.extend(position));
  new maps.Polyline({
    map,
    path,
    geodesic: true,
    strokeOpacity: 0.82,
    strokeWeight: 4
  });
}

function drawSemanticConnection(maps, map, connection, pointById, bounds) {
  if (connection.geometry_segment_id) return;
  const from = pointById.get(connection.from_point_id);
  const to = pointById.get(connection.to_point_id);
  if (!from || !to) return;

  const path = [latLng(from.position), latLng(to.position)];
  path.forEach(position => bounds.extend(position));
  new maps.Polyline({
    map,
    path,
    geodesic: true,
    strokeOpacity: 0,
    strokeWeight: 2,
    icons: [
      {
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 0.55,
          scale: 2
        },
        offset: '0',
        repeat: '12px'
      }
    ]
  });
}

async function hydrateMapView(view, { artifactLoader, resolver }) {
  if (view.dataset.mapState === 'ready' || view.dataset.mapState === 'loading') return;
  view.dataset.mapState = 'loading';

  const state = view.querySelector('.map-state');
  const canvas = view.querySelector('.map-canvas');

  try {
    const [artifact, maps] = await Promise.all([
      artifactLoader.load({ artifact_id: view.dataset.mapArtifactId }),
      loadGoogleMaps()
    ]);

    const points = artifact.points || [];
    if (!points.length) throw new Error('Map artifact has no points.');

    const map = new maps.Map(canvas, {
      center: latLng(points[0].position),
      zoom: 11,
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      streetViewControl: false
    });

    const bounds = new maps.LatLngBounds();
    const pointById = new Map(points.map(point => [point.point_id, point]));

    for (const segment of artifact.segments || []) {
      drawResolvedSegment(maps, map, segment, bounds);
    }

    for (const connection of artifact.connections || []) {
      drawSemanticConnection(maps, map, connection, pointById, bounds);
    }

    const infoWindow = new maps.InfoWindow();
    const pointTitles = await Promise.all(points.map(point => titleForPoint(point, resolver)));

    points.forEach((point, index) => {
      const position = latLng(point.position);
      bounds.extend(position);
      const marker = new maps.Marker({
        map,
        position,
        title: pointTitles[index],
        label: String(point.order)
      });
      marker.addListener('click', () => {
        infoWindow.setContent(infoContent(pointTitles[index]));
        infoWindow.open({ map, anchor: marker });
      });
    });

    if (!bounds.isEmpty()) map.fitBounds(bounds, 36);
    if (state) state.remove();
    view.dataset.mapState = 'ready';
  } catch (error) {
    console.warn('[current-viewer] map unavailable', error);
    view.dataset.mapState = 'error';
    if (canvas) canvas.replaceChildren();
    if (state) state.textContent = '地図を表示できませんでした。';
  }
}

function hydrateWhenUsable(view, context) {
  const disclosure = view.closest('details');
  if (disclosure && !disclosure.open) {
    const onToggle = () => {
      if (!disclosure.open) return;
      disclosure.removeEventListener('toggle', onToggle);
      hydrateMapView(view, context);
    };
    disclosure.addEventListener('toggle', onToggle);
    return Promise.resolve();
  }
  return hydrateMapView(view, context);
}

export async function hydrateMapViews({ root, artifactLoader, resolver }) {
  const views = [...root.querySelectorAll('[data-map-artifact-id]')];
  await Promise.allSettled(
    views.map(view => hydrateWhenUsable(view, { artifactLoader, resolver }))
  );
}
