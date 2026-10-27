// --- CONFIGURACIÓN Y LOGIN ---
function inicializarUsuariosPorDefecto() {
    let usuarios = JSON.parse(localStorage.getItem('sistema_usuarios')) || [];
    if (usuarios.length === 0) {
        usuarios.push({
            id: 1,
            usuario: "admin",
            nombre: "Administrador",
            apellido: "Maestro",
            password: "admin",
            permisos: ["almacen", "historial", "camping", "reportes", "master"],
            esMaster: true
        });
        localStorage.setItem('sistema_usuarios', JSON.stringify(usuarios));
    }
}
inicializarUsuariosPorDefecto();

document.getElementById('masterNombre')?.addEventListener('input', actualizarUsuarioGenerado);
document.getElementById('masterApellido')?.addEventListener('input', actualizarUsuarioGenerado);

function actualizarUsuarioGenerado() {
    const nombre = document.getElementById('masterNombre').value.trim().toLowerCase();
    const apellido = document.getElementById('masterApellido').value.trim().toLowerCase();
    const inputGen = document.getElementById('masterUserGenerado');
    if(inputGen) {
        inputGen.value = nombre && apellido ? `${nombre}.${apellido.charAt(0)}` : '';
    }
}

function generarPasswordAleatorio() {
    const passAleatorio = Math.floor(10000 + Math.random() * 90000).toString();
    document.getElementById('masterPass').value = passAleatorio;
}

