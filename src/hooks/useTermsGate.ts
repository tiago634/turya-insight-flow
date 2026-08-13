import { useEffect, useRef, useState } from "react";

export function useTermsGate() {
  // Termos: mostram apenas na primeira tentativa desta sessão (e re-aparecem após refresh).
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const termsResolverRef = useRef<((val: boolean) => void) | null>(null);

  const settleTerms = (val: boolean) => {
    termsResolverRef.current?.(val);
    termsResolverRef.current = null;
  };

  useEffect(() => {
    return () => {
      termsResolverRef.current?.(false);
      termsResolverRef.current = null;
    };
  }, []);

  const requestTermsAcceptance = () => {
    setTermsOpen(true);
    return new Promise<boolean>((resolve) => {
      termsResolverRef.current = resolve;
    });
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTermsOpen(false);
    settleTerms(true);
  };

  const handleCancelTerms = () => {
    setTermsOpen(false);
    settleTerms(false);
  };

  const handleOpenTermsFromFooter = () => {
    // Abre o modal para leitura.
    // Se o usuário concordar, o aceite será aplicado da mesma forma do primeiro upload.
    setTermsOpen(true);
  };

  return {
    termsAccepted,
    termsOpen,
    requestTermsAcceptance,
    handleAcceptTerms,
    handleCancelTerms,
    handleOpenTermsFromFooter,
  };
}
