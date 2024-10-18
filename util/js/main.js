// Conexão com Supabase
const { createClient } = supabase;
const _supabase = createClient('https://hoqdmqoeygoaqwccgvex.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvcWRtcW9leWdvYXF3Y2NndmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTMzMjgsImV4cCI6MjA0NDgyOTMyOH0.jqxUGFvuvpauk9Z8hSArnLnAOZsafdSDG_wLeFgP2cI');

// Dropdowns
$('#jogadoresPorTime').dropdown();
$('#posicaoJogador').dropdown();

// Consultas ao Supabase
// Consulta os jogadores e recupera somente o nome para usar no select
$(document).ready(async () => {
    let { data: Jogadores, error } = await _supabase
    .from('Jogadores').select('nome')
    
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        const meuSelectJogadores = document.getElementById('jogadores');
        meuSelectJogadores.innerHTML = '';

        Jogadores.forEach(jogador => {
            let jogadorElement = document.createElement('option');

            jogadorElement.value = jogador.nome.toUpperCase();
            jogadorElement.textContent = jogador.nome;

            meuSelectJogadores.appendChild(jogadorElement);
        });
    }
});

// Consulta todos os jogadores para inserir na tabela
$(document).ready(async () => {
    let { data: Jogadores, error } = await _supabase
    .from('Jogadores').select('*')
    
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        let jogadoresArray = [];
        
        jogadoresArray = Jogadores.map(jogador => [
            jogador.id,
            jogador.nome, 
            jogador.posicao, 
            new Date(jogador.created_at).toLocaleString(),
            `<button id="btnUpdateUser" class="mini ui icon button green" data-id="${jogador.id}">
                <i class="pencil alternate icon"></i>
            </button>
            <button id="btnRemoveUser" class="mini ui icon button red" data-id="${jogador.id}">
                <i class="trash icon"></i>
            </button>`
        ]);
        new DataTable('#tableJogadores', {
            columns: [
                { title: 'Id'},
                { title: 'Nome' },
                { title: 'Posição' },
                { title: 'Data de criação' },
                { title: 'Ações'}
            ],
            data: jogadoresArray,
            layout: {
                bottomEnd: {
                    paging: {
                        firstLast: false
                    }
                }
            },
            language: {
                info: "",
                search: "Buscar:",
                lengthMenu: "_MENU_",
                zeroRecords: "Nenhum registro correspondente encontrado",
                infoEmpty: "Mostrando 0 a 0 de 0 entradas",
                infoFiltered: "(filtrado do total de _MAX_ entradas)"
            },
            columnDefs: [
                {
                    targets: 4,
                    className: "dt-body-center"
                },
                {
                    targets: 0,
                    visible: false
                }
            ]
        });
    }
});

// Verifica se o campos estão preenchidos corretamente
$(document).ready(() => {
    verificarCondicoes();
})

$('#jogadoresEscolhidos, #jogadoresPorTime').on('change input', () => {
    verificarCondicoes();
})

function verificarCondicoes(){
    let totalOptionsDisponiveis = $('#jogadoresEscolhidos').find('option').length;
    let jogadoresPorTime = $('#jogadoresPorTime').val();

    if (totalOptionsDisponiveis >= 2 && jogadoresPorTime ) {
        $('#btnGerarTime').prop('disabled', false);
    } else {
        $('#btnGerarTime').prop('disabled', true);
    }
}

// Gera aleatóriamente os times de acordo com os jogadores selecionados e quantidade por time
$('#btnGerarTime').click(() => {
    let jogadoresEscolhidos = document.getElementById('jogadoresEscolhidos');
    let jogadoresPorTime = parseInt(document.getElementById('jogadoresPorTime').value, 10);
    let resultado = document.getElementById('resultadoID');
    if(resultado.innerHTML.trim() !== ''){resultado.innerHTML = '';}
    let selectedValues = [];

    for (let option of jogadoresEscolhidos.options) {
        selectedValues.push(option.value);
    }
    
    const mapTimes = new Map();

    const quantidadeGrupos = Math.ceil(selectedValues.length / jogadoresPorTime);
    for (let i = 0; i < quantidadeGrupos; i++) {
        const listaParticipantes = [];
        let nomeAle;

        for (let j = 0; j < jogadoresPorTime; j++) {
            if (selectedValues.length === 0) break;
            nomeAle = selectedValues[Math.floor(Math.random()*selectedValues.length)];

            selectedValues = selectedValues.filter(nome => nome !== nomeAle);

            listaParticipantes.push(nomeAle);
        }

        // Verifica se é o último time
        const key = (i === quantidadeGrupos - 1 && listaParticipantes.length < jogadoresPorTime) ? 
        'TIME DE FORA' : `TIME ${i + 1}`;

        mapTimes.set(key, listaParticipantes);
    }

    mapTimes.forEach((time, key) => {
        resultado.innerHTML += `
        <div class="column">
            <table class="ui red table">
                <thead>
                    <tr>
                        <th>${key}</th>
                    </tr>
                </thead>
                <tbody>
                    ${time.map(jogador =>`
                        <tr>
                            <td>${jogador}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    });
});   

// Mover jogadores entre os selects
$('#moveToSelect2').click(() => {
    $('#jogadores option:selected').each(function() {
        $(this).appendTo('#jogadoresEscolhidos');
        $(this).prop('selected', false);
    });
    verificarCondicoes('#jogadoresEscolhidos', '#jogadoresPorTime');
});

$('#moveToSelect1').click(() => {
    $('#jogadoresEscolhidos option:selected').each(function() {
        $(this).appendTo('#jogadores');
        $(this).prop('selected', false);
    });
    verificarCondicoes('#jogadoresEscolhidos', '#jogadoresPorTime');
});

// Modais
$('#btnAddUser').click(() => {
    $('#modalAddJogador').modal('show');
});
$(document).on('click', '#btnUpdateUser', () => {
    const id = $(this).data('id');
    $('#modalUpdateJogador').modal('show');
});

$(document).on('click', '#btnRemoveUser', () => {
    const id = $(this).data('id');
});