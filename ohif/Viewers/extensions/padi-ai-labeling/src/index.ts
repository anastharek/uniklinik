import { id } from './id';
import getPanelModule from './getPanelModule';
import getCommandsModule from './getCommandsModule';

export default {
  /** Unique extension id (from package.json name). */
  id,
  /**
   * Registers the "AI Labeling" right-side panel (panel-only authentication;
   * the rest of OHIF remains open and login-free).
   */
  getPanelModule,
  /** Commands for activating the labeling tools. */
  getCommandsModule,
};
