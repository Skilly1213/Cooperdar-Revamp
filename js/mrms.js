window.pyartMrmsSites = [
  { id: 'KFWS', name: 'Fort Worth', region: 'North Texas', state: 'TX', latitude: 32.5739, longitude: -97.3031, pyart_supported: true },
  { id: 'KDFX', name: 'Laughlin', region: 'North Texas', state: 'TX', latitude: 29.333, longitude: -100.283, pyart_supported: true },
  { id: 'KTLX', name: 'Oklahoma City', region: 'Central Plains', state: 'OK', latitude: 35.333, longitude: -97.277, pyart_supported: true },
  { id: 'KOUN', name: 'Norman', region: 'South Central', state: 'OK', latitude: 35.236, longitude: -97.471, pyart_supported: true },
  { id: 'KAMA', name: 'Amarillo', region: 'Texas Panhandle', state: 'TX', latitude: 35.233, longitude: -101.709, pyart_supported: true },
  { id: 'KGRK', name: 'Gray', region: 'Central Texas', state: 'TX', latitude: 30.721, longitude: -97.382, pyart_supported: true },
  { id: 'KHGX', name: 'Houston', region: 'Gulf Coast', state: 'TX', latitude: 29.471, longitude: -95.079, pyart_supported: true },
  { id: 'KCRP', name: 'Corpus Christi', region: 'South Texas', state: 'TX', latitude: 27.783, longitude: -97.511, pyart_supported: true },
  { id: 'KMAF', name: 'Midland', region: 'West Texas', state: 'TX', latitude: 31.943, longitude: -102.189, pyart_supported: true },
  { id: 'KLBB', name: 'Lubbock', region: 'High Plains', state: 'TX', latitude: 33.654, longitude: -101.814, pyart_supported: true },
  { id: 'KSHV', name: 'Shreveport', region: 'Ark-La-Tex', state: 'LA', latitude: 32.451, longitude: -93.841, pyart_supported: true },
  { id: 'KDYX', name: 'Dyess', region: 'West Texas', state: 'TX', latitude: 32.538, longitude: -99.254, pyart_supported: true }
];

window.getPyartMrmsSite = function(siteId) {
  const id = (siteId || 'KFWS').toUpperCase();
  return (window.pyartMrmsSites || []).find((site) => site.id === id) || (window.pyartMrmsSites || [])[0] || null;
};

window.getRadarSiteSelector = function() {
  const selector = document.querySelector('#radar-site-select');
  if (selector) {
    selector.innerHTML = (window.pyartMrmsSites || []).map((site) => `<option value="${site.id}" ${site.id === 'KFWS' ? 'selected' : ''}>${site.id} · ${site.name}</option>`).join('');
  }
  return selector;
};

window.getCurrentPyartSite = function() {
  const selector = document.querySelector('#radar-site-select');
  const chosenId = selector ? selector.value : 'KFWS';
  return window.getPyartMrmsSite(chosenId);
};

window.loadPyartMrmsCatalog = async function() {
  try {
    const response = await fetch('radar_sites.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('radar_sites.json unavailable');
    const catalog = await response.json();
    if (Array.isArray(catalog.sites) && catalog.sites.length) {
      window.pyartMrmsSites = catalog.sites.map((site) => ({
        id: site.id,
        name: site.name,
        region: site.region,
        state: site.state,
        latitude: site.latitude,
        longitude: site.longitude,
        pyart_supported: !!site.pyart_supported
      }));
    }
    return window.pyartMrmsSites;
  } catch (error) {
    console.warn('Using embedded PyART MRMS site catalog fallback.', error);
    return window.pyartMrmsSites;
  }
};

window.updateRadarSiteLabel = function(siteId) {
  const site = window.getPyartMrmsSite(siteId);
  const tower = document.querySelector('#tower-site');
  if (tower && site) tower.textContent = site.id;
  const regionLabel = document.querySelector('#current-region-label');
  if (regionLabel && site) regionLabel.textContent = site.region;
};

window.addEventListener('DOMContentLoaded', () => {
  const selector = window.getRadarSiteSelector();
  if (selector) {
    selector.addEventListener('change', (event) => {
      const siteId = event.target.value;
      window.updateRadarSiteLabel(siteId);
      document.querySelector('#site-status').textContent = `PYART · ${siteId}`;
    });
  }
  window.updateRadarSiteLabel('KFWS');
});
