const menu = document.querySelector('.menu-lateral');
const alternar = document.querySelector('.menu-alternar');
const puxador = document.querySelector('.menu-puxador');
const mobile = document.querySelector('.menu-mobile');
const fundo = document.querySelector('.menu-fundo');
const telaPequena = window.matchMedia('(max-width: 760px)');
const conteudos = [...document.querySelectorAll('body > header, body > main, body > footer, .pular-conteudo')];

function sincronizarTela() {
    const modal = telaPequena.matches && document.body.classList.contains('menu-aberto');
    fundo.hidden = !modal;
    menu.inert = telaPequena.matches && !modal;
    conteudos.forEach(elemento => { elemento.inert = modal; });
}

function definirMenu(aberto) {
    document.body.classList.toggle('menu-aberto', aberto);
    const acao = aberto ? 'Recolher menu' : 'Expandir menu';
    alternar.setAttribute('aria-expanded', String(aberto));
    alternar.setAttribute('aria-label', acao);
    alternar.title = acao;
    puxador.setAttribute('aria-expanded', String(aberto));
    puxador.setAttribute('aria-label', `${acao}; arraste ou pressione Enter`);
    mobile.setAttribute('aria-expanded', String(aberto));
    mobile.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    sincronizarTela();
    try {
        sessionStorage.setItem('fns-menu-aberto', String(aberto));
    } catch {

    }
}

function inverterMenu() {
    const aberto = !document.body.classList.contains('menu-aberto');
    definirMenu(aberto);
    if (telaPequena.matches) (aberto ? alternar : mobile).focus();
}

try {
    definirMenu(!telaPequena.matches && sessionStorage.getItem('fns-menu-aberto') === 'true');
} catch {
    definirMenu(false);
}

alternar.addEventListener('click', inverterMenu);
mobile.addEventListener('click', inverterMenu);
fundo.addEventListener('click', () => { definirMenu(false); mobile.focus(); });
telaPequena.addEventListener('change', () => {
    const focoNoMenu = menu.contains(document.activeElement);
    definirMenu(false);
    if (focoNoMenu) (telaPequena.matches ? mobile : alternar).focus();
});

let gesto = null;
let ignorarClique = false;

puxador.addEventListener('pointerdown', (evento) => {
    if (!evento.isPrimary || evento.button !== 0) return;
    ignorarClique = false;
    gesto = {
        id: evento.pointerId,
        inicio: evento.clientX,
        aberto: document.body.classList.contains('menu-aberto'),
        arrastou: false,
    };
    puxador.setPointerCapture(evento.pointerId);
});

puxador.addEventListener('pointermove', (evento) => {
    if (!gesto || gesto.id !== evento.pointerId) return;
    const distancia = evento.clientX - gesto.inicio;
    if (Math.abs(distancia) > 8) gesto.arrastou = true;
    if (Math.abs(distancia) >= 32) definirMenu(distancia > 0);
});

puxador.addEventListener('pointerup', (evento) => {
    if (!gesto || gesto.id !== evento.pointerId) return;
    ignorarClique = gesto.arrastou;
    gesto = null;
    if (puxador.hasPointerCapture(evento.pointerId)) puxador.releasePointerCapture(evento.pointerId);
});

puxador.addEventListener('pointercancel', () => {
    if (gesto) definirMenu(gesto.aberto);
    gesto = null;
    ignorarClique = false;
});

puxador.addEventListener('click', (evento) => {
    if (!ignorarClique || evento.detail === 0) inverterMenu();
    ignorarClique = false;
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && document.body.classList.contains('menu-aberto')) {
        definirMenu(false);
        (telaPequena.matches ? mobile : alternar).focus();
    }

    if (evento.key === 'Tab' && telaPequena.matches && document.body.classList.contains('menu-aberto')) {
        const controles = [...menu.querySelectorAll('a[href], button')];
        const primeiro = controles[0];
        const ultimo = controles[controles.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault(); ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault(); primeiro.focus();
        }
    }
});
