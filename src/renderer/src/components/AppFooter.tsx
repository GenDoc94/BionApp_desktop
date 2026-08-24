import pkg from "bionapp-pkg";

const version = pkg.version;
const year = new Date().getFullYear();

export default function AppFooter() {
  return (
    <footer className="bionapp-footer mt-3 pt-2 border-t border-border text-center text-xs text-muted-foreground">
      <p className="font-medium text-foreground/80">
        BionApp v{version} · Gestión de muestras de OGM
      </p>
      <p className="mt-1 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>© {year}</span>
        <a
          href="https://github.com/GenDoc94"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          GenDoc94
          <img
            src="https://raw.githubusercontent.com/GenDoc94/PCR_Analyser/main/logo_hem.png"
            alt=""
            className="h-3 w-auto"
            aria-hidden
          />
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://buymeacoffee.com/gendoc94"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          Buy me a coffee
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt=""
            className="h-3 w-auto"
            aria-hidden
          />
        </a>
        <span aria-hidden>·</span>
        <span>MIT License</span>
      </p>
    </footer>
  );
}
