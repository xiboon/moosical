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
  ];

  dotenv.disableHint = true;
  
  env = with pkgs; {
    PRISMA_SCHEMA_ENGINE_BINARY = "${prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node";
    PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine";
    PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt";
    LD_LIBRARY_PATH = "";
  };

  services.postgres = {
    enable = true;
    listen_addresses = "127.0.0.1";
    initialScript = ''
    CREATE USER moosical WITH ENCRYPTED PASSWORD '1234' SUPERUSER;
    '';
  };
}
