const protocolo = "http://";
const baseURL = "127.0.0.1:3000";
const loginEndpoint = "/login";

const API_BASE_URL = `${protocolo}${baseURL}`;

async function realizarLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const btnSubmit = document.getElementById('btn-submit');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    
    if (!email || !password) {
        errorMessage.textContent = 'Por favor, preencha todos os campos.';
        errorMessage.style.display = 'block';
        return;
    }
    
    btnText.textContent = 'Conectando...';
    btnSpinner.classList.remove('hidden');
    btnSubmit.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showAlert(`Conectando como ${data.perfil}...`);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            setTimeout(() => {
                redirecionarUsuario(data.perfil);
            }, 1500);
        } else {
            errorMessage.textContent = data.error || 'Erro ao fazer login. Tente novamente.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        errorMessage.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
        errorMessage.style.display = 'block';
    } finally {
        // Restaurar botão
        btnText.textContent = 'Conectar';
        btnSpinner.classList.add('hidden');
        btnSubmit.disabled = false;
    }
}


function redirecionarUsuario(perfil) {
    const perfilNormalizado = perfil.toLowerCase();
    
    switch(perfilNormalizado) {
        case 'professor':
            window.location.href = 'professor.html';
            break;
        case 'administrador':
            window.location.href = 'adm.html';
            break;
        case 'técnico':
            window.location.href = 'tecnico.html';
            break;
        default:
            console.warn(`Perfil de usuário desconhecido: ${perfil}. Redirecionando para página padrão.`);
            window.location.href = 'dashboard.html';
    }
}

function showAlert(message) {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    container.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-2xl max-w-xs text-center">
            <p class="text-gray-700 mb-4">${message}</p>
            <button onclick="this.closest('.fixed').remove()" class="bg-[#B11116] text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(container);
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de login inicializado');

    const user = localStorage.getItem('user');
    if (user) {
        console.log('Usuário já logado:', JSON.parse(user));
    }
});