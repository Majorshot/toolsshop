import React, { useState } from "react";
import {
  FiChevronDown,
  FiChevronsRight,
} from "react-icons/fi";
import { motion } from "motion/react";

export const DashboardSidebar = ({
  open: controlledOpen,
  setOpen: controlledSetOpen,
  title = "Variathu Power Tools",
  subtitle = "Store Portal",
  logo,
  onTitleClick,
  items = [],
  bottomItems = [],
}) => {
  const [internalOpen, setInternalOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 900;
    }
    return true;
  });

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  return (
    <motion.nav
      layout
      className="dashboard-sidebar-nav"
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        borderRight: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        padding: "10px 8px 60px 8px",
        width: open ? "230px" : "64px",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        boxShadow: "1px 0 8px rgba(0, 0, 0, 0.02)",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxSizing: "border-box"
      }}
    >
      <TitleSection
        open={open}
        title={title}
        subtitle={subtitle}
        logo={logo}
        onTitleClick={onTitleClick}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "2px"
        }}
      >
        {items.map((item) => (
          <SidebarOption
            key={item.id || item.title}
            Icon={item.icon}
            title={item.title}
            selected={Boolean(item.selected)}
            onClick={item.onClick}
            open={open}
            notifs={item.notifs}
            notifsColor={item.notifsColor}
            variant={item.variant}
          />
        ))}

        {bottomItems.length > 0 && (
          <div
            style={{
              marginTop: "auto",
              paddingTop: "8px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            {bottomItems.map((item) => (
              <SidebarOption
                key={item.id || item.title}
                Icon={item.icon}
                title={item.title}
                selected={Boolean(item.selected)}
                onClick={item.onClick}
                open={open}
                notifs={item.notifs}
                notifsColor={item.notifsColor}
                variant={item.variant}
              />
            ))}
          </div>
        )}
      </div>

      <ToggleClose open={open} setOpen={setOpen} />
    </motion.nav>
  );
};

export const SidebarOption = ({
  Icon,
  title,
  selected,
  onClick,
  open,
  notifs,
  notifsColor,
  variant = "default"
}) => {
  const isDanger = variant === "danger";

  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      title={!open ? (notifs ? `${title} (${notifs})` : title) : undefined}
      style={{
        position: "relative",
        display: "flex",
        height: "42px",
        width: "100%",
        alignItems: "center",
        borderRadius: "8px",
        border: selected
          ? "1px solid #fee2e2"
          : "1px solid transparent",
        backgroundColor: selected
          ? "#fef2f2"
          : "transparent",
        color: selected
          ? "#dc2626"
          : isDanger
          ? "#ef4444"
          : "#64748b",
        fontWeight: selected ? "700" : "600",
        cursor: "pointer",
        padding: "0 4px",
        transition: "all 0.15s ease",
        textAlign: "left",
        outline: "none"
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = isDanger ? "#fef2f2" : "#f8fafc";
          e.currentTarget.style.color = isDanger ? "#dc2626" : "#0f172a";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = isDanger ? "#ef4444" : "#64748b";
        }
      }}
    >
      <motion.div
        layout
        style={{
          display: "grid",
          height: "100%",
          width: "40px",
          placeContent: "center",
          fontSize: "1.18rem",
          flexShrink: 0,
          color: selected ? "#dc2626" : isDanger ? "#ef4444" : "#64748b"
        }}
      >
        {React.isValidElement(Icon) ? (
          Icon
        ) : Icon ? (
          React.createElement(Icon, { size: 18 })
        ) : null}
      </motion.div>

      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: "0.82rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: notifs ? "28px" : "6px",
            flex: 1
          }}
        >
          {title}
        </motion.span>
      )}

      {notifs !== undefined && notifs !== null && notifs !== 0 && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: notifsColor || "#dc2626",
            color: "#ffffff",
            fontSize: "0.68rem",
            fontWeight: "800",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 5px rgba(220, 38, 38, 0.25)"
          }}
        >
          {notifs}
        </motion.span>
      )}

      {notifs !== undefined && notifs !== null && notifs !== 0 && !open && (
        <span
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: notifsColor || "#dc2626",
            border: "1.5px solid #ffffff"
          }}
        />
      )}
    </motion.button>
  );
};

const TitleSection = ({ open, title, subtitle, logo, onTitleClick }) => {
  return (
    <div
      style={{
        marginBottom: "12px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "12px"
      }}
    >
      <div
        onClick={onTitleClick}
        style={{
          display: "flex",
          cursor: onTitleClick ? "pointer" : "default",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "8px",
          padding: "4px",
          transition: "background-color 0.15s ease",
          minHeight: "44px"
        }}
        onMouseEnter={(e) => {
          if (onTitleClick) e.currentTarget.style.backgroundColor = "#f8fafc";
        }}
        onMouseLeave={(e) => {
          if (onTitleClick) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {logo || <DefaultLogo />}
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ minWidth: 0, overflow: "hidden" }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: "800",
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  color: "#64748b",
                  fontWeight: "600",
                  whiteSpace: "nowrap"
                }}
              >
                {subtitle}
              </span>
            </motion.div>
          )}
        </div>
        {open && onTitleClick && (
          <FiChevronDown style={{ color: "#94a3b8", marginRight: "4px", flexShrink: 0 }} />
        )}
      </div>
    </div>
  );
};

export const DefaultLogo = () => {
  return (
    <motion.div
      layout
      style={{
        display: "grid",
        width: "38px",
        height: "38px",
        flexShrink: 0,
        placeContent: "center",
        borderRadius: "8px",
        backgroundColor: "#dc2626",
        boxShadow: "0 4px 10px rgba(220, 38, 38, 0.28)",
        color: "#ffffff"
      }}
    >
      <img
        src="/Logo.jpeg"
        alt="Logo"
        style={{
          width: "28px",
          height: "28px",
          objectFit: "contain",
          borderRadius: "4px"
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </motion.div>
  );
};

const ToggleClose = ({ open, setOpen }) => {
  return (
    <motion.button
      layout
      type="button"
      onClick={() => setOpen((pv) => !pv)}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "50px",
        border: "none",
        borderTop: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        color: "#64748b",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        padding: "0 8px",
        display: "flex",
        alignItems: "center"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
      title={open ? "Hide sidebar" : "Expand sidebar"}
    >
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <motion.div
          layout
          style={{
            display: "grid",
            width: "40px",
            height: "40px",
            placeContent: "center",
            fontSize: "1.18rem",
            flexShrink: 0
          }}
        >
          <FiChevronsRight
            style={{
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)"
            }}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}
          >
            Hide
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

export default DashboardSidebar;
