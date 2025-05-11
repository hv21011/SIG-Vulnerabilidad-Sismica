// popup
document.addEventListener('mapaready', () => {
  if (typeof map !== 'undefined' && typeof ordenPrioridad !== 'undefined') {
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ordenPrioridad // Utiliza la variable global definida en capa.js
      });
      if (!features.length) return;

      // Busca la entidad de la capa con mayor prioridad (última en ordenPrioridad)
      for (let i = ordenPrioridad.length - 1; i >= 0; i--) {
        const capaId = ordenPrioridad[i]; // Renombrado para claridad
        const f = features.find(ft => ft.layer.id === capaId);

        if (f) {
          const props = f.properties;
          let html = `<b>${capaId}</b><br/>`; // Usar capaId para el título inicial

          if (capaId === 'sismos') {
            html = `
              <strong>Sismo</strong><br>
              <b>Magnitud:</b> ${parseFloat(props.magnitud).toFixed(2)}<br>
              <b>Profundidad:</b> ${parseFloat(props.profundidad).toFixed(2)}<br>
              <b>Fecha:</b> ${props.fecha}<br>
              <b>Ubicación:</b> ${props.localizacion}<br>
              <b>Intensidad:</b> ${props.intensidad}`;
          } else if (capaId === 'viviendas') {
            html = `
              <strong>Viviendas vulnerables</strong><br>
              <b>N° Personas:</b> ${props.SUM_personas}<br>
              <b>N° Casas de concreto:</b> ${props.CONCRETO_O}<br>
              <b>N° Casas otro material:</b> ${props.OTROS}
              <b>Vulnerabilidad:</b> ${parseFloat(props.PORC_O * 100).toFixed(2)}%<br>`;
          } else if (capaId === 'amenaza') {
            html = `<b>Amenaza sísmica:</b> ${props.PGA_gal}`;
          } else if (capaId === 'agua') {
            html = `${props.Nombre || 'N/A'}`;
          } else if (capaId === 'distritos') {
            html = `${props.NAM || 'N/A'}`;
          } 

          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
          break; // Salir del bucle una vez que se muestra el popup de la capa de mayor prioridad
        }
      }
    });
  } else {
    console.error("Mapa o 'ordenPrioridad' no están definidos. Asegurese que capa.js se cargue primero.");
  }
});