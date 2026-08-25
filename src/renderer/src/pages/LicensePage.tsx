import { Scale } from "lucide-react";
import SubpageShell from "../components/SubpageShell";
import { MIT_LICENSE_TEXT } from "../content/mitLicense";

export default function LicensePage() {
  return (
    <SubpageShell title="Licencia MIT" icon={Scale} maxWidthClass="max-w-3xl">
      <div className="bionapp-panel p-4 sm:p-6">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-mono">
          {MIT_LICENSE_TEXT.trim()}
        </pre>
      </div>
    </SubpageShell>
  );
}
