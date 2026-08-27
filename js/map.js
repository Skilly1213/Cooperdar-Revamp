let frames = [];
let currentFrame = 0;
let mapReady = false;
const range = document.querySelector('#timeline');
const timeLabel = document.querySelector('#timeline-time');
const playButton = document.querySelector('#play-button');
let timer;
let alertFeatures = [];

const map = new maplibregl.Map({
	container: 'map',
	style: 'https://api.maptiler.com/maps/019f3112-43d5-7cea-bec1-28a58761edf9/style.json?key=wL3801y3iQsKfcXRxsF5',
	center: [-96.8, 32.8],
	zoom: 7.5,
	attributionControl: true
});

map.on('load', () => {
	mapReady = true;
	document.documentElement.dataset.mapReady = 'true';
	map.addSource('nws-alerts', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
	map.addLayer({ id: 'nws-alert-fill', type: 'fill', source: 'nws-alerts', paint: { 'fill-color': '#ef3e2f', 'fill-opacity': 0.16 } });
	map.addLayer({ id: 'nws-alert-line', type: 'line', source: 'nws-alerts', paint: { 'line-color': '#ff4c3c', 'line-width': 2.5, 'line-opacity': 0.9 } });
	map.addLayer({ id: 'nws-alert-selected', type: 'line', source: 'nws-alerts', paint: { 'line-color': '#ffe85b', 'line-width': 5, 'line-opacity': 0.95 }, filter: ['==', ['id'], ''] });
	map.on('click', 'nws-alert-fill', (event) => selectAlert(event.features[0]));
	map.on('mouseenter', 'nws-alert-fill', () => map.getCanvasContainer().classList.add('alert-hover'));
	map.on('mouseleave', 'nws-alert-fill', () => map.getCanvasContainer().classList.remove('alert-hover'));
	if (alertFeatures.length) map.getSource('nws-alerts').setData({ type: 'FeatureCollection', features: alertFeatures });
	if (frames.length) renderRadarFrame(currentFrame);
});

function alertBounds(geometry) {
	if (!geometry || !geometry.coordinates) return null;
	const points = [];
	function collect(value) {
		if (typeof value[0] === 'number') points.push(value);
		else value.forEach(collect);
	}
	collect(geometry.coordinates);
	if (!points.length) return null;
	const longitudes = points.map((point) => point[0]);
	const latitudes = points.map((point) => point[1]);
	return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
}

function selectAlert(feature) {
	const properties = feature.properties;
	if (mapReady && map.getLayer('nws-alert-selected')) map.setFilter('nws-alert-selected', ['==', ['id'], feature.id]);
	const bounds = alertBounds(feature.geometry);
	if (bounds) map.fitBounds(bounds, { padding: 100, maxZoom: 10, duration: 900 });
	document.querySelector('#warning-title').textContent = properties.event.toUpperCase();
	document.querySelector('#warning-event').textContent = `${properties.severity || 'UNKNOWN'} · ${properties.urgency || 'UNKNOWN'}`.toUpperCase();
	document.querySelector('#warning-areas').textContent = (properties.areaDesc || 'AREA NOT PROVIDED').toUpperCase();
	document.querySelector('#warning-expiry').textContent = properties.ends ? new Date(properties.ends).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase() : 'UNTIL FURTHER NOTICE';
	document.querySelector('#alert-info').classList.remove('is-hidden');
}

window.cooperdarSelectAlert = selectAlert;

function renderRadarFrame(index) {
	if (!frames.length || !mapReady) return;
	currentFrame = Math.min(index, frames.length - 1);
	const frame = frames[currentFrame];
	const tiles = [`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`];
	const source = map.getSource('rainviewer-radar');
	if (source) source.setTiles(tiles);
	else {
		map.addSource('rainviewer-radar', { type: 'raster', tiles, tileSize: 256, minzoom: 0, maxzoom: 12 });
		map.addLayer({ id: 'rainviewer-radar-layer', type: 'raster', source: 'rainviewer-radar', paint: { 'raster-opacity': 0.82 } });
	}
	['nws-alert-fill', 'nws-alert-line', 'nws-alert-selected'].forEach((layer) => { if (map.getLayer(layer)) map.moveLayer(layer); });
	const scan = new Date(frame.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	document.querySelector('#scan-time').textContent = `${scan.toUpperCase()} CT`;
	document.querySelector('#frame-time').textContent = scan;
	timeLabel.textContent = currentFrame === frames.length - 1 ? 'NOW' : scan.toUpperCase();
	range.max = frames.length - 1;
	range.value = currentFrame;
}

async function loadRadar() {
	try {
		const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
		const data = await response.json();
		frames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])].slice(-9);
		currentFrame = frames.length - 1;
		renderRadarFrame(currentFrame);
		document.querySelector('#updated-label').textContent = `RADAR UPDATED ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase()}`;
	} catch (error) {
		console.error('RainViewer radar unavailable', error);
	}
}

