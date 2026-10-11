
(() => {
    const prefixo = 'fns-v1:';
    const memoria = new Map();
    const entregas = ['redes', 'arquitetura', 'algoritmos'];
    const mensagem = document.querySelector('#mensagem-interacao');
    let persistencia = true;

    function ler(chave) {
        if (memoria.has(chave)) return memoria.get(chave);
        try {
            const valor = localStorage.getItem(prefixo + chave);
            if (valor !== null) return JSON.parse(valor);
        } catch { persistencia = false; }
        return memoria.get(chave) ?? null;
    }

    function salvar(chave, valor) {
        memoria.set(chave, valor);
        try { localStorage.setItem(prefixo + chave, JSON.stringify(valor)); }
        catch { persistencia = false; }
    }

    function informar(texto) {
        if (mensagem) mensagem.textContent = texto + (persistencia ? '' : ' O navegador não permitiu salvar; esta alteração vale apenas nesta página.');
    }

    function entrega(slug) {
        const valor = ler('entrega:' + slug);
        return valor && typeof valor.arquivo === 'string' && valor.arquivo.length > 0 ? valor : null;
    }

    
    const busca = document.querySelector('#busca-disciplina');
    const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    function buscar() {
        if (!busca) return;
        const termo = normalizar(busca.value);
        const palavras = termo.split(/\s+/).filter(Boolean);
        let quantidade = 0;
        document.querySelectorAll('#grade-disciplinas article').forEach(cartao => {
            const texto = normalizar(cartao.querySelector('h3').textContent + ' ' + cartao.querySelector('.professor').textContent);
            cartao.hidden = !palavras.every(palavra => texto.includes(palavra));
            if (!cartao.hidden) quantidade++;
        });
        document.querySelector('#busca-vazia').hidden = quantidade > 0;
        document.querySelector('#resultado-busca').textContent = `${quantidade} disciplina${quantidade === 1 ? '' : 's'} encontrada${quantidade === 1 ? '' : 's'}.`;
    }
    if (busca) {
        document.querySelector('.busca-disciplinas').hidden = false;
        const termo = ler('busca');
        busca.value = typeof termo === 'string' ? termo : '';
        busca.addEventListener('input', () => { salvar('busca', busca.value); buscar(); });
        document.querySelector('#limpar-busca').addEventListener('click', () => {
            busca.value = ''; salvar('busca', ''); buscar(); busca.focus();
        });
        buscar();
    }


    const calendario = document.querySelector('[data-calendario]');
    if (calendario) {
        const links = [...calendario.querySelectorAll('a')];
        const chave = 'mes:' + location.pathname.split('/').pop();
        function mostrarMes(id, guardar = true) {
            if (!links.some(link => link.hash === '#' + id)) return;
            document.querySelectorAll('.mes-aulas').forEach(secao => { secao.hidden = secao.querySelector('h2').id !== id; });
            links.forEach(link => {
                if (link.hash === '#' + id) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
            if (guardar) salvar(chave, id);
        }
        links.forEach(link => link.addEventListener('click', () => mostrarMes(link.hash.slice(1))));
        window.addEventListener('hashchange', () => mostrarMes(location.hash.slice(1)));
        const salvo = ler(chave);
        const inicial = [location.hash.slice(1), salvo, 'mes-2'].find(id => links.some(link => link.hash === '#' + id));
        mostrarMes(inicial, false);
    }

    const filtros = [...document.querySelectorAll('[data-filtro]')];
    const opcoes = ['todas', 'pendente', 'entregue', 'avaliada'];
    let filtro = ler('filtro');
    if (!opcoes.includes(filtro)) filtro = 'todas';

    if (location.hash.startsWith('#tarefa-')) filtro = 'todas';
    function filtrar() {
        if (!filtros.length) return;
        filtros.forEach(botao => botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtro)));
        let quantidade = 0;
        document.querySelectorAll('.lista-tarefas').forEach(secao => {
            let visiveis = 0;
            secao.querySelectorAll('tr[data-situacao]').forEach(linha => {
                linha.hidden = filtro !== 'todas' && linha.dataset.situacao !== filtro;
                if (!linha.hidden) visiveis++;
            });
            secao.hidden = visiveis === 0;
            quantidade += visiveis;
        });
        document.querySelector('#resultado-filtro').textContent = `${quantidade} atividade${quantidade === 1 ? '' : 's'} exibida${quantidade === 1 ? '' : 's'}.`;
        const vazio = document.querySelector('#tarefas-vazias');
        vazio.hidden = quantidade > 0;
        vazio.textContent = filtro === 'pendente' ? 'Nenhuma tarefa pendente. Todas as entregas foram registradas.' : 'Nenhuma atividade nesta situação. Selecione outro filtro.';
    }
    if (filtros.length) {
        document.querySelector('.filtros-tarefas').hidden = false;
        filtros.forEach(botao => botao.addEventListener('click', () => {
            filtro = botao.dataset.filtro; salvar('filtro', filtro); filtrar();
        }));
        window.addEventListener('hashchange', () => {
            if (location.hash.startsWith('#tarefa-')) { filtro = 'todas'; filtrar(); }
        });
    }

    function atualizar() {
        const enviadas = entregas.filter(slug => entrega(slug)).length;
        const contagens = {pendente: 3 - enviadas, entregue: 3 + enviadas, avaliada: 6};
        document.querySelectorAll('[data-contagem]').forEach(elemento => { elemento.textContent = contagens[elemento.dataset.contagem]; });
        document.querySelectorAll('[data-prazo]').forEach(item => { item.hidden = Boolean(entrega(item.dataset.prazo)); });
        const prazosVazios = document.querySelector('#prazos-vazios');
        if (prazosVazios) prazosVazios.hidden = contagens.pendente > 0;
        document.querySelectorAll('tr[data-entrega]').forEach(linha => {
            const registro = entrega(linha.dataset.entrega);
            const estado = registro ? 'entregue' : 'pendente';
            linha.dataset.situacao = estado;
            const status = linha.querySelector('.status');
            status.className = 'status status-' + estado;
            status.textContent = registro ? 'Entregue · em correção' : 'Pendente';
            const botao = linha.querySelector('[data-enviar]');
            botao.hidden = false;
            botao.textContent = registro ? 'Desfazer simulação' : 'Simular entrega';
            botao.className = registro ? 'botao-secundario botao-entrega' : 'botao botao-entrega';
            linha.querySelector('[data-arquivo]').textContent = registro ? 'Arquivo: ' + registro.arquivo : '';
        });
        filtrar();
        const aviso = document.querySelector('#aviso-correcao');
        if (aviso) {
            const lido = ler('aviso-lido') === true;
            aviso.hidden = lido;
            document.querySelector('#avisos-vazios').hidden = !lido;
            document.querySelector('#restaurar-aviso').hidden = !lido;
            const contador = document.querySelector('#contador-avisos');
            contador.textContent = lido ? '0' : '1';
            contador.setAttribute('aria-label', lido ? 'Nenhum aviso não lido' : '1 aviso não lido');
        }
    }

    const dialogo = document.querySelector('#dialogo-entrega');
    let tarefaAtual = null;
    let origem = null;
    if (dialogo) {
        const formulario = document.querySelector('#form-entrega');
        const arquivo = document.querySelector('#arquivo-entrega');
        document.querySelectorAll('[data-enviar]').forEach(botao => botao.addEventListener('click', () => {
            const slug = botao.dataset.enviar;
            if (entrega(slug)) {
                salvar('entrega:' + slug, null); atualizar();
                informar('Entrega simulada desfeita. A atividade voltou a ficar pendente.');
                if (botao.closest('tr').hidden) filtros.find(b => b.dataset.filtro === filtro).focus();
                return;
            }
            tarefaAtual = slug; origem = botao; formulario.reset();
            document.querySelector('#entrega-atividade').textContent = botao.closest('tr').querySelector('th').textContent;
            dialogo.showModal(); arquivo.focus();
        }));
        document.querySelector('#cancelar-entrega').addEventListener('click', () => dialogo.close());
        formulario.addEventListener('submit', evento => {
            evento.preventDefault();
            if (!arquivo.files.length || !entregas.includes(tarefaAtual)) return;
            salvar('entrega:' + tarefaAtual, {arquivo: arquivo.files[0].name});
            dialogo.close(); atualizar();
            informar('Entrega simulada registrada. Nenhum arquivo foi enviado.');
            if (origem.closest('tr').hidden) filtros.find(b => b.dataset.filtro === filtro).focus();
        });
        dialogo.addEventListener('close', () => {
            formulario.reset(); tarefaAtual = null;
            if (origem && !origem.closest('tr').hidden && !origem.closest('section').hidden) origem.focus();
        });
    }

    const lerAviso = document.querySelector('#ler-aviso');
    if (lerAviso) {
        lerAviso.hidden = false;
        lerAviso.addEventListener('click', () => {
            salvar('aviso-lido', true); atualizar(); informar('Aviso marcado como lido.');
            document.querySelector('#restaurar-aviso').focus();
        });
        document.querySelector('#restaurar-aviso').addEventListener('click', () => {
            salvar('aviso-lido', false); atualizar(); informar('Aviso restaurado.'); lerAviso.focus();
        });
    }

    window.addEventListener('pageshow', atualizar);
    window.addEventListener('storage', evento => {
        if (evento.key === null || evento.key.startsWith(prefixo)) { memoria.clear(); atualizar(); }
    });
    atualizar();
})();
