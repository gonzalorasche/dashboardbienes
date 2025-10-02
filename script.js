function normalizar(valor) {
  return valor ? valor.trim().toUpperCase().replace(/[\r\n"]/g, '') : '';
}

function configurarBotones() {
  document.getElementById('btnFiltrar').onclick = aplicarFiltros;

document.getElementById('btnLimpiar').onclick = () => {
  document.getElementById('estado').value = 'TODOS';
  document.getElementById('asignacion').value = 'TODOS';
  document.getElementById('taller').value = 'TODOS';
  document.getElementById('agente').value = 'TODOS';
  document.getElementById('prioridad').value = 'TODOS'; // ← esta línea es nueva
  document.getElementById('buscar').value = '';

  // Desmarcar todas las etapas
  document.querySelectorAll('#etapaDropdown input[type="checkbox"]').forEach(cb => cb.checked = false);

  document.getElementById('seccionesPedido').style.display = 'none';
  aplicarFiltros();
};


  document.getElementById('btnPedido').onclick = mostrarDetallePedido;

  // Toggle del menú de etapas
  document.querySelector('.dropdown-toggle').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('etapaDropdown').classList.toggle('open');
  };

  // Marcar todas
  document.getElementById('marcarTodasEtapas').onclick = () => {
    document.querySelectorAll('#etapaDropdown input[type="checkbox"]').forEach(cb => cb.checked = true);
  };

  // Desmarcar todas
  document.getElementById('desmarcarTodasEtapas').onclick = () => {
    document.querySelectorAll('#etapaDropdown input[type="checkbox"]').forEach(cb => cb.checked = false);
  };
}

// Cierre del menú al hacer clic fuera
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('etapaDropdown');
  if (!dropdown.contains(event.target)) {
    dropdown.classList.remove('open');
  }
});

function actualizarContadorPendientes(lista) {
  const pendientes = lista.filter(p => normalizar(p.ESTADO) === 'PENDIENTE');
  document.getElementById('contadorPendientes').textContent = pendientes.length;
}

function aplicarFiltros() {
  document.getElementById('tablaPedidos').style.display = 'block';
  document.getElementById('seccionesPedido').style.display = 'none';

  const estado = document.getElementById('estado').value;
  const asignacion = document.getElementById('asignacion').value;
  const taller = document.getElementById('taller').value;
  const agente = document.getElementById('agente').value;
  const prioridad = document.getElementById('prioridad')?.value || 'TODOS';
  const pedidoBuscado = document.getElementById('buscar')?.value.trim();

  // Obtener etapas seleccionadas
  const etapaChecks = document.querySelectorAll('#etapaDropdown input[type="checkbox"]');
  const etapasSeleccionadas = Array.from(etapaChecks)
    .filter(c => c.checked)
    .map(c => normalizar(c.value));

  const filtrados = pedidosData.filter(p => {
    if (normalizar(p.ESTADO) === 'SERVICIOS') return false;

    const estadoOk = estado === 'TODOS' || normalizar(p.ESTADO) === normalizar(estado);
    const tallerOk = taller === 'TODOS' || normalizar(p.RUBRO) === normalizar(taller);
    const etapaOk = etapasSeleccionadas.length === 0 || etapasSeleccionadas.includes(normalizar(p.ETAPA));
    const agenteOk = agente === 'TODOS' || normalizar(p.AGENTE) === normalizar(agente);
    const prioridadOk = prioridad === 'TODOS' || normalizar(p.PRIORIDAD) === normalizar(prioridad);
    const pedidoOk = pedidoBuscado === '' || normalizar(p['CÓDIGO']).includes(normalizar(pedidoBuscado));

    let asignacionOk = true;
    const valorAsignacion = normalizar(p['ASIGNACIÓN']);
    if (asignacion === 'ASIGNADO') {
      asignacionOk = valorAsignacion === 'ASIGNADO';
    } else if (asignacion === 'SIN ASIGNAR') {
      asignacionOk = valorAsignacion === 'SIN ASIGNAR';
    }

    return estadoOk && tallerOk && etapaOk && agenteOk && prioridadOk && pedidoOk && asignacionOk;
  });

  const contenedor = document.getElementById('tablaPedidos');
  contenedor.innerHTML = '';

  const tabla = document.createElement('table');
  const encabezados = ['ID', 'F. INGRESO', 'PRIORIDAD', 'TALLER', 'ETAPA', 'P/ USO EN', 'AGENTE', 'ASIGNACIÓN', 'ESTADO', 'DÍAS TRANSCURRIDOS'];
  const claves = ['CÓDIGO', 'FECHA DE INGRESO', 'PRIORIDAD', 'RUBRO', 'ETAPA', 'LOCAL', 'AGENTE', 'ASIGNACIÓN', 'ESTADO'];

  const thead = document.createElement('thead');
  const filaEncabezado = document.createElement('tr');
  encabezados.forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    filaEncabezado.appendChild(th);
  });
  thead.appendChild(filaEncabezado);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
