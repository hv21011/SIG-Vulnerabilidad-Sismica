// Crear el mapa
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-89.2, 13.7],
  zoom: 6,
  pitch: 0,
  bearing: 0
});

// Agregar control de navegación
map.addControl(new maplibregl.NavigationControl());

//Escala
map.addControl(
  new maplibregl.ScaleControl({
    maxWidth: 100,
    unit: 'metric' 
  }),
  'bottom-right' // Posición: esquina inferior derecha
);

// Definición de capas WFS (accesible para controlCapa.js)
const capas = [
  ['sismos', 'Vulnerabilidad_Sismica:sismos_marn_2019_2024_pun', 'circle', {
    'circle-color': '#d5b43c',
    'circle-radius': [
      'step', ['get', 'magnitud'],
      2, 3.1, 3,
      3.4677, 4,
      3.8955, 5,
      3.9, 6,
      4.3433, 7
    ],
    'circle-opacity': 0.9,
    'circle-stroke-color': '#000',
    'circle-stroke-width': 0.5
  }],
  ['viviendas', 'Vulnerabilidad_Sismica:vulnerabilidad_en_zonas_urbanas_pol', 'fill-extrusion', {
    'fill-extrusion-color': [
      'step', ['get', 'PORC_O'],
      '#fff0fa', 0.1376,
      '#e6cbf3', 0.2376,
      '#cda6eb', 0.3376,
      '#b481e3', 0.4376,
      '#9b5cdb', 0.5376,
      '#8237d4', 0.6376,
      '#6912cc'
    ],
    'fill-extrusion-height': ['*', ['get', 'PORC_O'], 2000],
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': 0.9
  }],
  ['amenaza', 'Vulnerabilidad_Sismica:ameanza_sismica_pol', 'fill', {
    'fill-color': [
      'match', ['get', 'PGA_gal'],
      'Menor que 350 (Gal)', '#fee3d6',
      'De 350 a 380 (Gal)', '#fdc6af',
      'De 380 a 410 (Gal)', '#fca486',
      'De 410 a 440 (Gal)', '#fc8161',
      'De 440 a 470 (Gal)', '#f85d42',
      'De 470 a 500 (Gal)', '#ea372a',
      'De 500 a 530 (Gal)', '#cc191d',
      'Mayor que 530 (Gal)', '#a91016',
      '#67000d'
    ],
    'fill-opacity': 0.8,
    'fill-outline-color': '#333'
  }],
  ['distritos', 'Vulnerabilidad_Sismica:distritos_pol', 'fill', {
    'fill-color': '#FEB24C',
    'fill-opacity': 0.3,
  }],
  ['distritos_borde', 'Vulnerabilidad_Sismica:distritos_pol', 'line', {
    'line-color': '#e63f0e',      // Color del borde
    'line-width': 0.8             // Grosor del borde
  }],
  ['agua', 'Vulnerabilidad_Sismica:cuerpos_agua_pol', 'fill', {
    'fill-color': '#7fcdbb',
    'fill-opacity': 0.9,
    'fill-outline-color': '#337ab7'
  }],
  ['vias', 'Vulnerabilidad_Sismica:vias_principales_lin', 'line', {
    'line-color': '#ffffff',
    'line-width': 3,
  }],
  ['fallas', 'Vulnerabilidad_Sismica:fallas_geologicas_lin', 'line', {
    'line-color': '#491e00',
    'line-width': 2,
  }],
];

// Orden de prioridad de capas (accesible para popup.js)
const ordenPrioridad = ['distritos', 'distritos_borde', 'amenaza', 'deslizamientos-raster', 'viviendas', 'agua', 'vias', 'fallas','sismos'];


map.on('load', () => {
  // Agregar capa raster base
  map.addSource('base-raster', {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    ],
    tileSize: 256
  });

  map.addLayer({
    id: 'base-raster-layer',
    type: 'raster',
    source: 'base-raster'
  });

  // Añadir fuente de terreno (DEM)
  map.addSource('maplibre-dem', {
    type: 'raster-dem',
    url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=gfXnqgYat2OMneTvKs3L',
    tileSize: 256,
    maxzoom: 14
  });

  // Establecer terreno
  map.setTerrain({
    source: 'maplibre-dem',
    exaggeration: 3.5
  });

  // Agregar fuentes y capas WFS
  capas.forEach(([id, layerName, type, paint]) => {
    map.addSource(id, {
      type: 'geojson',
      data: `https://geoserver.thecrimsonlegacy.com/geoserver/Vulnerabilidad_Sismica/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application/json&typeName=${layerName}&srsName=EPSG:4326`
    });
    map.addLayer({
      id,
      type,
      source: id,
      paint,
      layout: { // Visibilidad inicial por capa
        visibility: ['distritos', 'agua', 'vias', 'distritos_borde'].includes(id) ? 'visible' : 'none'
      }
    });
  });

  //CAPA DESLIZAMIENTOS WMS
  map.addSource('deslizamientos-raster', {
    type: 'raster',
    tiles: [
      'https://geoserver.thecrimsonlegacy.com/geoserver/deslizamientos/wms?' +
      'service=WMS&version=1.1.0&request=GetMap&layers=deslizamientos:suceptibilidad' +
      '&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&TRANSPARENT=TRUE'
    ],
    tileSize: 256
  });

  map.addLayer({ // Agregar capa WMS
    id: 'deslizamientos-raster',
    type: 'raster',
    source: 'deslizamientos-raster',
    layout: {
      visibility: 'none' // Oculto por defecto
    }
  });

  // JERARQUÍA (Asegúrate de que tu base-raster-layer esté al fondo)
  if (map.getLayer('base-raster-layer')) map.moveLayer('base-raster-layer'); // Mover al fondo absoluto

  // Mover las demás capas encima de la base raster
  const layersToMoveUp = [
    'deslizamientos-raster', 'distritos', 'distritos_borde', 'amenaza',
    'viviendas', 'agua', 'vias', 'fallas', 'sismos'
  ];
  layersToMoveUp.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId); // Mueve la capa al tope; el orden en que se llaman establece su apilamiento
    }
  });

  // Evento para indicar que el mapa y las capas están cargadas
  const event = new Event('mapaready');
  document.dispatchEvent(event);
});
