document.addEventListener('mapaready', () => {
  if (typeof map !== 'undefined' && typeof capas !== 'undefined') {
    // Perspectiva 3D
    let vista3DActiva = true; // Inicia como si estuviera activa para que el primer clic la desactive 
    const toggle3DButton = document.getElementById('toggle3D');

    if (toggle3DButton) {
        // Inicializa el texto del botón según el estado inicial de pitch/bearing del mapa
        if (map.getPitch() !== 0 || map.getBearing() !== 0) {
            vista3DActiva = true;
            toggle3DButton.textContent = 'Desactivar perspectiva 3D';
        } else {
            vista3DActiva = false;
            toggle3DButton.textContent = 'Activar perspectiva 3D';
        }

        toggle3DButton.addEventListener('click', function () {
            vista3DActiva = !vista3DActiva;
            map.easeTo({
              pitch: vista3DActiva ? 50 : 0,
              bearing: vista3DActiva ? -10 : 0,
              duration: 1000
            });
            this.textContent = vista3DActiva ? 'Desactivar perspectiva 3D' : 'Activar perspectiva 3D';
        });
    }


    // Control de visibilidad de capas y cursor
    map.on('mousemove', (e) => {
      const featuresSismos = map.queryRenderedFeatures(e.point, {
        layers: ['sismos'] // solo para la capa de sismos
      });
      map.getCanvas().style.cursor = featuresSismos.length ? 'pointer' : '';
    });

    // Checkbox de control de visibilidad para capa de deslizamientos (WMS)
    const chkDeslizamientos = document.getElementById('chkDeslizamientos');
    if (chkDeslizamientos) {
      chkDeslizamientos.addEventListener('change', function(e) {
        map.setLayoutProperty('deslizamientos-raster', 'visibility', e.target.checked ? 'visible' : 'none');
      });
    }

    // Checkbox de control de visibilidad para capas WFS (definidas en la variable 'capas')
    capas.forEach(([id]) => {
      const chk = document.getElementById('chk' + id.charAt(0).toUpperCase() + id.slice(1));
      if (chk) {
        // Establecer el estado inicial del checkbox basado en la visibilidad de la capa
        const visibility = map.getLayoutProperty(id, 'visibility');
        chk.checked = (visibility === 'visible');

        chk.addEventListener('change', (e) => {
          map.setLayoutProperty(id, 'visibility', e.target.checked ? 'visible' : 'none');
        });
      }
    });

  } else {
    console.error("Mapa o 'capas' no están definidos. Asegurese de que capa.js se cargue primero.");
  }
});

// Para mostrar/ocultar leyenda
function toggleLeyenda(id) {
  const leyenda = document.getElementById(id);
  if (!leyenda) return;
  const toggle = leyenda.previousElementSibling; // Asume que el botón toggle está justo antes de la leyenda

  if (leyenda.style.display === 'block' || leyenda.style.display === '') { // Considerar '' como visible por defecto
    leyenda.style.display = 'none';
    if (toggle) toggle.textContent = '[+]';
  } else {
    leyenda.style.display = 'block';
    if (toggle) toggle.textContent = '[–]';
  }
}