// Agregar propiedad DIAS_TRANSCURRIDOS a cada pedido
filtrados.forEach(p => {
  const fechaTexto = p['FECHA DE INGRESO'];
  const fecha = new Date(fechaTexto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
  const hoy = new Date();
  const dias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
  p.DIAS_TRANSCURRIDOS = isNaN(dias) ? -1 : dias;
});

// Ordenar por días transcurridos (mayor a menor)
filtrados.sort((a, b) => b.DIAS_TRANSCURRIDOS - a.DIAS_TRANSCURRIDOS);

// Construir tabla
filtrados.forEach(p => {
  const fila = document.createElement('tr');

  claves.forEach((clave, i) => {
    const td = document.createElement('td');
    if (i === 0) {
      td.classList.add('id');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = p[clave];
      link.onclick = (e) => {
        e.preventDefault();
        document.getElementById('buscar').value = p[clave];
        mostrarDetallePedido();
      };
      td.appendChild(link);
    } else {
      td.textContent = p[clave];
    }

    if (clave === 'PRIORIDAD') {
      const prioridadValor = normalizar(p[clave]);
      if (prioridadValor === 'ALTA') td.classList.add('prioridad-alta');
      else if (prioridadValor === 'NORMAL') td.classList.add('prioridad-normal');
      else if (prioridadValor === 'BAJA') td.classList.add('prioridad-baja');
    }

    fila.appendChild(td);
  });

  const tdDias = document.createElement('td');
  tdDias.textContent = p.DIAS_TRANSCURRIDOS >= 0 ? p.DIAS_TRANSCURRIDOS : '-';
  fila.appendChild(tdDias);

  tbody.appendChild(fila);
});

  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);

  actualizarContadorPendientes(filtrados);
}


