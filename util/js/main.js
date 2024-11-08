// Conexão com Supabase
const { createClient } = supabase;
const _supabase = createClient('https://hoqdmqoeygoaqwccgvex.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvcWRtcW9leWdvYXF3Y2NndmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTMzMjgsImV4cCI6MjA0NDgyOTMyOH0.jqxUGFvuvpauk9Z8hSArnLnAOZsafdSDG_wLeFgP2cI');

// Dropdowns
$('#jogadoresPorTime').dropdown();
$('#posicaoJogador').dropdown();

$(document).ready(function(){
    criaSelectJogadores();
    criaDataTable();
    verificarCondicoes();
})


// Consulta todos os jogadores e recupera somente o nome para usar no select
async function consultaJogadoresSomenteNome() {
    let { data: Jogadores, error } = await _supabase
        .from('Jogadores').select('nome');

    if (error) {
        console.error('Error fetching data:', error);
        return [];
    }

    return Jogadores;
}

// Consulta todos os jogadores
async function consultaJogadores() {
    let { data: Jogadores, error } = await _supabase
        .from('Jogadores').select('*');

    if (error) {
        console.error('Error fetching data:', error);
        return [];
    }

    return Jogadores;
}

// Cria o select com os jogadores
async function criaSelectJogadores() {
    const jogadores = await consultaJogadoresSomenteNome();
    let meuSelectJogadores = document.getElementById('jogadores');

    if (meuSelectJogadores) {
        meuSelectJogadores.innerHTML = '';

        jogadores.forEach(jogador => {
            let jogadorElement = document.createElement('option');

            jogadorElement.value = jogador.nome.toUpperCase();
            jogadorElement.textContent = jogador.nome;

            meuSelectJogadores.appendChild(jogadorElement);
        });
    }
}

// Cria a tabela de jogadores
async function criaDataTable() {
    const jogadores = await consultaJogadores();

    let jogadoresArray = jogadores.map(jogador => [
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
            { title: 'Id' },
            { title: 'Nome' },
            { title: 'Posição' },
            { title: 'Data de criação' },
            { title: 'Ações' }
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

// Adiciona um jogador
$('#addJogador').click(async () => {  
    try {
        let nome = $('#nomeJogadorAdd').val();
        console.log(nome);
        if(nome == ''){
            throw "O nome está vazio";
        } 

        const { error } = await _supabase
        .from('Jogadores')
        .insert([{ 
            nome: nome,
            posicao: $('#posicaoJogadorAdd').val() 
        }])

        if(error){
            console.error('Erro ao inserir jogador:', error)   
        } else{
            console.log('Jogador inserido com sucesso.');
            refreshTable();
        }
    } catch (error) {
        console.error('Erro ao tentar inserir jogador:', error);
    }
})

// Atualiza um jogador
$('#updateJogador').click(async () => {
    try {
        const { error } = await _supabase
        .from('Jogadores')
        .update({ 
            nome:  $('#nomeJogadorUpdate').val(),
            posicao: $('#posicaoJogadorUpdate').val()
        })
        .eq('id', $('#idJogador').val())

        if (error) {
            console.error('Erro ao atualizar jogador:', error)    
        }else{
            console.log('Jogador atualizado com sucesso.');
            refreshTable();
        }
    } catch (error) {
        console.error('Erro ao tentar atualizar jogador: '+error);
    }
})

// Deleta um jogador
$(document).on('click', '#btnRemoveUser', async function(){
    const id = $(this).data('id');
    
    try {
        const { error } = await _supabase
        .from('Jogadores')
        .delete()
        .eq('id', id)

        if (error) {
            console.error('Erro deletar jogador: '+error);
        }else{
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Jogador deletado com sucesso",
                showConfirmButton: false,
                timer: 1000,
                heightAuto: false
            });
            console.log('Jogador deletado com sucesso.');
            refreshTable();
        }
    } catch (error) {
        console.error('Erro ao tentar deletar o jogador: '+error);
    }
});

// Consulta somente um jogador
async function consultaSomenteUmJogador(id){
    let { data: Jogador, error } = await _supabase
        .from('Jogadores')
        .select('*')
        .eq('id', id)
    
        if(error){
            console.error('Erro ao recuperar jogador: '+ error);
            return [];
        }

    return Jogador;
}

$('#jogadoresEscolhidos, #jogadoresPorTime').on('change input', () => {
    verificarCondicoes();
})

// Verifica condições antes de Gerar os times
function verificarCondicoes() {
    let totalOptionsDisponiveis = $('#jogadoresEscolhidos').find('option').length;
    let jogadoresPorTime = $('#jogadoresPorTime').val();

    if (totalOptionsDisponiveis >= jogadoresPorTime) {
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
// Inicializa o modal para adicionar um novo jogador
$('#btnAddUser').click(() => {
    $('#modalAddJogador').modal('show');
});

// Inicializa o modal e inseri as antigas informações do jogador
$(document).on('click', '#btnUpdateUser', async function(){
    //Recupera informações
    const id = $(this).data('id'); 
    const jogador = await consultaSomenteUmJogador(id);
    
    if (jogador) {
        // Preenche os campos do modal com os dados do jogador
        $('#idJogador').val(jogador[0].id);
        $('#nomeJogadorUpdate').val(jogador[0].nome);
        $('#posicaoJogadorUpdate').val(jogador[0].posicao);
    } else {
        console.error('Jogador não encontrado ou erro na consulta.');
    }
    // Inicializa o modal
    $('#modalUpdateJogador').modal('show');
});

// Realiza um refresh na tabela de jogadores
function refreshTable(){
    if ($.fn.dataTable.isDataTable('#tableJogadores')) {
        $('#tableJogadores').DataTable().destroy(); // Destrói a DataTable existente
    }
    criaDataTable(); 
}