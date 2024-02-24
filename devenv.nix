{ pkgs, ... }:

{
  languages.javascript = {
    enable = true;
    npm.install.enable = true;
  };

  packages = with pkgs; [
    ffmpeg
    vips
    openssl
    nodePackages.prisma
  ];

  env = with pkgs; {
    PRISMA_SCHEMA_ENGINE_BINARY = "${prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node";
    PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine";
    PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt";
    LD_LIBRARY_PATH = "";
  };

  enterShell = ''
  npx prisma generate
  npx tsc
  '';

  processes.moosical.exec = "npm start";
}