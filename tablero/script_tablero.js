document.addEventListener("DOMContentLoaded", () => {
  const tablero = document.getElementById("tablero");
  const ordenar = document.getElementById("ordenar");
  const detalle = document.getElementById("detalle");
  const volver = document.getElementById("volver");
  const detalleBody = document.getElementById("detalle-body");
  const etapaSello = document.getElementById("etapa-sello");
  const buscarInput = document.getElementById("buscarItem");
  const btnBuscar = document.getElementById("btnBuscar");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const filtroPendientes = document.getElementById("filtroPendientes");
  const filtroFinalizados = document.getElementById("filtroFinalizados");
  const buscarLugar = document.getElementById("buscarLugar");
  const btnBuscarLugar = document.getElementById("btnBuscarLugar");


  let pedidosOriginales = pedidosData;
  let currentGrouping = "RUBRO";

  renderTableroAgrupado(pedidosOriginales, currentGrouping);

btnBuscar.addEventListener("click", () => {
  const textoItem = buscarInput.value.toLowerCase();
  const textoLugar = buscarLugar.value.toLowerCase();
  const estadoPendiente = filtroPendientes.checked;
  const estadoFinalizado = filtroFinalizados.checked;

  const filtrados = pedidosOriginales.filter(pedido => {
    let coincideItem = true;
    let coincideLugar = true;
    let coincideEstado = true;

    // 🔍 Filtro por ítems
    if (textoItem) {
      coincideItem = false;
      for (let i = 1; i <= 20; i++) {
        const campo = pedido[`ITEM${i}`];
        if (campo && campo.toLowerCase().includes(textoItem)) {
          coincideItem = true;
          break;
        }
      }
    }

    // 🔍 Filtro por lugar
    if (textoLugar) {
      const lugar = pedido["LOCAL"] || "";
      coincideLugar = lugar.toLowerCase().includes(textoLugar);
    }

    // ✅ Filtro por estado
    if (estadoPendiente || estadoFinalizado) {
      const estado = (pedido["ESTADO"] || "").toUpperCase();
      coincideEstado = (
        (estadoPendiente && estado === "PENDIENTE") ||
        (estadoFinalizado && estado === "FINALIZADO")
      );
    }

    return coincideItem && coincideLugar && coincideEstado;
  });

  renderTableroAgrupado(filtrados, currentGrouping);
});


btnLimpiar.addEventListener("click", () => {
  buscarInput.value = "";
  buscarLugar.value = "";
  filtroPendientes.checked = false;
  filtroFinalizados.checked = false;
  renderTableroAgrupado(pedidosOriginales, currentGrouping);
});


  ordenar.addEventListener("change", () => {
    currentGrouping = ordenar.value;
    renderTableroAgrupado(pedidosOriginales, currentGrouping);
  });

function mostrarDetalle(pedido) {
  document.getElementById("titulo-detalle").textContent = `PEDIDO ${pedido["CÓDIGO"] || "-"}`;

  detalleBody.innerHTML = "";

  etapaSello.textContent = pedido["ETAPA"] || "";
  etapaSello.setAttribute("data-etapa", pedido["ETAPA"] || "");

  // 🔹 Tabla de ítems con encabezado único
  const tabla = document.createElement("table");

  const thead = document.createElement("thead");
  const encabezado = document.createElement("tr");
  encabezado.innerHTML = "<th>CANTIDAD</th><th>ITEM</th>";
  thead.appendChild(encabezado);
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let i = 1; i <= 20; i++) {
    const cantidad = pedido[`UNIDADES ${i}`];
    const item = pedido[`ITEM${i}`];
    if ((cantidad && cantidad !== "-") || (item && item !== "-")) {
      const fila = document.createElement("tr");
      fila.innerHTML = `<td>${cantidad || ""}</td><td>${item || ""}</td>`;
      tbody.appendChild(fila);
    }
  }

  tabla.appendChild(tbody);
  detalleBody.appendChild(tabla);

 // 🔹 Sección COMENTARIOS
const comentariosTexto = pedido["COMENTARIOS"] || "";
if (comentariosTexto.trim() !== "") {
  const comentariosContainer = document.createElement("div");
  comentariosContainer.className = "detalle-seccion";

  const comentariosTitulo = document.createElement("h3");
  comentariosTitulo.textContent = "COMENTARIOS";
  comentariosContainer.appendChild(comentariosTitulo);

  // Expresión regular para detectar todas las fechas con hora
  const regex = /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})(.*?)(?=(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})|$)/gs;

  const comentarios = [];
  let match;
  while ((match = regex.exec(comentariosTexto)) !== null) {
    const fecha = match[1];
    const texto = match[2].trim();
    comentarios.push({ fecha, texto });
  }

  // Ordenar de más nuevo a más viejo
  comentarios.sort((a, b) => {
    const fechaA = new Date(a.fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
    const fechaB = new Date(b.fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3"));
    return fechaB - fechaA;
  });

  const lista = document.createElement("ul");
  comentarios.forEach(com => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${com.fecha}</strong><br>${com.texto}`;
    lista.appendChild(li);
  });

  comentariosContainer.appendChild(lista);
  detalleBody.appendChild(comentariosContainer);
}




  // 🔹 Sección LUGAR
  const lugarContainer = document.createElement("div");
  lugarContainer.className = "detalle-seccion";

  const lugarTitulo = document.createElement("h3");
  lugarTitulo.textContent = "LUGAR";
  lugarContainer.appendChild(lugarTitulo);

  const lugarParrafo = document.createElement("p");
  lugarParrafo.textContent = pedido["LOCAL"] || "-";
  lugarContainer.appendChild(lugarParrafo);

  detalleBody.appendChild(lugarContainer);

  detalle.classList.remove("oculto");
}


  volver.addEventListener("click", () => {
    detalle.classList.add("oculto");
  });

  function makeDraggable(card, pedido) {
    card.setAttribute("draggable", "true");
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", JSON.stringify(pedido));
    });
  }

  function enableDrop(columna, criterio) {
    columna.addEventListener("dragover", e => e.preventDefault());
    columna.addEventListener("drop", e => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      data[criterio] = columna.getAttribute("data-grupo");
      const index = pedidosOriginales.findIndex(p => p["CÓDIGO"] === data["CÓDIGO"]);
      if (index !== -1) pedidosOriginales[index] = data;
      renderTableroAgrupado(pedidosOriginales, criterio);
    });
  }

  function enableColumnDrag(columna) {
    columna.setAttribute("draggable", "true");
    columna.addEventListener("dragstart", e => {
      columna.classList.add("dragging");
      e.dataTransfer.setData("columna", columna.getAttribute("data-grupo"));
    });
    columna.addEventListener("dragend", () => {
      columna.classList.remove("dragging");
    });
    columna.addEventListener("dragover", e => e.preventDefault());
    columna.addEventListener("drop", e => {
      e.preventDefault();
      const draggedGrupo = e.dataTransfer.getData("columna");
      const columnas = Array.from(tablero.children);
      const dragged = columnas.find(c => c.getAttribute("data-grupo") === draggedGrupo);
      const target = columna;
      if (dragged && target && dragged !== target) {
        tablero.insertBefore(dragged, target);
      }
    });
  }

function renderTableroAgrupado(data, criterio) {
  tablero.innerHTML = "";

  const grupos = {};
  data.forEach(pedido => {
    const clave = pedido[criterio] || "SIN CLASIFICAR";
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(pedido);
  });

  // 🔹 Orden personalizado
  let clavesOrdenadas = Object.keys(grupos);

  const ordenEtapas = [
    "NO INICIADO",
    "ASIGNADO",
    "RECEPCIÓN DE PRESUPUESTO",
    "ADJUDICADO",
    "RECIBIDO",
    "FACTURA ELEVADA",
    "PAGO POR ADELANTO",
    "ABONADO",
    "CANCELADO"
  ];

  const ordenPrioridad = ["ALTA", "NORMAL", "BAJA"];

  if (criterio === "ETAPA") {
    clavesOrdenadas = ordenEtapas.filter(etapa => clavesOrdenadas.includes(etapa));
    const extras = Object.keys(grupos).filter(e => !ordenEtapas.includes(e));
    clavesOrdenadas = clavesOrdenadas.concat(extras);
  }

  if (criterio === "PRIORIDAD") {
    clavesOrdenadas = ordenPrioridad.filter(p => clavesOrdenadas.includes(p));
    const extras = Object.keys(grupos).filter(p => !ordenPrioridad.includes(p));
    clavesOrdenadas = clavesOrdenadas.concat(extras);
  }

  // 🔹 Renderizar columnas
  clavesOrdenadas.forEach(grupo => {
    const columna = document.createElement("div");
    columna.className = "columna";
    columna.setAttribute("data-grupo", grupo);

    const claseGrupo = grupo === "-" ? "sin-etapa" : grupo.replace(/\s+/g, "-").toLowerCase();
    columna.classList.add(`grupo-${claseGrupo}`);

    const encabezado = document.createElement("h2");
    encabezado.textContent = grupo;
    columna.appendChild(encabezado);

    const tarjetasContenedor = document.createElement("div");
    tarjetasContenedor.className = "tarjetas-contenedor";

    grupos[grupo].sort((a, b) => new Date(a["FECHA DE INGRESO"]) - new Date(b["FECHA DE INGRESO"]));

    grupos[grupo].forEach(pedido => {
      const card = document.createElement("div");
      card.className = "tarjeta";
      card.setAttribute("data-prioridad", pedido["PRIORIDAD"]);
      card.innerHTML = `
        <h3>${pedido["CÓDIGO"]}</h3>
        <p><strong>Taller:</strong> ${pedido["RUBRO"]}</p>
        <p><strong>Etapa:</strong> ${pedido["ETAPA"]}</p>
        <p><strong>Ingreso:</strong> ${pedido["FECHA DE INGRESO"]}</p>
        <p><strong>Prioridad:</strong> ${pedido["PRIORIDAD"]}</p>
        <button>Ver detalles</button>
      `;
      card.querySelector("button").addEventListener("click", () => mostrarDetalle(pedido));
      makeDraggable(card, pedido);
      tarjetasContenedor.appendChild(card);
    });

    columna.appendChild(tarjetasContenedor);
    enableDrop(tarjetasContenedor, criterio);
    enableColumnDrag(columna);
    tablero.appendChild(columna);
  });
}

});
