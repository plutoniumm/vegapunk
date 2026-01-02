import App from './App.svelte';
import { mount } from 'svelte';

const isFrame = window.self !== window.top;

let frameText = '';
if (isFrame) {
  let text = JSON.parse(window.name).text;
  text = decodeURIComponent(text);
  frameText = text;
}

export default mount(App, {
  target: document.getElementById('app')!,
  props: { frameText }
})