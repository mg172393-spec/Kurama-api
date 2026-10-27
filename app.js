// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = "https://xeuulzwumaosekpjwbyq.supabase.co";
const SUPABASE_KEY = "sb_publishable_ER63PZLEgmRBSeHj2Ekz2w_86aShIsA";

// --- GESTIÓN DE VESTAS E INTERFAZ ---
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si ya hay una sesión activa en la pestaña
    const sesionActiva = sessionStorage.getItem("kurama_sesion");
    if (sesionActiva) {
        mostrarAppPrincipal(JSON.parse(sesionActiva));
    }
});

// --- INICIAR SESIÓN DESDE LA NUBE ---
async function iniciarSesion() {
    const userIn = document.getElementById("loginUser").value.trim();
    const passIn = document.getElementById("loginPass").value.trim();
    const errorMsg = document.getElementById("loginError");

    if (!userIn || !passIn) {
        errorMsg.textContent = "Por favor completa todos los campos.";
        return;
    }

    try {
        errorMsg.textContent = "Conectando...";
        
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
            errorMsg.textContent = "";
            
            // Guardar sesión en el navegador actual
            sessionStorage.setItem("kurama_sesion", JSON.stringify(usuarioValido));
            mostrarAppPrincipal(usuarioValido);
        } else {
            errorMsg.textContent = "Usuario o contraseña incorrectos.";
        }
    } catch (error) {
        console.error("Error de red:", error);
        errorMsg.textContent = "Error al conectar con la base de datos.";
    }
}

// --- MOSTRAR APLICACIÓN PRINCIPAL ---
function mostrarAppPrincipal(usuario) {
    const loginScreen = document.getElementById("login-screen");
    const appLayout = document.getElementById("app-layout");

    if (loginScreen) loginScreen.style.display = "none";
    if (appLayout) appLayout.style.display = "flex";

    // Cargar usuarios en el panel maestro si existe la función
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

    const inputUser = document.getElementById("nuevoUsuarioInput");
    const inputPass = document.getElementById("nuevoPasswordInput");
    const inputNombre = document.getElementById("nuevoNombreInput");
    const selectPermiso = document.getElementById("nuevoPermisoSelect");

    const nuevoData = {
        usuario: inputUser ? inputUser.value.trim() : "",
        password: inputPass ? inputPass.value.trim() : "",
        nombre: inputNombre ? inputNombre.value.trim() : "",
        permiso: selectPermiso ? selectPermiso.value : "empleado"
    };

    if (!nuevoData.usuario || !nuevoData.password || !nuevoData.nombre) {
        alert("Por favor completa todos los campos del usuario.");
        return;
    }

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
            alert("¡Usuario registrado con éxito en la nube y disponible para cualquier dispositivo!");
            if(inputUser) inputUser.value = "";
            if(inputPass) inputPass.value = "";
            if(inputNombre) inputNombre.value = "";
            cargarUsuariosRegistrados();
        } else {
            const err = await response.json();
            alert("Error al registrar: " + (err.message || "Verifica los datos"));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

// --- CARGAR LISTA DE USUARIOS DESDE SUPABASE ---
async function cargarUsuariosRegistrados() {
    const tablaContainer = document.getElementById("tablaUsuariosBody");
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
