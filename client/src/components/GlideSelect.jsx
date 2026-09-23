import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

const SIZES = {
  sm: { chip: 28, row: 26, font: 12 },
  md: { chip: 34, row: 30, font: 13 },
  lg: { chip: 40, row: 36, font: 14 }
};
const PAD = 4;
const GAP = 1;
const MENU_GAP = 6;
const DEFAULT_OPTIONS = ['One', 'Two', 'Three'];

const CSS_STYLES = `
@keyframes gs-swap {
  from { opacity: 0.6; filter: blur(2px); }
  to { opacity: 1; filter: none; }
}

.gs-root {
  position: relative;
  display: inline-block;
  user-select: none;
  font-family: inherit;
  vertical-align: middle;
}
.gs-root[data-open="true"] {
  z-index: 1000;
}
.gs-root[data-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
}
.gs-trigger {
  position: relative;
  margin: 0;
  display: inline-flex;
  cursor: pointer;
  touch-action: manipulation;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--gs-border, #cbd5e1);
  padding: 0 10px;
  line-height: 1;
  font-weight: 600;
  outline: none;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
  height: var(--gs-chip);
  border-radius: var(--gs-inner-radius);
  background: var(--gs-surface);
  color: var(--gs-text);
  font-size: var(--gs-font);
  transition: background-color 100ms ease, border-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  max-width: 100%;
}
.gs-trigger:hover:not(:disabled) {
  border-color: #94a3b8;
  background: color-mix(in srgb, var(--gs-highlight) 35%, var(--gs-surface));
}
.gs-trigger:active:not(:disabled) {
  transform: scale(0.98);
}
.gs-trigger[aria-expanded="true"] {
  border-color: var(--gs-accent);
  background: color-mix(in srgb, var(--gs-highlight) 60%, var(--gs-surface));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--gs-accent) 25%, transparent);
}
.gs-trigger:disabled {
  cursor: default;
}
.gs-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gs-label-wrap[data-empty="true"] {
  opacity: 0.6;
}
.gs-arrow {
  display: inline-flex;
  color: color-mix(in srgb, var(--gs-text) 55%, transparent);
  transition: transform 200ms cubic-bezier(0.23,1,0.32,1);
  flex-shrink: 0;
}
.gs-trigger[aria-expanded="true"] .gs-arrow {
  transform: rotate(180deg);
}

/* Floating Menu */
.gs-menu {
  position: absolute;
  z-index: 9999;
  min-width: 100%;
  width: max-content;
  min-width: max(100%, var(--gs-menu-w, 220px));
  max-width: min(520px, calc(100vw - 20px));
  padding: 4px;
  opacity: 0;
  max-height: var(--gs-max-h, 280px);
  overflow-y: auto;
  overflow-x: hidden !important;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  border-radius: var(--gs-radius);
  background: var(--gs-surface);
  border: 1px solid var(--gs-border, #e2e8f0);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  transform-origin: var(--gs-origin);
  transition: opacity var(--gs-pop) cubic-bezier(0.23,1,0.32,1), transform var(--gs-pop) cubic-bezier(0.23,1,0.32,1);
  box-sizing: border-box;
}
.gs-menu::-webkit-scrollbar {
  width: 5px;
  height: 0px !important;
}
.gs-menu::-webkit-scrollbar:horizontal {
  display: none !important;
  height: 0px !important;
  width: 0px !important;
}
.gs-menu::-webkit-scrollbar-track {
  background: transparent;
}
.gs-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.gs-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.gs-menu[data-state="closed"] {
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
}
.gs-menu[data-state="open"] {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.gs-menu[data-side="bottom"] {
  top: calc(100% + 6px);
}
.gs-menu[data-side="top"] {
  bottom: calc(100% + 6px);
}
.gs-menu[data-align="left"] {
  left: 0;
  right: auto;
}
.gs-menu[data-align="right"] {
  right: 0;
  left: auto;
}

/* List & Sliding Pill */
.gs-list {
  position: relative;
  display: flex;
  flex-direction: column;
  touch-action: none;
  gap: 1px;
  margin: 0;
  padding: 0;
  min-width: 100%;
  width: 100%;
  box-sizing: border-box;
}
.gs-pill {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  opacity: 0;
  height: var(--gs-row);
  border-radius: var(--gs-inner-radius);
  background: var(--gs-highlight);
  transition: transform var(--gs-glide) cubic-bezier(0.23,1,0.32,1), opacity 150ms ease;
  z-index: 1;
}

/* Option Row */
.gs-option-row {
  position: relative;
  z-index: 2;
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: 12px;
  padding: 0 10px 0 12px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  height: var(--gs-row);
  border-radius: var(--gs-inner-radius);
  color: var(--gs-text);
  font-size: var(--gs-font);
  transition: background-color 150ms ease;
  box-sizing: border-box;
  white-space: nowrap;
  width: 100%;
}
.gs-option-row[aria-selected="true"] {
  background: color-mix(in srgb, var(--gs-highlight) 50%, transparent);
  font-weight: 700;
}
.gs-list[data-live="true"] .gs-option-row[aria-selected="true"] {
  background: transparent;
}
.gs-option-label {
  flex: 1 1 auto;
  white-space: nowrap;
  font-weight: 600;
  text-align: left;
}
.gs-option-tag {
  flex-shrink: 0;
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 4px;
  background: color-mix(in srgb, var(--gs-text) 8%, var(--gs-surface));
  color: color-mix(in srgb, var(--gs-text) 70%, transparent);
  white-space: nowrap;
  line-height: 1.2;
}
.gs-option-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  visibility: hidden;
  color: var(--gs-accent);
  margin-left: 2px;
}
.gs-option-check[data-on="true"] {
  visibility: visible;
}
`;

