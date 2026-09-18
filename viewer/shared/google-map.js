let googleMapsPromise;

export function buildGoogleMapsSearchUrl({ name = '', placeId = '' } = {}) {
  if (!name && !placeId) return '';

  const params = new URLSearchParams({
    api: '1',
    query: name || placeId
  });

  if (placeId) params.set('query_place_id', placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function ensureGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__personalosGoogleMapsReady';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = undefined;
      reject(new Error('Google Maps JavaScript API load error'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function setMessage(messageElement, message = '') {
  if (messageElement) messageElement.textContent = message;
}

function validPosition(position) {
  return Number.isFinite(position?.lat) && Number.isFinite(position?.lng);
}

export async function renderGoogleMap({
  element,
  messageElement = null,
  points = [],
  getPosition = point => ({ lat: Number(point.lat), lng: Number(point.lng ?? point.lon) }),
  getTitle = point => point.title || point.name || '',
  getLabel = () => '',
  getPopupContent = null,
  mapOptions = {}
} = {}) {
  if (!element) throw new Error('Google Maps element is required.');

  const key = window.PERSONALOS_CONFIG?.googleMapsApiKey || '';
  if (!key) {
    element.style.display = 'none';
    setMessage(messageElement, 'Google Maps API key 未設定。');
    return null;
  }

  const maps = await ensureGoogleMaps(key);
  element.style.display = '';
  element.replaceChildren();

  const map = new maps.Map(element, {
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    ...mapOptions
  });
  const infoWindow = new maps.InfoWindow();
  const bounds = new maps.LatLngBounds();
  const markers = [];

  points.forEach(point => {
    const position = getPosition(point);
    if (!validPosition(position)) return;

    bounds.extend(position);
    const label = getLabel(point);
    const marker = new maps.Marker({
      map,
      position,
      title: getTitle(point),
      label: label ? { text: String(label), color: '#fff', fontWeight: '700' } : undefined,
      zIndex: 100 + Number(point.order || 0)
    });

    if (getPopupContent) {
      marker.addListener('click', () => {
        infoWindow.setContent(getPopupContent(point));
        infoWindow.open({ map, anchor: marker });
      });
    }

    markers.push(marker);
  });

  if (!bounds.isEmpty()) map.fitBounds(bounds, 28);
  setMessage(messageElement);

  return { map, markers, infoWindow };
}
