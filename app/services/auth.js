import {
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
doc,
getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function fazerLogin(
auth,
mostrarLoading,
ocultarLoading
){

try{

mostrarLoading('Entrando...');

await signInWithEmailAndPassword(
auth,
document.getElementById('email').value,
document.getElementById('senha').value
);

}catch(e){

console.error(e);

alert(
'Erro no login.\n\n' +
(e.message || e)
);

ocultarLoading();

}

}

export async function logout(auth){

await signOut(auth);

}

export async function verificarPermissaoAtual(
auth,
db,
logoutFn
){

try{

const user = auth.currentUser;

if(!user) return;

const ref = doc(db,'usuarios',user.email);

const snap = await getDoc(ref);

if(!snap.exists()){

alert('Usuário removido.');

await logoutFn();

return;

}

const dados = snap.data();

if(!dados.ativo){

alert('Seu acesso foi desativado.');

await logoutFn();

return;

}

}catch(e){

console.error(
'Erro ao verificar acesso:',
e
);

}

}

export function iniciarAuthListener({

auth,
db,

loginTela,
appTela,

mostrarLoading,
ocultarLoading,

carregarSistema,
sincronizarOffline,

setPermissoes,
logoutFn

}){

onAuthStateChanged(auth, async (user)=>{

try{

if(!user){

loginTela.classList.remove('oculto');
appTela.classList.add('oculto');

ocultarLoading();

return;

}

mostrarLoading('Carregando usuário...');

const ref = doc(db,'usuarios',user.email);

const snap = await getDoc(ref);

if(!snap.exists()){

alert('Usuário sem permissão.');

await logoutFn();

ocultarLoading();

return;

}

const dados = snap.data();

if(!dados.ativo){

alert('Usuário desativado.');

await logoutFn();

ocultarLoading();

return;

}

setPermissoes(dados.areas || []);

loginTela.classList.add('oculto');
appTela.classList.remove('oculto');

await carregarSistema();

await sincronizarOffline();

ocultarLoading();

}catch(e){

console.error(e);

alert(
'Erro ao carregar usuário.\n\n' +
(e.message || e)
);

ocultarLoading();

}

});

}
