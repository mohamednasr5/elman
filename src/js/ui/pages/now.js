/**
 * now.js — المنزلة والمطرية الآن (يحدث الآن)
 */
import { mountLivePulseSection } from '../components/LivePulseSection.js?v=61d65a4e';

export async function renderNowPage($container) {
  $container.innerHTML = '<div id="standalone-live-pulse-container" style="padding-top:20px"></div>';
  mountLivePulseSection('standalone-live-pulse-container');
}
