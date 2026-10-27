// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://xeuulzwumaosekpjwbyq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER63PZLEgmRBSeHj2Ekz2w_86aShIsA";

// --- INICIO DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si ya hay una sesión activa en esta pestaña
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
            
            // Guardar sesión en el navegador
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

// --- MOSTRAR APLICACIÓN PRINCIPAL (Versión Robusta Anti-Pantalla en Blanco) ---
function mostrarAppPrincipal(usuario) {
    const loginScreen = document.getElementById("login-screen") || document.querySelector(".login-container");
    
    // Ocultar la pantalla de login
    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    // Buscar el contenedor principal de la aplicación por cualquier nombre común
    const appLayout = document.getElementById("app-layout") || 
                      document.getElementById("main-app") || 
                      document.getElementById("app") || 
                      document.querySelector(".app-layout") ||
                      document.querySelector("main");

    if (appLayout) {
        appLayout.style.display = "flex";
    } else {
        // Fallback: mostrar cualquier contenedor oculto en el body que no sea el login
        document.querySelectorAll("body > div").forEach(div => {
            if (div.id !== "login-screen" && !div.classList.contains("login-container")) {
                div.style.display = "block";
            }
        });
    }

    // Cargar la lista de usuarios en el panel maestro
    cargarUsuariosRegistrados();
}

// --- CAMBIO DE SECCIONES EN EL MENÚ ---
function cambiarSeccion(seccionId, btnElement) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(seccionId);
    if (targetSection) targetSection.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// --- REGISTRAR NUEVO USUARIO EN LA NUBE ---
async function registrarUsuarioMaster(event) {
    if (event) event.preventDefault();

    const inputNombre = document.getElementById("nuevoNombreInput")?.value.trim() || "";
    const inputApellido = document.getElementById("nuevoApellidoInput")?.value.trim() || "";
    const inputPass = document.getElementById("nuevoPasswordInput")?.value.trim() || "";
    const inputUser = document.getElementById("nuevoUsuarioInput")?.value.trim() || "";

    // Recolectar permisos seleccionados de los checkboxes
    let permisosArr = [];
    const checkboxes = document.querySelectorAll('.card input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            let labelText = cb.closest('label')?.textContent || cb.value || "permiso";
            permisosArr.push(labelText.trim());
        }
    });

    const nombreCompleto = `${inputNombre} ${inputApellido}`.trim();
    const permisosTexto = permisosArr.length > 0 ? permisosArr.join(", ") : "acceso básico";

    if (!inputUser || !inputPass || !inputNombre) {
        alert("Por favor completa los campos obligatorios (Nombre, Contraseña y Usuario).");
        return;
    }

    const nuevoData = {
        usuario: inputUser,
        password: inputPass,
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
            
            // Limpiar formulario
            if(document.getElementById("nuevoNombreInput")) document.getElementById("nuevoNombreInput").value = "";
            if(document.getElementById("nuevoApellidoInput")) document.getElementById("nuevoApellidoInput").value = "";
            if(document.getElementById("nuevoPasswordInput")) document.getElementById("nuevoPasswordInput").value = "";
            if(document.getElementById("nuevoUsuarioInput")) document.getElementById("nuevoUsuarioInput").value = "";
            checkboxes.forEach(cb => cb.checked = false);

            cargarUsuariosRegistrados();
        } else {
            const err = await response.json();
            alert("Error al guardar en Supabase: " + (err.message || "Verifica los datos"));
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// --- CARGAR LISTA DE USUARIOS DESDE SUPABASE ---
async function cargarUsuariosRegistrados() {
    const tablaContainer = document.querySelector("#tablaUsuariosBody") || document.querySelector("table tbody");
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
