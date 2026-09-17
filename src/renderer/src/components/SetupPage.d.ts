export default function SetupPage({ onDone }: {
    onDone: (path: string, adminCode: string) => Promise<void>;
}): import("react").JSX.Element;
