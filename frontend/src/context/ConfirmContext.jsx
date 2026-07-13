import { useState, useCallback, createContext, useContext } from "react";

// Lightweight confirm-before-destructive-action modal. Rather than
// scattering window.confirm() calls (which look jarring and can't be
// styled), any component can call useConfirm() and await a promise
// that resolves true/false based on what the user clicks.
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, resolve }

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({
        message,
        resolve,
        confirmText: options.confirmText || "Delete",
        confirmClass: options.confirmClass || "btn-danger",
      });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => handle(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure?</h3>
            <p>{state.message}</p>
            <div className="button-row modal-actions">
              <button className="btn btn-ghost" onClick={() => handle(false)}>
                Cancel
              </button>
              <button className={`btn ${state.confirmClass}`} onClick={() => handle(true)}>
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
