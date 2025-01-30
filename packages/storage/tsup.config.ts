import { defineConfig, type Options } from "tsup";

import { tsupConfig } from "../../tsup.config";

export default defineConfig({
    ...(tsupConfig as Options),
});