function iniciarSesion() {
    const userIngresado = document.getElementById('loginUser').value.trim();
    const passIngresado = document.getElementById('loginPass').value.trim();
    const errorLbl = document.getElementById('loginError');

    const usuarios = JSON.parse(localStorage.getItem('sistema_usuarios')) || [];
    const usuarioEncontrado = usuarios.find(u => u.usuario === userIngresado && u.password === passIngresado);

    if (usuarioEncontrado) {
        localStorage.setItem('usuario_activo', JSON.stringify(usuarioEncontrado));
        cargarInterfazSegunUsuario(usuarioEncontrado);
    } else {
        errorLbl.innerText = "Usuario o contraseña incorrectos.";
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuario_activo');
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
}

function cargarInterfazSegunUsuario(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.getElementById('lblUserSession').innerText = `${user.nombre} (${user.esMaster ? 'Admin' : 'Usuario'})`;

    const navContainer = document.getElementById('sidebarNavContainer');
    navContainer.innerHTML = '';

    const opcionesDisponibles = [
        { id: 'almacen', nombre: 'Gestión Almacén', permiso: 'almacen' },
        { id: 'historial', nombre: 'Stock e Historial', permiso: 'historial' },
        { id: 'camping', nombre: 'Módulo Camping', permiso: 'camping' },
        { id: 'reportes', nombre: 'API Reportes', permiso: 'reportes' },
        { id: 'master', nombre: 'Panel Maestro', permiso: 'master' }
    ];

    let primeraVistaValida = '';

    opcionesDisponibles.forEach(op => {
        let tienePermiso = user.esMaster || user.permisos.includes(op.permiso);
        if (tienePermiso) {
            if (!primeraVistaValida) primeraVistaValida = op.id;
            const btn = document.createElement('button');
            btn.className = `nav-item ${primeraVistaValida === op.id ? 'active' : ''}`;
            btn.innerText = op.nombre;
            btn.onclick = (e) => cambiarVista(op.id, e);
            navContainer.appendChild(btn);
        }
    });

    if (primeraVistaValida) {
        cambiarVista(primeraVistaValida, { currentTarget: navContainer.firstChild });
    }
    if (user.esMaster) {
        cargarTablaUsuariosMaster();
    }
}

// --- PANEL MAESTRO ---
function crearNuevoUsuario() {
    const nombre = document.getElementById('masterNombre').value.trim();
    const apellido = document.getElementById('masterApellido').value.trim();
    const password = document.getElementById('masterPass').value.trim();
    const usuarioGen = document.getElementById('masterUserGenerado').value.trim();

    if (!nombre || !apellido || password.length !== 5 || !usuarioGen) {
        alert('Complete los campos. La contraseña debe tener exactamente 5 dígitos.');
        return;
    }

    const checkboxes = document.querySelectorAll('.permiso-chk:checked');
    let permisos = Array.from(checkboxes).map(chk => chk.value);

    let usuarios = JSON.parse(localStorage.getItem('sistema_usuarios')) || [];
    
    usuarios.push({
        id: Date.now(),
        usuario: usuarioGen,
        nombre,
        apellido,
        password,
        permisos,
        esMaster: false
    });

    localStorage.setItem('sistema_usuarios', JSON.stringify(usuarios));
    alert(`¡Usuario creado con éxito!\nUsuario: ${usuarioGen}\nContraseña: ${password}`);
    
    document.getElementById('masterNombre').value = '';
    document.getElementById('masterApellido').value = '';
    document.getElementById('masterPass').value = '';
    document.getElementById('masterUserGenerado').value = '';
    document.querySelectorAll('.permiso-chk').forEach(c => c.checked = false);

    cargarTablaUsuariosMaster();
}

function cargarTablaUsuariosMaster() {
    const tbody = document.getElementById('tablaUsuariosMaster');
    if (!tbody) return;
    const usuarios = JSON.parse(localStorage.getItem('sistema_usuarios')) || [];
    
    tbody.innerHTML = '';
    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${u.usuario}</code></td>
            <td>${u.nombre} ${u.apellido}</td>
            <td><strong>${u.password}</strong></td>
            <td>${u.esMaster ? 'Acceso Total (Master)' : u.permisos.join(', ')}</td>
            <td>${!u.esMaster ? `<button class="btn-danger-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>` : 'Protegido'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarUsuario(id) {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
        let usuarios = JSON.parse(localStorage.getItem('sistema_usuarios')) || [];
        usuarios = usuarios.filter(u => u.id !== id);
        localStorage.setItem('sistema_usuarios', JSON.stringify(usuarios));
        cargarTablaUsuariosMaster();
    }
}

function maestroEliminarTodo() {
    if (confirm('¡ATENCIÓN! Se eliminarán todos los registros, ventas y gastos de prueba. ¿Deseas continuar?')) {
        localStorage.removeItem('registros_almacen');
        localStorage.removeItem('sistema_gastos');
        alert('Se han eliminado todos los registros de prueba con éxito.');
        cargarTablaRegistros();
    }
}

// --- NAVEGACIÓN GENERAL ---
function cambiarVista(vista, event) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const vistaEl = document.getElementById(`vista-${vista}`);
    if (vistaEl) vistaEl.classList.add('active');

    if (vista === 'historial') cargarTablaRegistros();
    if (vista === 'master') cargarTablaUsuariosMaster();

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function mostrarSubFormulario(tipo, event) {
    document.querySelectorAll('.sub-form-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#vista-almacen .sub-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tipo === 'ingreso' ? 'form-ingreso' : 'form-salida').classList.add('active');
    event.currentTarget.classList.add('active');
}

function mostrarSubReporte(tipo, event) {
    document.querySelectorAll('.sub-report-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#vista-reportes .sub-tab').forEach(el => el.classList.remove('active'));
    
    if (tipo === 'ventas') document.getElementById('rep-ventas').classList.add('active');
    else if (tipo === 'gasto') document.getElementById('rep-gasto').classList.add('active');
    else if (tipo === 'balance') document.getElementById('rep-balance').classList.add('active');
    
    event.currentTarget.classList.add('active');
}

function toggleTasaCambio() {
    const moneda = document.getElementById('pickerMonedaIngreso').value;
    const divTasa = document.getElementById('divTasaCambio');
    divTasa.style.display = moneda === '$' ? 'block' : 'none';
}

// --- MÓDULO ALMACÉN Y REGISTROS ---
function obtenerRegistros() {
    return JSON.parse(localStorage.getItem('registros_almacen')) || [];
}

function separarFechaHora(fechaHoraStr) {
    if (!fechaHoraStr) return { fecha: '', hora: '' };
    const partes = fechaHoraStr.split(',');
    if (partes.length >= 2) {
        return {
            fecha: partes[0].trim(),
            hora: partes[1].trim()
        };
    }
    return { fecha: fechaHoraStr, hora: '' };
}

// --- AYUDA VISUAL DE VUELTO EN TIEMPO REAL ---
function calcularAyudaVuelto() {
    const precioVenta = parseFloat(document.getElementById('txtPrecioVentaSalida').value) || 0;
    const monedaVenta = document.getElementById('pickerMonedaSalida').value;
    const cantidad = parseFloat(document.getElementById('txtCantidadSalida').value) || 0;
    const descuentoPct = parseFloat(document.getElementById('txtDescuentoSalida').value) || 0;
    const aplicaIVA = document.getElementById('chkIvaSalida').checked;
    const efectivoRecibido = parseFloat(document.getElementById('txtEfectivoRecibido').value) || 0;

    let subtotal = precioVenta * cantidad;
    if (monedaVenta === '$') {
        subtotal = subtotal * 36.6247;
    }

    let montoDesc = subtotal * (descuentoPct / 100);
    let base = subtotal - montoDesc;
    let montoIva = aplicaIVA ? base * 0.15 : 0;
    let totalCobrarCs = base + montoIva;

    let vuelto = efectivoRecibido - totalCobrarCs;

    const divAyuda = document.getElementById('ayudaVisualVuelto');
    if (!divAyuda) return;

    if (precioVenta > 0 && cantidad > 0) {
        divAyuda.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Total a Cobrar:</span>
                <strong style="color: var(--accent-green);">C$ ${totalCobrarCs.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Efectivo Recibido:</span>
                <strong style="color: var(--text-light);">C$ ${efectivoRecibido.toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 4px;">
                <span>Vuelto / Cambio a Devolver:</span>
                <strong style="color: ${vuelto >= 0 ? '#3498db' : '#e74c3c'}; font-size: 15px;">C$ ${vuelto >= 0 ? vuelto.toFixed(2) : 'Faltan fondos'}</strong>
            </div>
        `;
    } else {
        divAyuda.innerHTML = `Ingrese precio y cantidad para calcular el vuelto.`;
    }
}

function procesarMovimiento(tipoMovimiento, codigoEscaneado) {
    const isIngreso = tipoMovimiento === 'INGRESO';
    const sufijo = isIngreso ? 'Ingreso' : 'Salida';
    
    const producto = document.getElementById(`txtProducto${sufijo}`).value.trim();
    const cantidad = parseFloat(document.getElementById(`txtCantidad${sufijo}`).value) || 0;
    const codigo = codigoEscaneado === 'MANUAL' ? 'MANUAL' : codigoEscaneado;

    if (!producto || cantidad <= 0) {
        alert('Por favor ingrese un producto válido y cantidad mayor a 0.');
        return;
    }

    let registros = obtenerRegistros();

    if (isIngreso) {
        let precioIngreso = parseFloat(document.getElementById('txtPrecioIngreso').value) || 0;
        const moneda = document.getElementById('pickerMonedaIngreso').value;
        const stockMinimo = parseInt(document.getElementById('txtStockMinimo').value) || 5;

        if (moneda === '$') {
            const tasa = parseFloat(document.getElementById('txtTasaCambio').value) || 36.6247;
            precioIngreso = precioIngreso * tasa;
        }

        registros.unshift({
            id: Date.now(),
            tipo: 'INGRESO',
            producto: producto.toUpperCase(),
            precioIngreso,
            precioVenta: 0,
            cantidadInicial: cantidad,
            stockMinimo,
            unidad: document.getElementById('pickerMedidaIngreso').value,
            codigo: codigo.toUpperCase(),
            fechaHora: new Date().toLocaleString()
        });
        localStorage.setItem('registros_almacen', JSON.stringify(registros));
        alert(`¡Ingreso registrado con éxito!`);
        limpiarFormulario('ingreso');
    } else {
        let precioVentaSalida = parseFloat(document.getElementById('txtPrecioVentaSalida').value) || 0;
        const monedaSalida = document.getElementById('pickerMonedaSalida').value;
        const tipoSalida = document.getElementById('pickerTipoSalida').value;
        const descuentoPorcentaje = parseFloat(document.getElementById('txtDescuentoSalida').value) || 0;
        const aplicaIVA = document.getElementById('chkIvaSalida').checked;
        const efectivoRecibido = parseFloat(document.getElementById('txtEfectivoRecibido').value) || 0;

        if (monedaSalida === '$') {
            precioVentaSalida = precioVentaSalida * 36.6247;
        }
        
        let itemEncontrado = registros.find(item => 
            (item.tipo === 'INGRESO' || !item.tipo) && (
                (codigo !== 'MANUAL' && item.codigo === codigo.toUpperCase()) || 
                (item.producto.trim().toUpperCase() === producto.toUpperCase())
            )
        );

        if (!itemEncontrado) {
            alert('Error: No se encontró este producto en el inventario.');
            return;
        }

        if (itemEncontrado.cantidadInicial < cantidad) {
            alert(`Stock insuficiente. Disponible en almacén: ${itemEncontrado.cantidadInicial}`);
            return;
        }

        itemEncontrado.cantidadInicial -= cantidad;
        
        registros.unshift({
            id: Date.now(),
            tipo: 'SALIDA',
            producto: itemEncontrado.producto,
            precioIngreso: itemEncontrado.precioIngreso,
            precioVenta: precioVentaSalida,
            descuentoPorcentaje,
            aplicaIVA,
            efectivoRecibido,
            cantidadInicial: cantidad,
            tipoSalida,
            unidad: itemEncontrado.unidad || 'UND',
            codigo: itemEncontrado.codigo,
            fechaHora: new Date().toLocaleString()
        });

        localStorage.setItem('registros_almacen', JSON.stringify(registros));
        alert(`¡Salida registrada con éxito!`);
        limpiarFormulario('salida');
    }
}

function limpiarFormulario(tipo) {
    const sufijo = tipo === 'ingreso' ? 'Ingreso' : 'Salida';
    document.getElementById(`txtProducto${sufijo}`).value = '';
    document.getElementById(`txtCantidad${sufijo}`).value = '';
    if (tipo === 'ingreso') {
        document.getElementById('txtPrecioIngreso').value = '';
        document.getElementById('txtStockMinimo').value = '';
        document.getElementById('txtCodigoBarraIngreso').value = '';
    } else {
        document.getElementById('txtPrecioVentaSalida').value = '';
        document.getElementById('txtDescuentoSalida').value = '0';
        document.getElementById('chkIvaSalida').checked = false;
        document.getElementById('txtEfectivoRecibido').value = '';
        document.getElementById('ayudaVisualVuelto').innerHTML = '';
        document.getElementById('txtCodigoBarraSalida').value = '';
    }
    document.getElementById(`txtProducto${sufijo}`).focus();
}

function handleBarcode(event, tipoMovimiento) {
    if (event.key === 'Enter') {
        const sufijo = tipoMovimiento === 'INGRESO' ? 'Ingreso' : 'Salida';
        const inputBarra = document.getElementById(`txtCodigoBarra${sufijo}`);
        const codigo = inputBarra.value.trim();
        if (codigo) {
            procesarMovimiento(tipoMovimiento, codigo);
            inputBarra.value = '';
            inputBarra.focus();
        }
    }
}

function cargarTablaRegistros(filtro = '') {
    const tbody = document.getElementById('tabla-registros');
    if(!tbody) return;
    const registros = obtenerRegistros();
    const soloIngresos = registros.filter(item => item.tipo === 'INGRESO' || !item.tipo);
    
    tbody.innerHTML = '';
    const filtrados = soloIngresos.filter(item => item.producto.includes(filtro.toUpperCase()) || item.codigo.includes(filtro.toUpperCase()));

    if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No hay productos registrados.</td></tr>`;
        return;
    }

    filtrados.forEach(item => {
        const { fecha, hora } = separarFechaHora(item.fechaHora);
        const stockMin = item.stockMinimo !== undefined ? item.stockMinimo : 5;
        const esAlerta = item.cantidadInicial <= stockMin;
        const colorStock = esAlerta ? '#e74c3c' : 'var(--accent-green)';
        const estiloFila = esAlerta ? 'background-color: rgba(231, 76, 60, 0.1);' : '';

        const tr = document.createElement('tr');
        tr.style = estiloFila;
        tr.innerHTML = `
            <td><strong>${item.producto}</strong> ${esAlerta ? '⚠️ <span style="font-size:11px; color:#e74c3c;">¡Stock Bajo!</span>' : ''}</td>
            <td>C$ ${item.precioIngreso.toFixed(2)}</td>
            <td style="color: ${colorStock}; font-weight: bold;">${item.cantidadInicial} ${item.unidad}</td>
            <td>${stockMin}</td>
            <td><code>${item.codigo}</code></td>
            <td style="font-size: 13px; color: var(--text-muted);">${fecha}</td>
            <td style="font-size: 13px; color: var(--text-muted);">${hora}</td>
            <td><button class="btn-danger-sm" onclick="eliminarProducto(${item.id})">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarRegistros() {
    cargarTablaRegistros(document.getElementById('inputBuscar').value);
}

function eliminarProducto(id) {
    if (confirm('¿Eliminar producto?')) {
        let registros = obtenerRegistros();
        registros = registros.filter(item => item.id !== id);
        localStorage.setItem('registros_almacen', JSON.stringify(registros));
        cargarTablaRegistros(document.getElementById('inputBuscar').value);
    }
}

// --- CÁLCULO FINANCIERO DE VENTA ---
function calcularTotalVentaItem(v) {
    let subtotal = v.precioVenta * v.cantidadInicial;
    let descPct = v.descuentoPorcentaje || 0;
    let montoDesc = subtotal * (descPct / 100);
    let base = subtotal - montoDesc;
    let montoIva = v.aplicaIVA ? base * 0.15 : 0;
    return base + montoIva;
}

// --- FINANZAS Y REPORTES ---
function filtrarReporteVentas() {
    const tbodyVentas = document.getElementById('tablaReporteVentas');
    const registros = obtenerRegistros().filter(item => item.tipo === 'SALIDA');
    
    tbodyVentas.innerHTML = '';

    const ventasReales = registros.filter(v => !v.tipoSalida || v.tipoSalida === 'Venta al Contado' || v.tipoSalida === 'Venta al Crédito');

    if (ventasReales.length === 0) {
        tbodyVentas.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">No se encontraron ventas registradas.</td></tr>`;
        return;
    }

    let sumaTotalVentas = 0;
    ventasReales.forEach(v => {
        const { fecha, hora } = separarFechaHora(v.fechaHora);
        let totalFinal = calcularTotalVentaItem(v);
        sumaTotalVentas += totalFinal;

        let subtotalItem = v.precioVenta * v.cantidadInicial;
        let descMonto = subtotalItem * ((v.descuentoPorcentaje || 0) / 100);
        let baseGravable = subtotalItem - descMonto;
        let valorIvaItem = v.aplicaIVA ? baseGravable * 0.15 : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.producto}</strong></td>
            <td>C$ ${v.precioVenta.toFixed(2)}</td>
            <td>${v.descuentoPorcentaje || 0}%</td>
            <td style="color: var(--accent-blue);">C$ ${valorIvaItem.toFixed(2)} ${v.aplicaIVA ? '(15%)' : ''}</td>
            <td>${v.cantidadInicial} ${v.unidad || ''}</td>
            <td style="color: var(--accent-green); font-weight: bold;">C$ ${totalFinal.toFixed(2)}</td>
            <td>${v.tipoSalida || 'Venta al Contado'}</td>
            <td style="font-size: 13px; color: var(--text-muted);">${fecha}</td>
            <td style="font-size: 13px; color: var(--text-muted);">${hora}</td>
        `;
        tbodyVentas.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.style.borderTop = "2px solid var(--accent-blue)";
    trTotal.innerHTML = `
        <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL GENERAL (CON IVA Y DESC):</td>
        <td colspan="4" style="color: var(--accent-green); font-weight: bold; font-size: 16px;">C$ ${sumaTotalVentas.toFixed(2)}</td>
    `;
    tbodyVentas.appendChild(trTotal);
}

function exportarVentasExcel() {
    const registros = obtenerRegistros().filter(item => item.tipo === 'SALIDA');
    if (registros.length === 0) { alert('No hay datos para exportar.'); return; }

    let csvContent = "\uFEFFREPORTE DE VENTAS Y SALIDAS (OFICIAL)\r\n";
    csvContent += "=== VENTAS REALES ===\r\n";
    csvContent += "Producto;Precio Venta (C$);Descuento (%);Monto IVA (C$);Cantidad;Total Final con IVA (C$);TipoSalida;Fecha;Hora\r\n";
    
    let sumaTotalVentas = 0;
    registros.filter(v => !v.tipoSalida || v.tipoSalida === 'Venta al Contado' || v.tipoSalida === 'Venta al Crédito').forEach(v => {
        const { fecha, hora } = separarFechaHora(v.fechaHora);
        let totalFinal = calcularTotalVentaItem(v);
        sumaTotalVentas += totalFinal;

        let subtotalItem = v.precioVenta * v.cantidadInicial;
        let descMonto = subtotalItem * ((v.descuentoPorcentaje || 0) / 100);
        let baseGravable = subtotalItem - descMonto;
        let valorIvaItem = v.aplicaIVA ? baseGravable * 0.15 : 0;

        csvContent += `"${v.producto}";${v.precioVenta.toFixed(2)};${v.descuentoPorcentaje || 0}%;${valorIvaItem.toFixed(2)};${v.cantidadInicial};${totalFinal.toFixed(2)};${v.tipoSalida || 'Venta al Contado'};"${fecha}";"${hora}"\r\n`;
    });
    csvContent += `;;;;;TOTAL VENTAS: ${sumaTotalVentas.toFixed(2)};;;\r\n\r\n`;

    csvContent += "=== USO INTERNO Y MERMA / DAÑOS ===\r\n";
    csvContent += "Producto;Cantidad;Costo Unitario (C$);Monto Pérdida (C$);Categoria;Fecha;Hora\r\n";
    
    let sumaTotalMerma = 0;
    registros.filter(v => v.tipoSalida === 'Uso Interno' || v.tipoSalida === 'Merma / Daño').forEach(m => {
        const { fecha, hora } = separarFechaHora(m.fechaHora);
        let costoUnitario = m.precioIngreso || 0;
        let montoMerma = costoUnitario * m.cantidadInicial;
        sumaTotalMerma += montoMerma;
        csvContent += `"${m.producto}";${m.cantidadInicial};${costoUnitario.toFixed(2)};${montoMerma.toFixed(2)};${m.tipoSalida};"${fecha}";"${hora}"\r\n`;
    });
    csvContent += `;;TOTAL PÉRDIDAS;${sumaTotalMerma.toFixed(2)};;;\r\n`;

    descargarCSV(csvContent, "reporte_ventas_con_iva.csv");
}

function guardarGasto() {
    const monto = parseFloat(document.getElementById('gastoMonto').value) || 0;
    const moneda = document.querySelector('input[name="monedaGasto"]:checked').value;
    const descripcion = document.getElementById('gastoDescripcion').value.trim();

    if (monto <= 0 || !descripcion) {
        alert('Por favor ingrese un monto válido y la descripción del gasto.');
        return;
    }

    let gastos = JSON.parse(localStorage.getItem('sistema_gastos')) || [];
    gastos.unshift({
        id: Date.now(),
        monto,
        moneda,
        descripcion,
        fechaHora: new Date().toLocaleString()
    });

    localStorage.setItem('sistema_gastos', JSON.stringify(gastos));
    alert('¡Gasto registrado con éxito!');
    document.getElementById('gastoMonto').value = '';
    document.getElementById('gastoDescripcion').value = '';
}

function calcularBalance() {
    const registros = obtenerRegistros();
    const gastos = JSON.parse(localStorage.getItem('sistema_gastos')) || [];

    let totalVentas = 0;
    registros.filter(i => i.tipo === 'SALIDA' && (!i.tipoSalida || i.tipoSalida === 'Venta al Contado' || i.tipoSalida === 'Venta al Crédito')).forEach(s => {
        totalVentas += calcularTotalVentaItem(s);
    });

    let totalMermas = 0;
    registros.filter(i => i.tipo === 'SALIDA' && (i.tipoSalida === 'Uso Interno' || i.tipoSalida === 'Merma / Daño')).forEach(m => {
        let costoUnit = m.precioIngreso || 0;
        totalMermas += (costoUnit * m.cantidadInicial);
    });

    let totalGastosOp = 0;
    gastos.forEach(g => {
        let conversion = g.moneda === '$' ? g.monto * 36.6247 : g.monto;
        totalGastosOp += conversion;
    });

    let totalEgresosYPerdidas = totalGastosOp + totalMermas;
    let gananciaNetaReal = totalVentas - totalEgresosYPerdidas;

    document.getElementById('resultadoBalance').innerHTML = `
        <h4 style="margin-top:0; color:var(--accent-blue);">Informe Financiero Detallado (C$)</h4>
        
        <div style="background: rgba(39, 174, 96, 0.1); padding: 12px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid var(--accent-green);">
            <p style="margin: 0; font-size: 15px;"><strong>(+) Subtotal Ventas Reales (Con IVA y Descuentos):</strong> C$ ${totalVentas.toFixed(2)}</p>
        </div>

        <div style="background: rgba(231, 76, 60, 0.1); padding: 12px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid var(--accent-red);">
            <p style="margin: 0; font-size: 14px;"><strong>(-) Subtotal Gastos Operativos:</strong> C$ ${totalGastosOp.toFixed(2)}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>(-) Subtotal Pérdidas (Mermas / Uso Interno):</strong> C$ ${totalMermas.toFixed(2)}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 5px;">Total Egresos y Pérdidas: C$ ${totalEgresosYPerdidas.toFixed(2)}</p>
        </div>

        <hr style="border-color:var(--border-color);">
        <p style="font-size: 18px; font-weight: bold; color: ${gananciaNetaReal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; margin-top: 10px;">
            Ganancia Neta Real: C$ ${gananciaNetaReal.toFixed(2)}
        </p>
    `;
}

function exportarBalanceExcel() {
    const registros = obtenerRegistros().filter(i => i.tipo === 'SALIDA');
    const gastos = JSON.parse(localStorage.getItem('sistema_gastos')) || [];

    let totalVentas = 0;
    registros.filter(i => !i.tipoSalida || i.tipoSalida === 'Venta al Contado' || i.tipoSalida === 'Venta al Crédito').forEach(s => {
        totalVentas += calcularTotalVentaItem(s);
    });

    let totalMermas = 0;
    registros.filter(i => i.tipoSalida === 'Uso Interno' || i.tipoSalida === 'Merma / Daño').forEach(m => {
        let costoUnit = m.precioIngreso || 0;
        totalMermas += (costoUnit * m.cantidadInicial);
    });

    let totalGastosOp = 0;
    gastos.forEach(g => {
        let conversion = g.moneda === '$' ? g.monto * 36.6247 : g.monto;
        totalGastosOp += conversion;
    });

    let totalEgresos = totalGastosOp + totalMermas;
    let gananciaNetaReal = totalVentas - totalEgresos;

    let csvContent = "\uFEFFBALANCE Y GANANCIAS DETALLADO\r\n";
    csvContent += "Concepto;Monto (C$);Fecha;Hora\r\n";
    
    registros.filter(i => !i.tipoSalida || i.tipoSalida === 'Venta al Contado' || i.tipoSalida === 'Venta al Crédito').forEach(s => {
        const { fecha, hora } = separarFechaHora(s.fechaHora);
        let tFinal = calcularTotalVentaItem(s);
        csvContent += `Venta - ${s.producto};${tFinal.toFixed(2)};"${fecha}";"${hora}"\r\n`;
    });
    csvContent += `SUBTOTAL VENTAS;${totalVentas.toFixed(2)};;\r\n\r\n`;

    gastos.forEach(g => {
        const { fecha, hora } = separarFechaHora(g.fechaHora);
        csvContent += `Gasto Op. - ${g.descripcion};-${g.monto.toFixed(2)} ${g.moneda};"${fecha}";"${hora}"\r\n`;
    });
    csvContent += `SUBTOTAL GASTOS OPERATIVOS;${totalGastosOp.toFixed(2)};;\r\n\r\n`;

    registros.filter(i => i.tipoSalida === 'Uso Interno' || i.tipoSalida === 'Merma / Daño').forEach(m => {
        const { fecha, hora } = separarFechaHora(m.fechaHora);
        let costoUnit = m.precioIngreso || 0;
        csvContent += `Pérdida (${m.tipoSalida}) - ${m.producto};-${(costoUnit * m.cantidadInicial).toFixed(2)};"${fecha}";"${hora}"\r\n`;
    });
    csvContent += `SUBTOTAL PÉRDIDAS (MERMAS);${totalMermas.toFixed(2)};;\r\n\r\n`;

    csvContent += `TOTAL EGRESOS Y PÉRDIDAS;${totalEgresos.toFixed(2)};;\r\n`;
    csvContent += `GANANCIA NETA REAL;${gananciaNetaReal.toFixed(2)};;\r\n`;

    descargarCSV(csvContent, "balance_ganancias_detallado.csv");
}

function descargarCSV(contenido, nombreArchivo) {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}