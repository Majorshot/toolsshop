import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FiAlertCircle, FiTrash2, FiLogOut, FiCheck, FiX } from "react-icons/fi";

const ConfirmationContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    return {
      confirm: ({ onConfirm }) => {
        if (onConfirm) onConfirm();
        return Promise.resolve(true);
      }
    };
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger",
    iconType: "alert",
    itemPreview: null,
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const icon = options.iconType || (
        (options.title || "").toLowerCase().includes("sign out") || (options.title || "").toLowerCase().includes("log out")
          ? "logout"
          : (options.title || "").toLowerCase().includes("delete") || (options.title || "").toLowerCase().includes("remove")
          ? "trash"
          : "alert"
      );

      setModalState({
        isOpen: true,
        title: options.title || "Are you sure?",
        description: options.description || "Please confirm this action.",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "danger",
        iconType: icon,
        itemPreview: options.itemPreview || null,
        onConfirm: async () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          if (options.onConfirm) await options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <SpringModal
        isOpen={modalState.isOpen}
        setIsOpen={(open) => setModalState((prev) => ({ ...prev, isOpen: open }))}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        iconType={modalState.iconType}
        itemPreview={modalState.itemPreview}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </ConfirmationContext.Provider>
  );
};

export const SpringModal = ({
  isOpen,
  setIsOpen,
  title = "Are you sure?",
  description = "This action requires confirmation.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  iconType = "alert",
  itemPreview = null,
  onConfirm,
  onCancel,
  children
}) => {
  const getTheme = () => {
    switch (variant) {
      case "warning":
        return {
          gradient: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
          accentColor: "#ea580c",
          shadow: "0 25px 50px -12px rgba(234, 88, 12, 0.45), 0 10px 20px -5px rgba(0, 0, 0, 0.25)"
        };
      case "dark":
        return {
          gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          accentColor: "#0f172a",
          shadow: "0 25px 50px -12px rgba(15, 23, 42, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3)"
        };
      case "brand":
      case "danger":
      default:
        // Variathu Official Red Theme
        return {
          gradient: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
          accentColor: "#dc2626",
          shadow: "0 25px 50px -12px rgba(220, 38, 38, 0.45), 0 10px 20px -5px rgba(0, 0, 0, 0.25)"
        };
    }
  };

  const theme = getTheme();

  const getIcon = () => {
    switch (iconType) {
      case "trash":
        return FiTrash2;
      case "logout":
        return FiLogOut;
      case "alert":
      default:
        return FiAlertCircle;
    }
  };

  const IconComponent = getIcon();

  const handleClose = () => {
    if (setIsOpen) setIsOpen(false);
    if (onCancel) onCancel();
  };

  const handleConfirmAction = () => {
    if (onConfirm) onConfirm();
    else if (setIsOpen) setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "grid",
            placeItems: "center",
            padding: "20px",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            overflowY: "auto",
            cursor: "pointer"
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: "12.5deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            exit={{ scale: 0, rotate: "0deg" }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "460px",
              borderRadius: "16px",
              padding: "28px 24px",
              color: "#ffffff",
              background: theme.gradient,
              boxShadow: theme.shadow,
              overflow: "hidden",
              cursor: "default",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
          >
            {/* Big watermark background icon rotated in corner */}
            <IconComponent
              style={{
                position: "absolute",
                top: "-70px",
                left: "-70px",
                fontSize: "240px",
                color: "rgba(255, 255, 255, 0.08)",
                transform: "rotate(12deg)",
                pointerEvents: "none",
                zIndex: 0
              }}
            />

            <div style={{ position: "relative", zIndex: 10 }}>
              {/* Circular icon badge in center */}
              <div
                style={{
                  width: "62px",
                  height: "62px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  color: theme.accentColor,
                  display: "grid",
                  placeContent: "center",
                  fontSize: "1.75rem",
                  margin: "0 auto 16px auto",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)"
                }}
              >
                <IconComponent />
              </div>

              {/* Modal Title */}
              <h3
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: "8px",
                  letterSpacing: "-0.02em",
                  color: "#ffffff"
                }}
              >
                {title}
              </h3>

              {/* Modal Description */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.88rem",
                  lineHeight: "1.5",
                  color: "rgba(255, 255, 255, 0.92)",
                  marginBottom: itemPreview || children ? "14px" : "24px"
                }}
              >
                {description}
              </p>

              {/* Optional Item Preview */}
              {itemPreview && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.14)",
                    border: "1px solid rgba(255, 255, 255, 0.22)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  {itemPreview}
                </div>
              )}

              {children}

              {/* Action Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px"
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    backgroundColor: "transparent",
                    border: "1.5px solid rgba(255, 255, 255, 0.35)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    outline: "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
                  }}
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAction}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "none",
                    color: theme.accentColor,
                    fontWeight: "800",
                    fontSize: "0.88rem",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.15s ease",
                    outline: "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.2)";
                  }}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpringModal;