function mostrarDetallePedido() {
  const codigoBuscado = normalizar(document.getElementById('buscar').value);
  const pedido = pedidosData.find(p => normalizar(p['CÓDIGO']) === codigoBuscado);

  document.getElementById('tablaPedidos').style.display = 'none';
  document.getElementById('seccionesPedido').style.display = 'block';

  const contenedor = document.getElementById('detallePedido');
  contenedor.innerHTML = '';

  if (!pedido) {
    contenedor.innerHTML = '<h2>NO EXISTE ESE CÓDIGO</h2>';
    document.getElementById('resumenPedido').innerHTML = '';
    document.getElementById('empresasCotizadas').innerHTML = '';
    document.getElementById('adjudicaciones').innerHTML = '';
    return;
  }

  // BLOQUE 1 - Resumen del pedido
  const resumen = document.getElementById('resumenPedido');
  resumen.innerHTML = '';

  const diasTranscurridos = (() => {
    const fechaTexto = pedido['FECHA DE INGRESO'];
    const fecha = new Date(fechaTexto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
    const hoy = new Date();
    const dias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
    return isNaN(dias) ? '-' : dias;
  })();

  const resumenHTML = `
    <div class="id">PEDIDO #${pedido['CÓDIGO']}</div>
    <div class="dato"><span>Taller:</span><span>${pedido['RUBRO']}</span></div>
    <div class="dato"><span>Fecha de ingreso:</span><span>${pedido['FECHA DE INGRESO']}</span></div>
    <div class="dato"><span>Prioridad:</span><span>${pedido['PRIORIDAD']}</span></div>
    <div class="dato"><span>Días transcurridos:</span><span>${diasTranscurridos}</span></div>
    <div class="dato etapa"><span>Etapa:</span><span>${pedido['ETAPA']}</span></div>
    <div class="dato"><span>Agente asignado:</span><span>${pedido['AGENTE']}</span></div>
  `;
  resumen.innerHTML = resumenHTML;

  // BLOQUE 3 - Empresas cotizadas
  const empresas = document.getElementById('empresasCotizadas');
  empresas.innerHTML = '';

  const tituloEmpresas = document.createElement('h3');
  tituloEmpresas.textContent = 'EMPRESAS A LAS QUE SE SOLICITÓ PRESUPUESTO';
  empresas.appendChild(tituloEmpresas);

  const lista = document.createElement('ul');
  for (let letra of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const nombre = pedido[`EMPRESA ${letra}`];
    if (nombre && nombre.trim() !== '') {
      const li = document.createElement('li');
      li.textContent = nombre;
      lista.appendChild(li);
    }
  }

  if (lista.children.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No se registraron empresas cotizadas.';
    lista.appendChild(li);
  }

  empresas.appendChild(lista);

  // BLOQUE 5 - Comentarios del pedido
  const comentarios = document.getElementById('comentariosPedido');
  comentarios.innerHTML = '';

  const tituloComentarios = document.createElement('h3');
  tituloComentarios.textContent = 'COMENTARIOS';
  comentarios.appendChild(tituloComentarios);

  const contenido = document.createElement('div');
  contenido.className = 'contenido';

  let textoComentarios = pedido['COMENTARIOS']?.trim() || 'Sin comentarios registrados.';
  const fechaHoraRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4} \d{1,2}:\d{2})/g;
  textoComentarios = textoComentarios.replace(fechaHoraRegex, '<br><br><strong>$1</strong>');
  contenido.innerHTML = textoComentarios;
  comentarios.appendChild(contenido);

  // BLOQUE 4 - Empresas adjudicadas
  const adjudicaciones = document.getElementById('adjudicaciones');
  adjudicaciones.innerHTML = '';

  const tituloAdj = document.createElement('h3');
  tituloAdj.textContent = 'EMPRESAS ADJUDICADAS';
  adjudicaciones.appendChild(tituloAdj);

  const empresasOriginales = ['EMPRESA A', 'EMPRESA B', 'EMPRESA C', 'EMPRESA D', 'EMPRESA E', 'EMPRESA F']
    .map(col => pedido[col])
    .filter(e => e && e.trim() !== '');

  const empresasAdjudicadas = new Set();
  for (let i = 1; i <= 20; i++) {
    const adjudicada = pedido[`ADJUDICACIÓN ITEM ${i}`];
    if (empresasOriginales.includes(adjudicada)) {
      empresasAdjudicadas.add(adjudicada);
    }
  }

  const empresaColorMap = {};
  Array.from(empresasAdjudicadas).forEach((empresa, index) => {
    empresaColorMap[empresa] = `color-${index % 7}`;
  });

  const listaEmpresas = document.createElement('ul');
  Array.from(empresasAdjudicadas).forEach(empresa => {
    const li = document.createElement('li');
    const colorBox = document.createElement('div');
    colorBox.className = `adjudicacion-color ${empresaColorMap[empresa]}`;
    li.appendChild(colorBox);
    li.appendChild(document.createTextNode(empresa));
    listaEmpresas.appendChild(li);
  });
  adjudicaciones.appendChild(listaEmpresas);

  // BLOQUE 5 - Tabla de ítems del pedido
  const titulo = document.createElement('h2');
  titulo.textContent = `Detalle del pedido ${pedido['CÓDIGO']}`;
  contenedor.appendChild(titulo);

  const tabla = document.createElement('table');
  tabla.classList.add('tabla-items');

  const thead = document.createElement('thead');
  const filaEncabezado = document.createElement('tr');
  ['CANTIDAD', 'DETALLE'].forEach(t => {
    const th = document.createElement('th');
    th.textContent = t;
    filaEncabezado.appendChild(th);
  });
  thead.appendChild(filaEncabezado);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 1; i <= 20; i++) {
    const cantidad = pedido[`UNIDADES ${i}`];
    const item = pedido[`ITEM${i}`];

    if (cantidad || item) {
      const fila = document.createElement('tr');
      const tdCantidad = document.createElement('td');
      tdCantidad.textContent = cantidad || '-';
      const tdItem = document.createElement('td');
      tdItem.textContent = item || '-';
      fila.appendChild(tdCantidad);
      fila.appendChild(tdItem);
      tbody.appendChild(fila);
    }
  }

  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);

  const filasItems = tabla.querySelectorAll('tbody tr');
  filasItems.forEach((fila, index) => {
    const adjudicada = pedido[`ADJUDICACIÓN ITEM ${index + 1}`];
    const colorClass = empresaColorMap[adjudicada];
    if (colorClass) {
      fila.children[0].classList.add(colorClass);
      fila.children[1].classList.add(colorClass);
    }
  });
}

document.getElementById('btnVolver').onclick = () => {
  document.getElementById('buscar').value = ''; // ← Esto borra el N° de pedido
  document.getElementById('seccionesPedido').style.display = 'none';
  document.getElementById('tablaPedidos').style.display = 'block';
};

const toggleBtn = document.getElementById('toggleFiltros');
const filtros = document.querySelector('.nav-filtros');

toggleBtn.addEventListener('click', () => {
  filtros.classList.toggle('offcanvas');
  filtros.classList.toggle('open');
});


// Inicializar al cargar
window.onload = () => {
  configurarBotones();
  aplicarFiltros();
};

