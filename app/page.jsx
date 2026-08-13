import { LibraryProvider } from "@/lib/LibraryContext";
import UajeApp from "@/components/UajeApp";

export default function Page() {
  return (
    <LibraryProvider>
      <UajeApp />
    </LibraryProvider>
  );
}
