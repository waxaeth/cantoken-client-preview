const search=document.querySelector('#post-search');
const category=document.querySelector('#post-category');
function filterPosts(){
  const query=search.value.trim().toLowerCase();let count=0;
  document.querySelectorAll('#post-list .post-card').forEach(card=>{const match=(!query||card.dataset.search.includes(query))&&(!category.value||card.dataset.category===category.value);card.hidden=!match;if(match)count++;});
  document.querySelector('#post-count').textContent=`${count} ${count===1?'article':'articles'}`;
  document.querySelector('#no-posts').hidden=count!==0;
}
if(search){search.value=new URLSearchParams(location.search).get('q')||'';search.addEventListener('input',filterPosts);category.addEventListener('change',filterPosts);filterPosts();}
document.querySelector('#copy-link')?.addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText(location.origin+location.pathname);status.textContent='Link copied.';}catch{status.textContent='Copy the address from your browser to share this article.';}});
