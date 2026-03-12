import { createContext, useContext, useState, type ReactNode } from "react";

interface ReadOnlyContextType {
  isReadOnly: boolean;
  mirrorCompanyId: string | null;
  mirrorCompanyName: string | null;
  enterMirror: (companyId: string, companyName: string) => void;
  exitMirror: () => void;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: false,
  mirrorCompanyId: null,
  mirrorCompanyName: null,
  enterMirror: () => {},
  exitMirror: () => {},
});

export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  const [mirrorCompanyId, setMirrorCompanyId] = useState<string | null>(null);
  const [mirrorCompanyName, setMirrorCompanyName] = useState<string | null>(null);

  const enterMirror = (companyId: string, companyName: string) => {
    setMirrorCompanyId(companyId);
    setMirrorCompanyName(companyName);
  };

  const exitMirror = () => {
    setMirrorCompanyId(null);
    setMirrorCompanyName(null);
  };

  return (
    <ReadOnlyContext.Provider value={{
      isReadOnly: !!mirrorCompanyId,
      mirrorCompanyId,
      mirrorCompanyName,
      enterMirror,
      exitMirror,
    }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}
