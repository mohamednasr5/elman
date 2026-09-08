/**
 * now.js — المنزلة والمطرية الآن (يحدث الآن)
 */
import { mountLivePulseSection } from '../components/LivePulseSection.js?v=d3b987e0';

export async function renderNowPage($container) {
  $container.innerHTML = '<div id="standalone-live-pulse-container" style="padding-top:20px"></div>';
  mountLivePulseSection('standalone-live-pulse-container');
}