const norm = o => (typeof o === 'string' ? { value: o, label: o } : o);
const textOf = it => (typeof it.label === 'string' ? it.label : it.value);
const typeaheadIndex = (items, from, ch) => {
  const c = ch.toLowerCase();
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (textOf(items[i]).toLowerCase().startsWith(c)) return i;
  }
  return from;
};

export default function GlideSelect({
  id: idProp,
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select…',
  showTags = true,
  accentColor = '#ea580c',
  surfaceColor = '#ffffff',
  highlightColor = '#fff7ed',
  textColor = '#0f172a',
  borderColor = '#cbd5e1',
  size = 'md',
  radius = 8,
  menuWidth = 240,
  maxHeight = 280,
  placement = 'bottom',
  align = 'left',
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
  disabled = false,
  ariaLabel = 'Select',
  className = '',
  style = {}
}) {
  const items = options.map(norm);
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = value !== undefined ? value : inner;
  const selected = items.findIndex(it => it.value === current);
  const [phase, setPhase] = useState('closed');
  const [active, setActive] = useState(null);
  const [side, setSide] = useState(placement);
  const [computedAlign, setComputedAlign] = useState(align);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const pillRef = useRef(null);
  const instant = useRef(false);
  const closeTimer = useRef(undefined);
  const scrub = useRef(null);
  const generatedId = useId();
  const selectId = idProp || generatedId;
  const S = SIZES[size] ?? SIZES.md;
  const step = S.row + GAP;
  const popOut = Math.round((popDuration * 2) / 3);

  useLayoutEffect(() => {
    if (phase !== 'open') return;
    const el = menuRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    const need = el.offsetHeight + MENU_GAP;
    setSide(
      placement === 'bottom' && r.bottom + need > window.innerHeight
        ? 'top'
        : placement === 'top' && r.top - need < 0
          ? 'bottom'
          : placement
    );

    const menuWidthPx = el.offsetWidth || 240;
    let nextAlign = align;
    if (align === 'left' && r.left + menuWidthPx > window.innerWidth - 12) {
      nextAlign = 'right';
    } else if (align === 'right' && r.right - menuWidthPx < 12) {
      nextAlign = 'left';
    }
    setComputedAlign(nextAlign);

    el.style.transitionDuration = instant.current ? '0ms' : '';
    el.dataset.state = 'closed';
    void el.offsetHeight;
    el.dataset.state = 'open';

    if (selected >= 0 && el) {
      el.scrollTop = Math.max(0, selected * step - 60);
    }

    const p = pillRef.current;
    if (p) {
      p.style.transition = 'none';
      p.style.transform = `translateY(${Math.max(0, selected) * step}px)`;
      p.style.opacity = '0';
      void p.offsetHeight;
      p.style.transition = '';
    }
  }, [align, phase, placement, selected, step]);

  useLayoutEffect(() => {
    const p = pillRef.current;
    if (!p || phase !== 'open') return;
    if (active === null) {
      p.style.opacity = '0';
      return;
    }
    const jump = instant.current || p.style.opacity !== '1';
    p.style.transitionDuration = jump ? '0ms, 150ms' : '';
    p.style.transform = `translateY(${active * step}px)`;
    p.style.opacity = '1';
    instant.current = false;
  }, [active, phase, step]);

  const open = viaKey => {
    if (disabled) return;
    clearTimeout(closeTimer.current);
    instant.current = true;
    setActive(selected >= 0 ? selected : viaKey ? 0 : null);
    setPhase('open');
  };

  const close = mode => {
    setActive(null);
    clearTimeout(closeTimer.current);
    const el = menuRef.current;
    if (mode === 'instant' || !el) {
      setPhase('closed');
      return;
    }
    el.style.transitionDuration = '';
    el.dataset.state = 'closed';
    setPhase('closing');
    closeTimer.current = setTimeout(() => setPhase('closed'), popOut + 20);
  };

  const pick = (i, viaKey) => {
    const it = items[i];
    if (!it) {
      close('instant');
      return;
    }
    if (it.value !== current) {
      if (value === undefined) setInner(it.value);
      onChange?.(it.value, it);
      if (!viaKey && rootRef.current) rootRef.current.dataset.swap = '';
    }
    close('instant');
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onTriggerKey = e => {
    const k = e.key;
    const n = items.length;
    const cur = active ?? Math.max(0, selected);
    if (phase !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
      return;
    }
    const go = i => {
      e.preventDefault();
      instant.current = true;
      setActive(Math.min(n - 1, Math.max(0, i)));
    };
    if (k === 'ArrowDown' || k === 'ArrowUp') go(active === null ? cur : cur + (k === 'ArrowDown' ? 1 : -1));
    else if (k === 'Home' || k === 'End') go(k === 'Home' ? 0 : n - 1);
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(cur, true);
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault();
      close('instant');
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) go(typeaheadIndex(items, cur, k));
  };

  useEffect(() => {
    if (phase === 'closed') return undefined;
    const onDown = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close('pop');
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [phase]);

  useEffect(() => {
    if (disabled && phase !== 'closed') close('instant');
  }, [disabled]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const rowAt = y => {
    const s = scrub.current;
    if (!s) return null;
    const scrollOffset = menuRef.current ? menuRef.current.scrollTop : 0;
    const i = Math.floor((y - s.top + scrollOffset - PAD) / step);
    return i >= 0 && i < items.length ? i : null;
  };

  const onListDown = e => {
    if (scrub.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    scrub.current = { id: e.pointerId, top: e.currentTarget.getBoundingClientRect().top };
    instant.current = true;
    setActive(rowAt(e.clientY));
  };

  const onListMove = e => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = rowAt(e.clientY);
    if (i !== active) setActive(i);
  };

  const onListUp = e => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = e.type === 'pointerup' ? rowAt(e.clientY) : null;
    scrub.current = null;
    if (i !== null) pick(i, false);
    else if (!rememberPosition) setActive(null);
  };

  const onListOver = e => {
    if (e.pointerType === 'touch' || scrub.current) return;
    const row = e.target.closest('[data-index]');
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== active) setActive(i);
  };

  const origin = `${side === 'bottom' ? 'top' : 'bottom'} ${computedAlign}`;

  return (
    <div
      ref={rootRef}
      className={`gs-root ${className}`}
      data-size={size}
      data-disabled={disabled ? 'true' : undefined}
      data-open={phase === 'open' ? 'true' : undefined}
      style={{
        '--gs-accent': accentColor,
        '--gs-surface': surfaceColor,
        '--gs-highlight': highlightColor,
        '--gs-text': textColor,
        '--gs-border': borderColor,
        '--gs-radius': `${radius}px`,
        '--gs-inner-radius': `${Math.max(3, radius - 2)}px`,
        '--gs-chip': `${S.chip}px`,
        '--gs-row': `${S.row}px`,
        '--gs-font': `${S.font}px`,
        '--gs-menu-w': typeof menuWidth === 'number' ? `${menuWidth}px` : menuWidth,
        '--gs-max-h': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
        '--gs-pop': `${popDuration}ms`,
        '--gs-pop-out': `${popOut}ms`,
        '--gs-glide': `${glideDuration}ms`,
        '--gs-origin': origin,
        ...style
      }}
      onAnimationEnd={e => {
        if (e.animationName === 'gs-swap' && rootRef.current) delete rootRef.current.dataset.swap;
      }}
    >
      <style>{CSS_STYLES}</style>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase === 'open'}
        aria-controls={`${selectId}-list`}
        aria-activedescendant={active !== null ? `${selectId}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        className="gs-trigger"
        onPointerDown={e => {
          if (e.button !== 0 || disabled) return;
          e.currentTarget.focus({ preventScroll: true });
          if (phase === 'open') close('pop');
          else open(false);
        }}
        onKeyDown={onTriggerKey}
      >
        <span
          className="gs-label-wrap"
          key={current}
          data-empty={selected < 0 ? 'true' : undefined}
        >
          {selected >= 0 ? items[selected].label : placeholder}
        </span>
        <span className="gs-arrow" aria-hidden="true">
          <HugeiconsIcon icon={ArrowDown01Icon} size={13} strokeWidth={2.5} />
        </span>
      </button>

      {phase !== 'closed' ? (
        <div
          ref={menuRef}
          className="gs-menu"
          data-state="open"
          data-side={side}
          data-align={computedAlign}
        >
          <div
            id={`${selectId}-list`}
            role="listbox"
            aria-label={ariaLabel}
            className="gs-list"
            data-live={active !== null ? 'true' : undefined}
            onPointerOver={onListOver}
            onPointerLeave={() => {
              if (!scrub.current && !rememberPosition) setActive(null);
            }}
            onPointerDown={onListDown}
            onPointerMove={onListMove}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span
              ref={pillRef}
              className="gs-pill"
              aria-hidden="true"
            />
            {items.map((it, i) => (
              <div
                key={it.value}
                id={`${selectId}-${i}`}
                role="option"
                aria-selected={i === selected}
                data-index={i}
                className="gs-option-row"
              >
                <span className="gs-option-label">{it.label}</span>
                {showTags && it.tag ? (
                  <span className="gs-option-tag">
                    {it.tag}
                  </span>
                ) : null}
                <span
                  className="gs-option-check"
                  data-on={i === selected ? 'true' : undefined}
                  aria-hidden="true"
                >
                  <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.5} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
