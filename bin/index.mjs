#!/usr/bin/env node
import("../dist/cli.js")
  .then(({ run }) => run())
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
