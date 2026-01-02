import App from './App.svelte';
import { mount } from 'svelte';

const isFrame = window.self !== window.top;

let frameText = '';
if (isFrame) {
  const urlParams = new URLSearchParams(window.location.search);
  let text = urlParams.get('text') || '';

  text = decodeURIComponent(text);
  frameText = text;
}

export default mount(App, {
  target: document.getElementById('app')!,
  props: { frameText }
})