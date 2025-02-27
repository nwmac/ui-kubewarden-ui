import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

import kubewardenRoutes from './routes/kubewarden-routes';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load product
  plugin.addProduct(require('./config/kubewarden'));

  // Routes
  plugin.addRoutes(kubewardenRoutes);
}
