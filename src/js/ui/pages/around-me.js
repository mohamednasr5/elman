/**
 * around-me.js — اكتشف ما حولك بالـ GPS
 */
import { mountAroundMeRadar } from '../components/AroundMeRadar.js';

export async function renderAroundMePage($container) {
  $container.innerHTML = '<div id="standalone-around-me-container" style="padding-top:20px"></div>';
  mountAroundMeRadar('standalone-around-me-container');
}
