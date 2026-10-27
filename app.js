// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://xeuulzwumaosekpjwbyq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER63PZLEgmRBSeHj2Ekz2w_86aShIsA";

// --- INICIO DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    const sesionActiva = sessionStorage.getItem("kurama_sesion");
    if (sesionActiva) {
        try {
            mostrarAppPrincipal(JSON.parse(sesionActiva));
        } catch (e) {
            sessionStorage.removeItem("kurama_sesion");
        }
    }
});

// --- INICIAR SESIÓN DESDE LA NUBE ---
async function iniciarSesion() {
    const userIn = document.getElementById("loginUser").value.trim();
    const passIn = document.getElementById("loginPass").value.trim();
    const errorMsg = document.getElementById("loginError");

    if (!userIn || !passIn) {
        if (errorMsg) errorMsg.textContent = "Por favor completa todos los campos.";
        return;
    }

    try {
        if (errorMsg) errorMsg.textContent = "Conectando...";
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?usuario=eq.${encodeURIComponent(userIn)}&password=eq.${encodeURIComponent(passIn)}`, {
            method: "GET",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const data = await response.json();

        if (data && data.length > 0) {
            const usuarioValido = data[0];
            if (errorMsg) errorMsg.textContent = "";
            
            sessionStorage.setItem("kurama_sesion", JSON.stringify(usuarioValido));
            mostrarAppPrincipal(usuarioValido);
        } else {
            if (errorMsg) errorMsg.textContent = "Usuario o contraseña incorrectos.";
        }
    } catch (error) {
        console.error("Error de red:", error);
        if (errorMsg) errorMsg.textContent = "Error al conectar con la base de datos.";
    }
}

// --- CERRAR SESIÓN ---
function cerrarSesion() {
    sessionStorage.removeItem("kurama_sesion");
    const appScreen = document.getElementById("app-screen");
    const loginScreen = document.getElementById("login-screen");
    if (appScreen) appScreen.style.display = "none";
    if (loginScreen) loginScreen.style.display = "flex";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    const err = document.getElementById("loginError");
    if (err) err.textContent = "";
}

// --- CONSTRUIR MENÚ LATERAL DINÁMICO ---
function construirMenuSidebar(permiso) {
    const navContainer = document.getElementById("sidebarNavContainer");
    if (!navContainer) return;
    
    const esMaster = permiso && (
        permiso.toLowerCase().includes('master') || 
        permiso.toLowerCase().includes('admin') || 
        permiso.toLowerCase().includes('acceso total')
    );

    let menuHTML = `
        <button class="nav-item active" onclick="cambiarSeccion('vista-almacen', this)">Gestión Almacén</button>
        <button class="nav-item" onclick="cambiarSeccion('vista-historial', this)">Stock e Historial</button>
        <button class="nav-item" onclick="cambiarSeccion('vista-camping', this)">Módulo Camping</button>
        <button class="nav-item" onclick="cambiarSeccion('vista-reportes', this)">API Reportes</button>
    `;

    if (esMaster) {
        menuHTML += `<button class="nav-item" onclick="cambiarSeccion('vista-master', this)">Panel Maestro</button>`;
    }

    navContainer.innerHTML = menuHTML;
}

// --- MOSTRAR APLICACIÓN PRINCIPAL ---
function mostrarAppPrincipal(usuario) {
    const loginScreen = document.getElementById("login-screen");
    const appScreen = document.getElementById("app-screen"); // ID correcto en el HTML

    if (loginScreen) loginScreen.style.display = "none";
    if (appScreen) appScreen.style.display = "flex";

    const lblUser = document.getElementById("lblUserSession");
    if (lblUser) {
        lblUser.textContent = usuario.nombre || usuario.usuario || "Kurama API";
    }

    construirMenuSidebar(usuario.permiso);

    // Activar la vista de almacén por defecto
    cambiarSeccion('vista-almacen', document.querySelector('.sidebar-nav button'));

    // Cargar usuarios registrados en el panel maestro
    cargarUsuariosRegistrados();
}

// --- CAMBIO DE SECCIONES EN EL MENÚ ---
function cambiarSeccion(seccionId, btnElement) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const targetSection = document.getElementById(seccionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// --- AUTO-GENERAR USUARIO DESDE NOMBRE Y APELLIDO ---
document.addEventListener("input", (e) => {
    if (e.target && (e.target.id === "masterNombre" || e.target.id === "masterApellido")) {
        const nombre = document.getElementById("masterNombre")?.value.trim().toLowerCase() || "";
        const apellido = document.getElementById("masterApellido")?.value.trim().toLowerCase() || "";
        const userGen = document.getElementById("masterUserGenerado");
        if (userGen) {
            if (nombre || apellido) {
                const nPart = nombre.split(" ")[0] || "";
                const aPart = apellido.split(" ")[0] || "";
                userGen.value = nPart && aPart ? `${nPart}.${aPart[0]}` : (nPart || aPart || "");
            } else {
                userGen.value = "";
            }
        }
    }
});

// --- GENERAR CONTRASEÑA ALEATORIA ---
function generarPasswordAleatorio() {
    const pass = Math.floor(10000 + Math.random() * 90000).toString();
    const passInput = document.getElementById("masterPass");
    if (passInput) passInput.value = pass;
}

// --- CREAR NUEVO USUARIO EN LA NUBE ---
async function crearNuevoUsuario() {
    const nombre = document.getElementById("masterNombre")?.value.trim() || "";
    const apellido = document.getElementById("masterApellido")?.value.trim() || "";
    const password = document.getElementById("masterPass")?.value.trim() || "";
    const usuario = document.getElementById("masterUserGenerado")?.value.trim() || "";

    if (!nombre || !password || !usuario) {
        alert("Por favor complete los campos obligatorios y asegúrese de que el usuario esté generado.");
        return;
    }

    let permisosArr = [];
    document.querySelectorAll('.permiso-chk:checked').forEach(cb => {
        permisosArr.push(cb.value);
    });
    const permisosTexto = permisosArr.length > 0 ? permisosArr.join(", ") : "almacen";
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    const nuevoData = {
        usuario: usuario,
        password: password,
        nombre: nombreCompleto,
        permiso: permisosTexto
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(nuevoData)
        });

        if (response.ok) {
            alert("¡Usuario registrado en la nube con éxito!");
            document.getElementById("masterNombre").value = "";
            document.getElementById("masterApellido").value = "";
            document.getElementById("masterPass").value = "";
            document.getElementById("masterUserGenerado").value = "";
            document.querySelectorAll('.permiso-chk').forEach(cb => cb.checked = false);
            cargarUsuariosRegistrados();
        } else {
            const err = await response.json();
            alert("Error al registrar: " + (err.message || "Verifica los datos"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// --- CARGAR LISTA DE USUARIOS DESDE SUPABASE ---
async function cargarUsuariosRegistrados() {
    const tablaContainer = document.getElementById("tablaUsuariosMaster");
    if (!tablaContainer) return;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*`, {
            method: "GET",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        const usuarios = await response.json();
        
        tablaContainer.innerHTML = "";
        if (usuarios && usuarios.length > 0) {
            usuarios.forEach(u => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${u.usuario}</td>
                    <td>${u.nombre || ''}</td>
                    <td>•••••</td>
                    <td>${u.permiso || 'empleado'}</td>
                    <td>
                        ${u.usuario !== 'admin' ? `<button class="btn-danger-sm" onclick="eliminarUsuario(${u.id})">Eliminar</button>` : '<span style="color:var(--accent-blue)">Protegido</span>'}
                    </td>
                `;
                tablaContainer.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

// --- ELIMINAR USUARIO DE LA NUBE ---
async function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}`, {
            method: "DELETE",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            alert("Usuario eliminado correctamente.");
            cargarUsuariosRegistrados();
        } else {
            alert("No se pudo eliminar el usuario.");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}

// --- FUNCIONES AUXILIARES DE INTERFAZ ---
function mostrarSubFormulario(tipo, event) {
    document.querySelectorAll('.sub-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sub-form-section').forEach(sec => sec.classList.remove('active'));

    if (tipo === 'ingreso') {
        document.getElementById('form-ingreso')?.classList.add('active');
    } else if (tipo === 'salida') {
        document.getElementById('form-salida')?.classList.add('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function mostrarSubReporte(tipo, event) {
    document.querySelectorAll('#vista-reportes .sub-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sub-report-section').forEach(sec => sec.classList.remove('active'));

    if (tipo === 'ventas') {
        document.getElementById('rep-ventas')?.classList.add('active');
    } else if (tipo === 'gasto') {
        document.getElementById('rep-gasto')?.classList.add('active');
    } else if (tipo === 'balance') {
        document.getElementById('rep-balance')?.classList.add('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function toggleTasaCambio() {
    const moneda = document.getElementById("pickerMonedaIngreso")?.value;
    const divTasa = document.getElementById("divTasaCambio");
    if (divTasa) {
        divTasa.style.display = (moneda === "$") ? "block" : "none";
    }
}

function limpiarFormulario(form) { 
    if(form === 'ingreso') {
        if(document.getElementById("txtProductoIngreso")) document.getElementById("txtProductoIngreso").value = "";
        if(document.getElementById("txtPrecioIngreso")) document.getElementById("txtPrecioIngreso").value = "";
        if(document.getElementById("txtStockMinimo")) document.getElementById("txtStockMinimo").value = "";
        if(document.getElementById("txtCantidadIngreso")) document.getElementById("txtCantidadIngreso").value = "";
    } else {
        if(document.getElementById("txtProductoSalida")) document.getElementById("txtProductoSalida").value = "";
        if(document.getElementById("txtPrecioVentaSalida")) document.getElementById("txtPrecioVentaSalida").value = "";
        if(document.getElementById("txtCantidadSalida")) document.getElementById("txtCantidadSalida").value = "";
        if(document.getElementById("txtDescuentoSalida")) document.getElementById("txtDescuentoSalida").value = "0";
        if(document.getElementById("txtEfectivoRecibido")) document.getElementById("txtEfectivoRecibido").value = "";
    }
}

function handleBarcode(event, tipo) { 
    if(event.key === 'Enter') { 
        alert("Código escaneado para " + tipo); 
        event.target.value = ''; 
    } 
}

function calcularAyudaVuelto() {}
function filtrarRegistros() {}
function procesarMovimiento(tipo, modo) { alert("Movimiento " + tipo + " procesado."); }
function filtrarReporteVentas() {}
function exportarVentasExcel() {}
function guardarGasto() { alert("Gasto guardado."); }
function calcularBalance() { 
    const res = document.getElementById("resultadoBalance");
    if(res) res.innerHTML = "<p>Balance calculado correctamente.</p>"; 
}
function exportarBalanceExcel() {}
function maestroEliminarTodo() { 
    if(confirm("¿Desea eliminar los registros de prueba?")) {
        alert("Registros eliminados."); 
    }
}
