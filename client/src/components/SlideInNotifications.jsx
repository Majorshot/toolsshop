import React, { useEffect, useState } from "react";
import { FiCheckSquare, FiX, FiAlertCircle, FiInfo } from "react-icons/fi";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../context/CartContext";

export const NOTIFICATION_TTL = 5000;

export const Notification = ({ text, id, removeNotif, type = 'brand' }) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      removeNotif(id);
    }, NOTIFICATION_TTL);

    return () => clearTimeout(timeoutRef);
  }, [id, removeNotif]);

  // Determine styling based on type and brand color palette
  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          shadow: '0 10px 25px -4px rgba(22, 163, 74, 0.35), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
          iconColor: '#bbf7d0',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          Icon: FiCheckSquare
        };
      case 'warning':
      case 'amber':
        return {
          bg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          shadow: '0 10px 25px -4px rgba(234, 88, 12, 0.35), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
          iconColor: '#fed7aa',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          Icon: FiAlertCircle
        };
      case 'info':
        return {
          bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          shadow: '0 10px 25px -4px rgba(2, 132, 199, 0.35), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
          iconColor: '#bae6fd',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          Icon: FiInfo
        };
      case 'dark':
        return {
          bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          shadow: '0 10px 25px -4px rgba(15, 23, 42, 0.4), 0 4px 10px -2px rgba(0, 0, 0, 0.12)',
          iconColor: '#facc15',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          Icon: FiCheckSquare
        };
      case 'brand':
      default:
        // Variathu Official Red & Golden Yellow from logo
        return {
          bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          shadow: '0 10px 25px -4px rgba(220, 38, 38, 0.38), 0 4px 10px -2px rgba(0, 0, 0, 0.12)',
          iconColor: '#fef08a', // Variathu Logo Golden Yellow
          borderColor: 'rgba(255, 255, 255, 0.25)',
          Icon: FiCheckSquare
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <motion.div
      layout
      initial={{ y: -15, scale: 0.95, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        borderRadius: '10px',
        gap: '10px',
        fontSize: '0.85rem',
        fontWeight: '600',
        lineHeight: 1.45,
        color: '#ffffff',
        background: theme.bg,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: theme.shadow,
        pointerEvents: 'auto',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        backdropFilter: 'blur(8px)',
        userSelect: 'none'
      }}
    >
      <IconComponent
        size={17}
        style={{
          marginTop: '2px',
          flexShrink: 0,
          color: theme.iconColor
        }}
      />
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{text}</span>
      <button
        onClick={() => removeNotif(id)}
        aria-label="Close notification"
        style={{
          marginLeft: 'auto',
          marginTop: '1px',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '2px',
          opacity: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'opacity 0.2s ease, transform 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FiX size={15} />
      </button>
    </motion.div>
  );
};

const SlideInNotifications = ({
  notifications: propNotifications,
  removeNotif: propRemoveNotif,
  showDemoButton = false
}) => {
  // If props are passed, use them; otherwise fallback to CartContext or local state
  const cartContext = useCart();
  const [localNotifications, setLocalNotifications] = useState([]);

  const notifications =
    propNotifications !== undefined
      ? propNotifications
      : cartContext?.notifications !== undefined
      ? cartContext.notifications
      : localNotifications;

  const removeNotif =
    propRemoveNotif !== undefined
      ? propRemoveNotif
      : cartContext?.removeNotif !== undefined
      ? cartContext.removeNotif
      : (id) => setLocalNotifications((pv) => pv.filter((n) => n.id !== id));

  const addLocalNotif = (text, type = 'brand') => {
    if (cartContext?.showToast) {
      cartContext.showToast(text, type);
    } else {
      setLocalNotifications((pv) => [
        { id: Date.now() + Math.random(), text, type },
        ...pv
      ]);
    }
  };

  return (
    <>
      {showDemoButton && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <button
            onClick={() => {
              const sampleNotifs = [
                "🎉 Added TOUGH-DRILL 18V to your cart!",
                "✅ Verified! Special coupon discount applied",
                "📦 Order #VPT-8921 has been packed for dispatch",
                "🔔 Stock limit: Only 2 units remaining for this item"
              ];
              const randomText = sampleNotifs[Math.floor(Math.random() * sampleNotifs.length)];
              addLocalNotif(randomText);
            }}
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'background-color 0.2s, transform 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            Add Notification
          </button>
        </div>
      )}

      {/* Floating Notification Portal */}
      <div
        style={{
          position: 'fixed',
          top: '84px',
          right: '20px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: 'min(380px, calc(100vw - 32px))',
          pointerEvents: 'none'
        }}
      >
        <AnimatePresence>
          {notifications &&
            notifications.map((n) => (
              <Notification removeNotif={removeNotif} {...n} key={n.id} />
            ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export const generateRandomNotif = () => {
  const names = [
    "John Anderson",
    "Emily Peterson",
    "Frank Daniels",
    "Laura Williams",
    "Donald Sanders",
    "Tom Smith",
    "Alexandra Black",
  ];

  const randomIndex = Math.floor(Math.random() * names.length);

  return {
    id: Date.now() + Math.random(),
    text: `New notification from ${names[randomIndex]}`,
    type: 'brand'
  };
};

export default SlideInNotifications;
