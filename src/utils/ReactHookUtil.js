import { useState, useEffect } from "react";

export default function useUserOnClientSideRendering() {
        // we always start off in "SSR mode", to ensure our initial browser render
    // matches the SSR render
    const [isSsr, setIsSsr] = useState(false);
  
    useEffect(() => {
      // `useEffect` never runs on the server, so we must be on the client if
      // we hit this block
      setIsSsr(true);
    }, []);
  
    return isSsr;
}

export const useDocument = () => {
    const [myDocument, setMyDocument] = useState(null)
     
    useEffect(() => {
      setMyDocument(document)
    }, [])
  
    return myDocument
  }
  