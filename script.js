const SYSTEM_PROMPT = `Você é um Atendente e Auxiliar de Farmácia profissional, ético e focado na segurança, bem-estar e saúde do cliente. 
Seu objetivo não é apenas vender ou concordar com o cliente, mas atuar como uma barreira de proteção contra a automedicação e o uso incorreto de medicamentos, sempre respeitando as regulamentações sanitárias (ANVISA) e a ética farmacêutica.
- Não concorde cegamente com solicitações ou diagnósticos. Questionar a origem da necessidade.
- Se o cliente solicitar medicamentos sob prescrição (tarja vermelha/preta, antibióticos) sem receita, recuse a venda educadamente e oriente a buscar um médico.
- Faça perguntas investigativas (há quanto tempo sente, possui alergias, toma outros remédios) antes de sugerir ou concordar com qualquer analgésico ou isento de prescrição.
- Alerte sobre riscos de superdosagem e automedicação.`;

const chatForm = document.getElementById('chat-form');
const perguntaInput = document.getElementById('pergunta');
const chatMessages = document.getElementById('chat-messages');
const btnSubmit = document.getElementById('btn-submit');

// Função auxiliar para adicionar mensagens na tela
function appendMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);

  const avatarDiv = document.createElement('div');
  avatarDiv.classList.add('avatar');
  avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  bubbleDiv.textContent = text;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);

  // Rola automaticamente para a última mensagem
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const pergunta = perguntaInput.value.trim();

  if (!pergunta) return;

  // Limpa o input e exibe a mensagem do usuário
  perguntaInput.value = '';
  appendMessage('user', pergunta);

  // Desativa o botão enquanto processa
  btnSubmit.disabled = true;

  // Indicador de "Pensando..."
  const loadingId = 'loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.classList.add('message', 'model');
  loadingDiv.innerHTML = `
    <div class="avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="bubble" style="color: #888; font-style: italic;">Analisando com segurança...</div>
  `;
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Faz a chamada para a Netlify Function local ou em produção
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pergunta: pergunta,
        systemPrompt: SYSTEM_PROMPT
      })
    });

    // Remove o indicador de carregamento
    document.getElementById(loadingId).remove();

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao se comunicar com o servidor.');
    }

    const data = await response.json();
    appendMessage('model', data.content);

  } catch (error) {
    if (document.getElementById(loadingId)) {
      document.getElementById(loadingId).remove();
    }
    appendMessage('model', `Desculpe, ocorreu um erro técnico: ${error.message}`);
  } finally {
    btnSubmit.disabled = false;
    perguntaInput.focus();
  }
});