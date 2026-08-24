document.documentElement.dataset.mapReady = 'false';
let frames = [];
let currentFrame = 0;
let mapReady = false;
const range = document.querySelector('#timeline');
const timeLabel = document.querySelector('#timeline-time');
const playButton = document.querySelector('#play-button');
let timer;

const map = new maplibregl.Map({
	container: 'map',
	style: 'https://api.maptiler.com/maps/019f3112-43d5-7cea-bec1-28a58761edf9/style.json?key=wL3801y3iQsKfcXRxsF5',
	center: [-96.8, 32.8],
	zoom: 7.5,
	attributionControl: true
});

map.on('load', () => {
	mapReady = true;
	if (frames.length) renderRadarFrame(currentFrame);
});

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

loadRadar();
setInterval(loadRadar, 300000);
fetch('https://api.weather.gov/alerts/active?status=actual').then((response) => response.json()).then((data) => { document.querySelector('#alert-count').textContent = data.features?.length ?? 0; }).catch(() => { document.querySelector('#alert-count').textContent = '—'; });
map.on('zoom', () => { document.querySelector('#zoom-level').textContent = map.getZoom().toFixed(2); });

range.addEventListener('input', () => renderRadarFrame(Number(range.value)));
document.querySelector('#refresh-button').addEventListener('click', loadRadar);
document.querySelector('#zoom-in').addEventListener('click', () => map.zoomIn());
document.querySelector('#zoom-out').addEventListener('click', () => map.zoomOut());
document.querySelector('#locate-button').addEventListener('click', () => map.flyTo({ center: [-96.8, 32.8], zoom: 7.5 }));
playButton.addEventListener('click', () => {
	if (timer) { clearInterval(timer); timer = undefined; playButton.textContent = '▶'; return; }
	playButton.textContent = 'Ⅱ';
	timer = setInterval(() => {
		if (frames.length) renderRadarFrame((currentFrame + 1) % frames.length);
	}, 850);
});
document.querySelector('#spc-button').addEventListener('click', () => document.querySelector('.radar-view').classList.toggle('spc-visible'));
document.querySelector('#alerts-button').addEventListener('click', () => document.querySelector('.warning-box').classList.toggle('hidden'));
