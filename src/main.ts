import { Readability } from "@mozilla/readability";
import App from './App.svelte';
import { mount } from 'svelte';


let frameText = '';
if (window.self !== window.top) {
  let text = decodeURIComponent(window.name);

  const document = new DOMParser().parseFromString(text, 'text/html');
  const article = new Readability(document).parse();

  if (article?.textContent) {
    text = article.textContent.trim();
  } else {
    text = document.body.innerText;
  };

  frameText = text;
}

export default mount(App, {
  target: document.getElementById('app')!,
  props: { frameText }
})