range.addEventListener('input', () => renderRadarFrame(Number(range.value)));
document.querySelector('#refresh-button').addEventListener('click', loadRadar);
document.querySelector('#zoom-in').addEventListener('click', () => map.zoomIn());
document.querySelector('#zoom-out').addEventListener('click', () => map.zoomOut());
document.querySelector('#locate-button').addEventListener('click', () => map.flyTo({ center: [-96.8, 32.8], zoom: 7.5 }));
map.on('zoom', () => { document.querySelector('#zoom-level').textContent = map.getZoom().toFixed(2); });
playButton.addEventListener('click', () => {
	if (timer) { clearInterval(timer); timer = undefined; playButton.textContent = '▶'; return; }
	playButton.textContent = 'Ⅱ';
	timer = setInterval(() => { if (frames.length) renderRadarFrame((currentFrame + 1) % frames.length); }, 850);
});
document.querySelector('#spc-button').addEventListener('click', () => document.querySelector('.radar-view').classList.toggle('spc-visible'));
document.querySelector('#alerts-button').addEventListener('click', () => document.querySelector('#alert-info').classList.toggle('is-hidden'));
document.querySelector('#close-alert').addEventListener('click', () => document.querySelector('#alert-info').classList.add('is-hidden'));

async function loadAlerts() {
	try {
		const response = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert');
		const alerts = (await response.json()).features || [];
		alertFeatures = alerts.map((feature, index) => ({ ...feature, id: feature.id || `nws-${index}` })).filter((feature) => feature.geometry);
		window.cooperdarAlerts = alertFeatures;
		if (mapReady) map.getSource('nws-alerts').setData({ type: 'FeatureCollection', features: alertFeatures });
		document.querySelector('#alert-count').textContent = alerts.length;
		const alert = alertFeatures.find((item) => /TX|Dallas|Fort Worth|Rockwall|Collin|Kaufman/i.test(`${item.properties.areaDesc} ${item.properties.geocode?.UGC || ''}`)) || alertFeatures[0] || alerts[0];
		if (!alert) {
			document.querySelector('#warning-title').textContent = 'NO ACTIVE ALERTS';
			document.querySelector('#warning-areas').textContent = 'NATIONAL FEED CLEAR';
			document.querySelector('#warning-expiry').textContent = '—';
			return;
		}
		const properties = alert.properties;
		selectAlert({ ...alert, id: alert.id || 'nws-selected', properties, geometry: alert.geometry });
		document.querySelector('#warning-title').textContent = properties.event.toUpperCase();
		document.querySelector('#warning-areas').textContent = properties.areaDesc.toUpperCase();
		document.querySelector('#warning-expiry').textContent = properties.ends ? new Date(properties.ends).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase() : 'UNTIL FURTHER NOTICE';
	} catch (error) {
		document.querySelector('#alert-count').textContent = '—';
		document.querySelector('#warning-title').textContent = 'NWS ALERTS OFFLINE';
	}
}

loadAlerts();
setInterval(loadAlerts, 300000);
loadRadar();
setInterval(loadRadar, 300000);
